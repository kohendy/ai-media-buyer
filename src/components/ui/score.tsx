import { cn } from "@/lib/cn";

export type ScoreTone = "accent" | "success" | "warning" | "danger";

const fillTone: Record<ScoreTone, string> = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function Score({
  label,
  value,
  pct,
  tone = "accent",
  className,
}: {
  label: string;
  value: string;
  /** 0–100 */
  pct: number;
  tone?: ScoreTone;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className={cn("grid min-w-0 gap-1.5", className)}>
      <div className="flex min-w-0 items-baseline justify-between gap-2 text-xs">
        <span className="min-w-0 truncate text-muted">{label}</span>
        <b className="font-semibold tabular-nums">{value}</b>
      </div>
      <div
        className="relative h-1.5 overflow-hidden rounded bg-chart-base"
        role="img"
        aria-label={`${label}: ${value}`}
      >
        <i
          className={cn("absolute inset-y-0 left-0 rounded", fillTone[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
