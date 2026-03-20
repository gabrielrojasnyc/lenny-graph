import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  variant?: "elevated" | "filled" | "outlined";
  className?: string;
}

export function Card({
  children,
  variant = "elevated",
  className,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] p-4",
        variant === "elevated" && [
          "bg-[var(--md-surface-container-low)]",
          "shadow-[var(--shadow-1)]",
        ],
        variant === "filled" && "bg-[var(--md-surface-container-highest)]",
        variant === "outlined" && [
          "bg-[var(--md-surface)]",
          "border border-[var(--md-outline-variant)]",
        ],
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3
      className={cn("title-large text-[var(--md-on-surface)]", className)}
    >
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn(className)}>{children}</div>;
}
