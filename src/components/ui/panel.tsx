import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function Panel({
  title,
  description,
  icon: Icon,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("min-w-0 rounded-card border border-border bg-surface", className)}>
      {title || description || actions ? (
        <header className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="flex items-center gap-2 text-base font-semibold">
                {Icon ? <Icon className="size-4 text-secondary" aria-hidden /> : null}
                {title}
              </h2>
            ) : null}
            {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("px-4 pb-4", !(title || description || actions) && "pt-4", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
