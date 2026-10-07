import { cn } from "@/lib/cn";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "yellow";

const dotTone: Record<Tone, string> = {
  neutral: "bg-muted",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  yellow: "bg-yellow",
};

/** Status bertona. Non-warna: label teks selalu ada, bukan hanya titik warna. */
export function Status({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-text",
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", dotTone[tone])} aria-hidden />
      {label}
    </span>
  );
}
