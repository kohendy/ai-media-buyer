import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function Empty({
  icon: Icon,
  title,
  message,
  className,
}: {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("grid justify-items-center gap-1.5 px-4 py-8 text-center", className)}
      role="status"
    >
      {Icon ? <Icon className="size-5 text-secondary" aria-hidden /> : null}
      {title ? <p className="text-sm font-medium text-text">{title}</p> : null}
      {message ? <p className="max-w-[40ch] text-xs text-muted">{message}</p> : null}
    </div>
  );
}
