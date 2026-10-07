import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TableHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

/* ---------- Chip (filter/toggle) ---------- */

export function Chip({
  pressed,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-secondary transition-colors",
        pressed && "border-accent bg-accent text-canvas",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------- Form ---------- */

export function Field({
  label,
  htmlFor,
  help,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  help?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid min-w-0 gap-0.5", className)}>
      <label className="text-xs font-medium text-text" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {help ? <p className="mt-1 text-[11px] text-muted">{help}</p> : null}
      {error ? <p className="mt-1 text-[11px] text-danger-ink">{error}</p> : null}
    </div>
  );
}

const controlClass =
  "w-full rounded-control border border-border bg-surface px-2.5 py-2 text-sm text-text placeholder:text-muted";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, "min-h-9", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClass, "min-h-24 resize-y leading-normal", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, "min-h-9", className)} {...rest}>
      {children}
    </select>
  );
}

/* ---------- Detail list ---------- */

export function DetailList({
  items,
  columns = 2,
  className,
}: {
  items: Array<{ term: string; value: ReactNode }>;
  columns?: 1 | 2;
  className?: string;
}) {
  return (
    <dl
      className={cn("m-0 grid gap-3", columns === 2 ? "sm:grid-cols-2" : "grid-cols-1", className)}
    >
      {items.map((item) => (
        <div key={item.term} className="min-w-0 rounded-inner bg-frame p-3">
          <dt className="mb-0.5 text-[11px] text-muted">{item.term}</dt>
          <dd className="m-0 text-sm font-medium tabular-nums [overflow-wrap:anywhere]">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- Table ---------- */

export function TableWrap({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("max-w-full overflow-x-auto", className)}>{children}</div>;
}

export function Table({ className, children, ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn("w-full border-collapse text-sm", className)} {...rest}>
      {children}
    </table>
  );
}

export function Th({ className, children, ...rest }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "border-y border-divider bg-frame px-3.5 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted",
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({
  className,
  numeric,
  children,
  ...rest
}: HTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn(
        "border-b border-divider px-3.5 py-2.5 text-left align-top",
        numeric && "tabular-nums whitespace-nowrap",
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

export function SrOnly({ children }: { children: ReactNode }) {
  return (
    <span className="absolute h-px w-px overflow-hidden [clip-path:inset(50%)]">{children}</span>
  );
}
