"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Copy, KeyRound, Lock, Send, ShieldCheck, UsersRound } from "lucide-react";
import { Button, notify } from "@/components/ui";

const POINTS = [
  { icon: ShieldCheck, text: "Tanpa kata sandi. Masuk hanya lewat tautan sekali pakai dari bot Telegram." },
  { icon: KeyRound, text: "Tautan kedaluwarsa dalam 5 menit dan hanya bisa dipakai sekali." },
  { icon: UsersRound, text: "Hanya akun Telegram pada daftar putih yang dilayani." },
];

const SAMPLE = "https://desainpakeai.com/api/auth/link?token=dpai-demo-7f3a";

export default function LoginPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token.trim()) {
      setError("Tempel tautan atau token terlebih dahulu.");
      return;
    }
    setError(null);
    notify("Tautan valid. Membuka dasbor…");
    setTimeout(() => router.push("/"), 400);
  }

  return (
    <div className="grid min-h-screen bg-canvas text-text md:grid-cols-2">
      {/* Aside */}
      <aside className="hidden flex-col justify-between gap-8 border-r border-border bg-sidebar p-10 md:flex">
        <div className="flex items-center gap-2.5">
          <span
            className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-accent-top to-accent font-semibold text-canvas"
            aria-hidden
          >
            A
          </span>
          <span>
            <strong className="block text-brand font-semibold tracking-[-0.4px]">AI Media Buyer</strong>
            <small className="block text-[10px] uppercase tracking-[0.08em] text-muted">
              Ads Automation
            </small>
          </span>
        </div>

        <ul className="m-0 grid max-w-[42ch] list-none gap-3.5 p-0">
          {POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <li key={point.text} className="flex gap-2.5 text-sm text-secondary">
                <Icon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                <span>{point.text}</span>
              </li>
            );
          })}
        </ul>

        <p className="m-0 text-xs text-muted">Data contoh prototipe · belum terhubung ke sistem nyata.</p>
      </aside>

      {/* Form */}
      <main className="grid place-items-center px-6 py-10">
        <div className="w-full max-w-[420px]">
          <h1 className="mb-1.5 text-heading font-medium tracking-[-0.8px]">Masuk ke dasbor</h1>
          <p className="mb-6 text-sm text-muted">Minta tautan masuk dari bot, lalu tempel tautannya di sini.</p>

          <section className="mb-4 grid gap-2 rounded-card border border-border bg-surface p-4" aria-labelledby="lg-step-1">
            <div className="flex items-center gap-2">
              <span className="grid size-5.5 shrink-0 place-items-center rounded-full bg-frame text-[11px] font-semibold text-secondary">
                1
              </span>
              <h2 id="lg-step-1" className="text-sm font-medium">
                Minta tautan dari bot Telegram
              </h2>
            </div>
            <p className="text-xs text-muted" role="status" aria-live="polite">
              {requested
                ? "Tautan dikirim ke Telegram kamu. Tautan berlaku 5 menit dan sekali pakai."
                : "Kirim perintah /login ke bot untuk mendapatkan tautan."}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" icon={Send} onClick={() => setRequested(true)}>
                Minta tautan masuk
              </Button>
              <Button
                icon={Copy}
                onClick={() => {
                  setToken(SAMPLE);
                  setError(null);
                  if (navigator.clipboard) navigator.clipboard.writeText(SAMPLE).catch(() => {});
                  notify("Contoh tautan disalin dan dimasukkan ke kolom.");
                }}
              >
                Salin contoh tautan
              </Button>
            </div>
          </section>

          <form className="grid gap-3 rounded-card border border-border bg-surface p-4" onSubmit={onSubmit} noValidate>
            <div className="flex items-center gap-2">
              <span className="grid size-5.5 shrink-0 place-items-center rounded-full bg-frame text-[11px] font-semibold text-secondary">
                2
              </span>
              <h2 className="text-sm font-medium">Tempel tautan atau token</h2>
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium" htmlFor="login-token">
                Tautan masuk atau token
              </label>
              <input
                id="login-token"
                name="token"
                type="text"
                autoComplete="one-time-code"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="https://desainpakeai.com/api/auth/link?token=…"
                aria-describedby="login-help login-error"
                className="min-h-9.5 w-full rounded-control border border-border bg-surface px-2.5 py-2 text-sm text-text placeholder:text-muted"
              />
              <p id="login-help" className="text-xs text-muted">
                Contoh: https://desainpakeai.com/api/auth/link?token=abc123
              </p>
              {error ? (
                <p id="login-error" className="text-xs text-danger-ink">
                  {error}
                </p>
              ) : null}
            </div>
            <Button variant="primary" type="submit" className="w-full" icon={ArrowRight}>
              Masuk ke dasbor
            </Button>
          </form>

          <p className="mt-5 flex gap-2 text-[11px] text-muted">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              Sesi disimpan pada cookie <code>httpOnly</code>. Kunci Meta, kunci AI, dan kredensial
              database tetap di server dan tidak pernah dikirim ke peramban.
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
