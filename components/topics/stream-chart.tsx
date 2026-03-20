"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { TopicTimelineEntry, TOPIC_COLORS } from "@/lib/graph-data";
import { cn } from "@/lib/utils";

interface StreamChartProps {
  data: TopicTimelineEntry[];
  visibleTopics: string[];
  onTopicHover: (topic: string | null, episode: TopicTimelineEntry | null) => void;
}

export function StreamChart({
  data,
  visibleTopics,
  onTopicHover,
}: StreamChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height: Math.max(400, height) });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const { width, height } = dimensions;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Get all topic keys
    const allTopics = Object.keys(TOPIC_COLORS);
    const topics = allTopics.filter((t) => visibleTopics.includes(t));

    if (topics.length === 0) return;

    // Prepare data for stack
    const stackData = data.map((d) => {
      const entry: Record<string, number | string | Date> = {
        date: new Date(d.date),
        episode: d.episode,
        title: d.title,
      };
      topics.forEach((topic) => {
        entry[topic] = d.topics[topic] || 0;
      });
      return entry;
    });

    // Create scales
    const x = d3
      .scaleTime()
      .domain(d3.extent(stackData, (d) => d.date as Date) as [Date, Date])
      .range([0, innerWidth]);

    // Create stack generator
    const stack = d3
      .stack<Record<string, number | string | Date>>()
      .keys(topics)
      .offset(d3.stackOffsetWiggle)
      .order(d3.stackOrderInsideOut);

    const series = stack(stackData);

    const y = d3
      .scaleLinear()
      .domain([
        d3.min(series, (s) => d3.min(s, (d) => d[0])) || 0,
        d3.max(series, (s) => d3.max(s, (d) => d[1])) || 0,
      ])
      .range([innerHeight, 0]);

    // Create area generator
    const area = d3
      .area<d3.SeriesPoint<Record<string, number | string | Date>>>()
      .x((d) => x(d.data.date as Date))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]))
      .curve(d3.curveBasis);

    // Create main group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Draw areas
    g.selectAll("path")
      .data(series)
      .join("path")
      .attr("fill", (d) => {
        const color = TOPIC_COLORS[d.key];
        return color || "var(--md-outline)";
      })
      .attr("fill-opacity", 0.8)
      .attr("d", area)
      .attr("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("fill-opacity", 1);

        // Find closest data point
        const [mx] = d3.pointer(event);
        const date = x.invert(mx);
        const bisect = d3.bisector(
          (p: Record<string, number | string | Date>) => p.date as Date
        ).left;
        const index = bisect(stackData, date);
        const dataPoint = data[Math.min(index, data.length - 1)];

        onTopicHover(d.key, dataPoint);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("fill-opacity", 0.8);
        onTopicHover(null, null);
      });

    // X axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(d3.timeYear.every(1))
          .tickFormat((d) => d3.timeFormat("%Y")(d as Date))
      )
      .call((g) => g.select(".domain").attr("stroke", "var(--md-outline-variant)"))
      .call((g) =>
        g.selectAll(".tick line").attr("stroke", "var(--md-outline-variant)")
      )
      .call((g) =>
        g
          .selectAll(".tick text")
          .attr("fill", "var(--md-on-surface-variant)")
          .attr("font-size", "12px")
      );

  }, [data, visibleTopics, dimensions, onTopicHover]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px]">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
}
