"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby="ads-modal-title"
      className="m-auto w-[calc(100%-32px)] max-w-[520px] rounded-card border border-border bg-surface p-5 text-text"
    >
      <h2 id="ads-modal-title" className="mb-1 pr-8 text-lg font-semibold">
        {title}
      </h2>
      {description ? <p className="mb-4 text-xs text-muted">{description}</p> : null}
      {children}
      {footer ? <footer className="mt-4 flex flex-wrap justify-end gap-2">{footer}</footer> : null}
    </dialog>
  );
}
