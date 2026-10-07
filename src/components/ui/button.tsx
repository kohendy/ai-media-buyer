import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "default" | "primary" | "danger" | "link";

/** Kelas tombol — dipakai bersama oleh <button> dan tautan Next.js. */
export function btnClass(variant: ButtonVariant = "default", className?: string): string {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-control text-xs font-medium whitespace-nowrap no-underline transition-colors";
  const variants: Record<ButtonVariant, string> = {
    default: "min-h-[34px] px-3 border border-border bg-surface text-secondary hover:bg-frame hover:text-text",
    primary:
      "min-h-[34px] px-3 border border-accent bg-accent text-canvas hover:bg-accent-top hover:border-accent-top",
    danger: "min-h-[34px] px-3 border border-danger/40 text-danger-ink hover:bg-danger/5",
    link: "px-1 text-secondary underline underline-offset-2 hover:text-text",
  };
  return cn(base, variants[variant], className);
}

export function Button({
  variant = "default",
  icon: Icon,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; icon?: LucideIcon }) {
  return (
    <button type="button" className={btnClass(variant, className)} {...rest}>
      {Icon ? <Icon className="size-4" aria-hidden /> : null}
      {children}
    </button>
  );
}
