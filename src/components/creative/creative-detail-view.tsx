"use client";

import { useState } from "react";
import {
  Activity,
  BadgeCheck,
  CopyPlus,
  History,
  MessageSquarePlus,
  MessageSquareText,
  Play,
  Send,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  Button,
  Chip,
  DetailList,
  Empty,
  PageHeader,
  Panel,
  Status,
  Textarea,
  notify,
  type Tone,
} from "@/components/ui";

type ViewMode = "feed" | "story" | "carousel";

const ASPECT: Record<ViewMode, string> = {
  feed: "aspect-[4/5]",
  story: "aspect-[9/16] max-h-[520px]",
  carousel: "aspect-square",
};

const VIEW_LABEL: Record<ViewMode, string> = { feed: "Feed 4:5", story: "Story 9:16", carousel: "Carousel" };

type Comment = { id: number; anchor: string; body: string; tone: Tone; statusLabel: string; response?: string };

export function CreativeDetailView({ id }: { id: string }) {
  const [view, setView] = useState<ViewMode>("story");
  const [commentMode, setCommentMode] = useState(false);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [version, setVersion] = useState(1);
  const [activeVersion, setActiveVersion] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const nextId = useState({ current: 1 })[0];

  const name = id.replace(/-/g, "_");

  function addComment() {
    if (!draft.trim()) return;
    setComments((list) => [
      ...list,
      { id: nextId.current++, anchor: anchor ?? "Umum", body: draft.trim(), tone: "info", statusLabel: "Terbuka" },
    ]);
    setDraft("");
    setAnchor(null);
    notify("Komentar disimpan. Aset asli mengarah ke ganti aset, bukan regenerasi AI.");
  }

  function sendToAgent() {
    const open = comments.filter((c) => c.statusLabel === "Terbuka");
    if (open.length === 0) {
      notify("Belum ada komentar untuk dikirim.");
      return;
    }
    notify("Komentar dikirim ke agent.");
    setTimeout(() => {
      setComments((list) =>
        list.map((c) =>
          c.statusLabel === "Terbuka"
            ? { ...c, tone: "success" as Tone, statusLabel: "Selesai", response: "Dilakukan pada versi 2." }
            : c,
        ),
      );
      setVersion((v) => (v < 2 ? 2 : v));
      setActiveVersion((v) => (v < 2 ? 2 : v));
      notify("Versi baru v2 siap dibandingkan.");
    }, 1200);
  }

  const anchorClass = (key: string) =>
    cn(
      "transition-colors",
      commentMode && "cursor-crosshair hover:bg-info/5",
      anchor === key && "bg-info/8 outline-2 -outline-offset-2 outline-focus",
    );

  return (
    <>
      <PageHeader
        title={name.charAt(0).toUpperCase() + name.slice(1)}
        description={`Angle Bukti bahan · versi ${version} · video 9:16 · 6 Oktober 2026.`}
      >
        <Status label="Dipakai" tone="info" />
        <Button icon={CopyPlus} onClick={() => notify("Variasi baru diminta dari angle pemenang; masuk antrean approval.")}>
          Minta variasi
        </Button>
        <Button variant="primary" icon={BadgeCheck} onClick={() => notify("Creative disetujui dan siap dipakai di iklan.")}>
          Setujui
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex gap-2" role="group" aria-label="Tampilan iklan">
              {(Object.keys(VIEW_LABEL) as ViewMode[]).map((key) => (
                <Chip key={key} pressed={view === key} onClick={() => setView(key)}>
                  {VIEW_LABEL[key]}
                </Chip>
              ))}
            </div>
            <Chip pressed={commentMode} onClick={() => setCommentMode((v) => !v)} className="ml-auto">
              <MessageSquarePlus className="size-3.5" aria-hidden />
              Mode komentar
            </Chip>
          </div>

          <div className="grid justify-items-center rounded-card border border-border bg-frame p-5">
            <div className="w-full max-w-[420px] overflow-hidden rounded-card border border-border bg-surface">
              <div className="flex items-center gap-2.5 p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent-top to-accent text-xs font-semibold text-canvas">
                  SC
                </span>
                <div>
                  <b className="block text-sm">Serum Vitamin C</b>
                  <small className="block text-[11px] text-muted">Bersponsor ·</small>
                </div>
              </div>

              <div
                onClick={() => commentMode && setAnchor("Teks utama")}
                className={cn("px-3 pb-2.5 text-sm", anchorClass("Teks utama"))}
              >
                Kulit berminyak bukan berarti harus kusam. Vitamin C 15% dengan tekstur ringan, dipakai pagi
                dan malam.
                {expanded ? " Wajah terasa segar lebih lama tanpa rasa lengket." : null}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setExpanded((v) => !v);
                  }}
                  className="text-sm text-secondary underline underline-offset-2"
                >
                  {expanded ? "Sembunyikan" : "Lihat selengkapnya"}
                </button>
              </div>

              <div
                onClick={() => commentMode && setAnchor("Video · detik 0:03")}
                className={cn(
                  "relative grid place-items-center border-y border-divider bg-[repeating-linear-gradient(135deg,var(--color-frame)_0_12px,var(--color-stripe)_12px_14px)]",
                  ASPECT[view],
                  anchorClass("Video · detik 0:03"),
                )}
                aria-label="Contoh media video 9:16"
              >
                <span className="absolute top-2.5 left-2.5 rounded-full bg-text/78 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.04em] uppercase text-white">
                  {VIEW_LABEL[view]}
                </span>
                <Play className="size-7 text-muted" aria-hidden />
              </div>

              <div className="flex items-center gap-3 p-3">
                <div
                  onClick={() => commentMode && setAnchor("Headline & deskripsi")}
                  className={cn("min-w-0 flex-1", anchorClass("Headline & deskripsi"))}
                >
                  <small className="block text-[10px] uppercase text-muted">serum-vitamin-c.id</small>
                  <b className="my-0.5 block text-sm">Kulit segar sampai sore</b>
                  <p className="m-0 text-[11px] text-muted">Serum vitamin C 15%, tekstur ringan.</p>
                </div>
                <span className="ml-auto shrink-0 rounded-lg border border-border bg-frame px-3 py-2 text-xs font-medium">
                  Pesan sekarang
                </span>
              </div>
            </div>
          </div>

          <Panel title="Performa" description="Perhitungan dari kode, bukan model" icon={Activity}>
            <DetailList
              items={[
                { term: "Belanja", value: "Rp 1.240.000" },
                { term: "CTR", value: "2,1%" },
                { term: "CPA", value: "Rp 48.000" },
                { term: "ROAS", value: "3,6×" },
                { term: "Frekuensi", value: "2,4" },
                { term: "Hasil", value: "26" },
              ]}
            />
          </Panel>
        </div>

        <div className="grid gap-4">
          <Panel title="Pra-cek" description="Peringatan, bukan jaminan lolos tinjauan Meta" icon={ShieldCheck}>
            <div className="flex flex-wrap items-center gap-2">
              <Status label="Risiko klaim rendah" tone="success" />
              <Status label="Skor hook 85" tone="success" />
              <Status label="Cocok angle" tone="success" />
            </div>
            <p className="mt-2.5 text-xs text-muted">
              Produk fisik memakai foto/video asli; AI hanya untuk latar dan elemen pendukung.
            </p>
          </Panel>

          <Panel
            title="Komentar"
            description="Klik teks, area gambar, atau detik video"
            icon={MessageSquareText}
            actions={
              <>
                <Button variant="primary" icon={Send} onClick={sendToAgent}>
                  Kirim ke agent
                </Button>
                <span className="text-xs text-muted">{comments.length} komentar</span>
              </>
            }
          >
            {anchor ? (
              <div className="mb-4 grid gap-2 rounded-control border border-border p-3">
                <span className="text-xs font-medium">
                  Bagian: <span className="text-muted">{anchor}</span>
                </span>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={2000}
                  placeholder="mis. tonjolkan tekstur ringan di 3 detik pertama"
                  aria-label="Isi komentar"
                />
                <div className="flex gap-2">
                  <Button variant="primary" onClick={addComment}>
                    Simpan komentar
                  </Button>
                  <Button onClick={() => setAnchor(null)}>Batal</Button>
                </div>
              </div>
            ) : null}

            {comments.length === 0 ? (
              <Empty icon={MessageSquareText} title="Belum ada komentar" message="Aktifkan mode komentar lalu klik bagian iklan." />
            ) : (
              <ul className="m-0 list-none p-0">
                {comments.map((comment) => (
                  <li key={comment.id} className="border-t border-divider py-3 first:border-t-0">
                    <Status label={comment.statusLabel} tone={comment.tone} />
                    <h3 className="mt-1.5 text-sm font-medium">{comment.body}</h3>
                    <p className="mt-0.5 text-xs text-muted">Bagian: {comment.anchor}</p>
                    {comment.response ? (
                      <p className="mt-1.5 rounded-control bg-frame px-2.5 py-2 text-[11px] text-secondary">{comment.response}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Riwayat versi" description="Revisi membuat versi baru" icon={History}>
            <ul className="m-0 list-none p-0">
              {[version, ...([1].filter((v) => v < version))].map((v) => (
                <li key={v} className={cn("flex items-center gap-2 rounded-control px-2 py-2", activeVersion === v && "bg-frame")}>
                  <div className="min-w-0">
                    <b className="text-xs font-medium">v{v}</b>
                    <p className="mt-0.5 text-[11px] text-muted">{v === 1 ? "6 Okt · dipakai" : "baru · hasil revisi"}</p>
                  </div>
                  {activeVersion === v ? (
                    <Status label="Aktif" tone="success" className="ml-auto" />
                  ) : (
                    <Button
                      className="ml-auto"
                      onClick={() => {
                        setActiveVersion(v);
                        notify(`Versi ${v} dikembalikan sebagai versi aktif.`);
                      }}
                    >
                      Kembalikan
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
