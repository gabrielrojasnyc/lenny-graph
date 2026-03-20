"use client";

import { useState, useEffect, useCallback } from "react";
import { TopAppBar } from "@/components/ui/top-app-bar";
import { Card } from "@/components/ui/card";
import { StreamChart } from "@/components/topics/stream-chart";
import { TopicLegend } from "@/components/topics/topic-legend";
import {
  TopicTimelineEntry,
  TopicTimelineData,
  TOPIC_COLORS,
  loadTopicTimeline,
} from "@/lib/graph-data";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

export default function TopicsPage() {
  const [data, setData] = useState<TopicTimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleTopics, setVisibleTopics] = useState<string[]>([]);
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);
  const [hoveredEpisode, setHoveredEpisode] =
    useState<TopicTimelineEntry | null>(null);

  useEffect(() => {
    loadTopicTimeline()
      .then((timelineData) => {
        setData(timelineData);
        // Initialize visible topics from actual data categories
        if (timelineData.categories) {
          setVisibleTopics(timelineData.categories);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggleTopic = (topic: string) => {
    setVisibleTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleTopicHover = useCallback(
    (topic: string | null, episode: TopicTimelineEntry | null) => {
      setHoveredTopic(topic);
      setHoveredEpisode(episode);
    },
    []
  );

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[var(--md-primary)] border-t-transparent animate-spin" />
          <p className="body-large text-[var(--md-on-surface-variant)]">
            Loading topic data...
          </p>
        </div>
      </div>
    );
  }

  const episodes = data.episodes || [];
  const categories = data.categories || [];

  return (
    <>
      <TopAppBar
        title="Topic DNA"
        subtitle={`Topic evolution across ${episodes.length} episodes`}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Intro section */}
        <div className="px-4 md:px-6 py-4 border-b border-[var(--md-outline-variant)]">
          <Card variant="filled" className="p-4">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full",
                  "bg-[var(--md-tertiary)] text-[var(--md-on-tertiary)]"
                )}
              >
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="title-medium text-[var(--md-on-surface)] mb-1">
                  How Podcast Topics Have Evolved
                </h2>
                <p className="body-medium text-[var(--md-on-surface-variant)]">
                  This streamgraph shows how discussion topics have shifted over
                  time. Notice the explosion of AI/ML content in late 2024 and
                  the consistent focus on Product throughout.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Legend */}
        <div className="px-4 md:px-6 py-3 border-b border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)]">
          <TopicLegend
            visibleTopics={visibleTopics}
            onToggleTopic={handleToggleTopic}
            allTopics={categories}
          />
        </div>

        {/* Chart area */}
        <div className="flex-1 relative p-4 md:p-6">
          <StreamChart
            data={episodes}
            visibleTopics={visibleTopics}
            onTopicHover={handleTopicHover}
            allTopics={categories}
          />

          {/* Hover tooltip */}
          {hoveredTopic && hoveredEpisode && (
            <Card
              variant="elevated"
              className={cn(
                "absolute top-8 right-8 z-10",
                "w-72 p-4",
                "pointer-events-none"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TOPIC_COLORS[hoveredTopic] || "#888" }}
                />
                <span className="label-large text-[var(--md-on-surface)]">
                  {hoveredTopic}
                </span>
              </div>
              <p className="title-small text-[var(--md-on-surface)] mb-1">
                {hoveredEpisode.title}
              </p>
              <p className="body-small text-[var(--md-on-surface-variant)]">
                {hoveredEpisode.guest && `${hoveredEpisode.guest} · `}
                {new Date(hoveredEpisode.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <div className="mt-3 pt-3 border-t border-[var(--md-outline-variant)]">
                <p className="label-small text-[var(--md-on-surface-variant)]">
                  Topic Weight
                </p>
                <p className="headline-small text-[var(--md-on-surface)]">
                  {(hoveredEpisode.topics[hoveredTopic] || 0).toFixed(1)}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Stats footer */}
        <div className="px-4 md:px-6 py-4 border-t border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)]">
          <div className="flex flex-wrap gap-6">
            {visibleTopics.slice(0, 4).map((topic) => {
              const totalWeight = episodes.reduce(
                (sum, ep) => sum + (ep.topics[topic] || 0),
                0
              );
              const avgWeight = episodes.length > 0 ? totalWeight / episodes.length : 0;

              return (
                <div key={topic} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: TOPIC_COLORS[topic] || "#888" }}
                  />
                  <span className="label-medium text-[var(--md-on-surface-variant)]">
                    {topic}:
                  </span>
                  <span className="label-large text-[var(--md-on-surface)]">
                    {avgWeight.toFixed(1)} avg
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
