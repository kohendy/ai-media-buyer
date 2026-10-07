import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type Trend = "up" | "down" | "flat";

export function Stat({
  icon: Icon,
  title,
  value,
  delta,
  trend = "flat",
  note,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  value: string;
  delta?: string;
  trend?: Trend;
  note?: string;
  className?: string;
}) {
  const deltaTone =
    trend === "up" ? "text-success-ink" : trend === "down" ? "text-danger-ink" : "text-muted";
  return (
    <article
      className={cn(
        "flex min-w-0 flex-col gap-2.5 rounded-card border border-border bg-surface p-4",
        className,
      )}
      aria-label={`${title}: ${value}`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="grid size-7 shrink-0 place-items-center rounded-inner bg-frame text-secondary"
          aria-hidden
        >
          {Icon ? <Icon className="size-4" /> : null}
        </span>
        <h3 className="min-w-0 text-xs font-medium text-muted">{title}</h3>
      </div>
      <p className="text-2xl font-semibold leading-none tracking-tight tabular-nums">{value}</p>
      {delta ? <p className={cn("text-xs font-medium", deltaTone)}>{delta}</p> : null}
      {note ? <p className="text-[11px] text-muted">{note}</p> : null}
    </article>
  );
}
