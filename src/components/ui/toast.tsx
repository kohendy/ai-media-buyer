"use client";

import { useEffect, useState } from "react";

const EVENT = "ads:notice";

/** Kirim pesan singkat ke Toaster (dipakai di seluruh aplikasi). */
export function notify(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: message }));
}

export function Toaster() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function onNotice(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail !== "string") return;
      setMessage(detail);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setMessage(null), 3200);
    }
    window.addEventListener(EVENT, onNotice);
    return () => {
      window.removeEventListener(EVENT, onNotice);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        "pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex justify-center px-4 transition-opacity duration-200 " +
        (message ? "opacity-100" : "opacity-0")
      }
    >
      {message ? (
        <p className="max-w-[min(92vw,460px)] rounded-control bg-accent px-3.5 py-2.5 text-xs text-canvas shadow-[0_10px_30px_rgba(31,41,55,0.2)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
