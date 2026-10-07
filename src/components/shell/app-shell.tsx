"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bell, ChevronsUpDown, Menu, PanelLeft, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { isNavActive, navGroups, navLabelFor } from "@/lib/nav";
import { notify, Toaster } from "@/components/ui";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !q || item.label.toLowerCase().includes(q)),
      }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  const emptyNav = query.trim().length > 0 && groups.length === 0;
  const breadcrumb = navLabelFor(pathname);

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[250px_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[60] w-[250px] border-r border-border bg-sidebar transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
          "lg:sticky lg:top-0 lg:z-40 lg:h-screen lg:translate-x-0",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Navigasi utama"
      >
        <div className="flex h-full flex-col overflow-hidden px-3 pb-4">
          <div className="flex min-h-14 shrink-0 items-center gap-2.5 border-b border-dashed border-border">
            <span
              className="grid size-6.5 shrink-0 place-items-center rounded-[7px] bg-gradient-to-br from-accent-top to-accent text-[13px] font-semibold text-canvas"
              aria-hidden
            >
              A
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-brand font-semibold tracking-[-0.4px]">
                AI Media Buyer
              </strong>
              <small className="block text-[10px] uppercase tracking-[0.08em] text-muted">
                Ads Automation
              </small>
            </span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Tutup navigasi"
              className="ml-auto grid size-8 shrink-0 place-items-center rounded-control text-secondary hover:bg-surface lg:hidden"
            >
              <PanelLeft className="size-4" aria-hidden />
            </button>
          </div>

          <div className="relative my-3 mb-2 shrink-0">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari menu"
              aria-label="Cari menu"
              className="h-8 w-full rounded-control border border-border bg-surface pr-2.5 pl-8 text-xs text-text placeholder:text-muted"
            />
          </div>

          <nav className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto" aria-label="Menu dasbor">
            {groups.map((group) => (
              <div key={group.caption} className="contents">
                <p className="mt-3.5 mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">
                  {group.caption}
                </p>
                {group.items.map((item) => {
                  const active = isNavActive(pathname, item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setDrawerOpen(false);
                        setQuery("");
                      }}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-8.5 min-w-0 items-center gap-2.5 rounded-control border border-transparent px-2.5 text-xs text-secondary transition-colors hover:bg-surface hover:text-text",
                        active &&
                          "border-border bg-surface text-text shadow-[0_3px_8px_rgba(31,41,55,0.04)]",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.label}
                      </span>
                      {typeof item.badge === "number" ? (
                        <span className="ml-auto grid h-4.5 min-w-4.5 place-items-center rounded-full border border-border bg-frame px-1 text-[10px] font-semibold text-text">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            ))}
            {emptyNav ? <p className="px-2.5 py-4 text-xs text-muted">Menu tidak ditemukan.</p> : null}
          </nav>

          <button
            type="button"
            onClick={() => notify("Masuk sebagai Pemilik · akses penuh ke seluruh tahap.")}
            className="mt-3 flex h-12.5 shrink-0 items-center gap-2 rounded-card border border-border bg-surface px-2 text-left shadow-[0_2px_8px_rgba(31,41,55,0.03)]"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-sidebar text-[11px] font-semibold text-text">
              PM
            </span>
            <span className="min-w-0">
              <strong className="block text-sm font-medium text-text">Pemilik</strong>
              <small className="block text-[11px] text-muted">Akses penuh · owner</small>
            </span>
            <ChevronsUpDown className="ml-auto size-4 text-muted" aria-hidden />
          </button>
        </div>
      </aside>

      {drawerOpen ? (
        <button
          type="button"
          aria-label="Tutup navigasi"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-[55] bg-[var(--overlay)] lg:hidden"
        />
      ) : null}

      {/* Main */}
      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-canvas/92 backdrop-blur-[6px]">
          <div className="flex min-h-14 min-w-0 items-center gap-3 px-4 py-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka navigasi"
              aria-expanded={drawerOpen}
              className="grid size-8.5 shrink-0 place-items-center rounded-control border border-border bg-surface text-secondary lg:hidden"
            >
              <Menu className="size-4" aria-hidden />
            </button>
            <nav className="flex min-w-0 items-center gap-1.5 text-xs text-muted" aria-label="Breadcrumb">
              <span>Ads Automation</span>
              <span aria-hidden>/</span>
              <strong className="truncate font-medium text-text">{breadcrumb}</strong>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  notify(
                    "5 peringatan aktif: CPA, tracking, frekuensi, belanja, dan pemenang eksperimen.",
                  )
                }
                aria-label="Notifikasi, 5 peringatan aktif"
                className="relative grid size-8.5 place-items-center rounded-control border border-border bg-surface text-secondary hover:bg-frame hover:text-text"
              >
                <Bell className="size-4" aria-hidden />
                <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger-ink px-1 text-[10px] font-semibold text-white">
                  5
                </span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 px-4 py-5 lg:px-6 lg:pb-8">{children}</div>
      </div>

      <Toaster />
    </div>
  );
}
