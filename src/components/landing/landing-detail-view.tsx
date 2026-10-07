"use client";

import { useRef, useState } from "react";
import {
  BadgeCheck,
  Download,
  History,
  ListTree,
  MessageSquarePlus,
  MessageSquareText,
  Send,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  Button,
  Chip,
  DetailList,
  Empty,
  PageHeader,
  Panel,
  Select,
  Status,
  Textarea,
  notify,
  type Tone,
} from "@/components/ui";

type Block = { id: string; label: string; kind: "hero" | "body"; heading: string; body?: string; cta?: string };

const BLOCKS: Block[] = [
  { id: "headline", label: "Headline", kind: "hero", heading: "Kulit berminyak bukan berarti harus kusam", body: "Serum vitamin C 15% dengan tekstur ringan.", cta: "Pesan lewat WhatsApp" },
  { id: "proof", label: "Bukti singkat", kind: "body", heading: "Dipakai 1.200+ pelanggan", body: "Kandungan ditulis terbuka pada kemasan." },
  { id: "problem", label: "Masalah", kind: "body", heading: "Masalahnya", body: "Wajah cepat kusam di tengah hari dan produk terasa lengket." },
  { id: "solution", label: "Solusi", kind: "body", heading: "Solusinya", body: "Vitamin C stabil yang menyerap cepat tanpa rasa berat." },
  { id: "how", label: "Cara kerja", kind: "body", heading: "Cara pakai", body: "Dua tetes pagi dan malam setelah membersihkan wajah." },
  { id: "benefits", label: "Manfaat", kind: "body", heading: "Manfaat", body: "Kulit terasa segar lebih lama, tampilan lebih cerah merata." },
  { id: "testimonial", label: "Testimoni", kind: "body", heading: '"Ringan, tidak lengket." — Rani', body: "Testimoni asli pelanggan dengan izin." },
  { id: "offer", label: "Penawaran & harga", kind: "body", heading: "Rp 129.000 · 30 ml", body: "Satu botol cukup sekitar satu bulan." },
  { id: "guarantee", label: "Garansi", kind: "body", heading: "Garansi 30 hari", body: "Uang kembali bila tidak cocok, syarat berlaku." },
  { id: "faq", label: "FAQ", kind: "body", heading: "Pertanyaan umum", body: "Apakah aman untuk kulit sensitif? Ya, uji dulu di area kecil." },
  { id: "cta", label: "CTA penutup", kind: "hero", heading: "Siap mencoba?", cta: "Pesan sekarang" },
];

type Comment = { id: number; label: string; kind: string; body: string; tone: Tone; statusLabel: string; response?: string };

const INITIAL_COMMENTS: Comment[] = [
  { id: 1, label: "Headline", kind: "Ubah", body: "Judul kurang menonjolkan garansi", tone: "info", statusLabel: "Terbuka" },
];

export function LandingDetailView({ id }: { id: string }) {
  const [view, setView] = useState<"mobile" | "desktop">("mobile");
  const [commentMode, setCommentMode] = useState(false);
  const [selected, setSelected] = useState<Block | null>(null);
  const [kind, setKind] = useState("Ubah");
  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [version, setVersion] = useState(3);
  const [activeVersion, setActiveVersion] = useState(3);
  const nextId = useRef(2);

  function addComment() {
    if (!draft.trim()) return;
    setComments((list) => [
      ...list,
      { id: nextId.current++, label: selected?.label ?? "Umum", kind, body: draft.trim(), tone: "info", statusLabel: "Terbuka" },
    ]);
    setDraft("");
    setSelected(null);
    notify("Komentar disimpan sebagai draf revisi.");
  }

  function sendToAgent() {
    const open = comments.filter((c) => c.statusLabel === "Terbuka");
    if (open.length === 0) {
      notify("Belum ada komentar untuk dikirim.");
      return;
    }
    notify("Komentar dikirim ke agent. Revisi berjalan di latar belakang.");
    setTimeout(() => {
      setComments((list) =>
        list.map((c) =>
          c.statusLabel === "Terbuka"
            ? { ...c, tone: "success" as Tone, statusLabel: "Selesai", response: "Dilakukan pada versi 4." }
            : c,
        ),
      );
      setVersion((v) => (v < 4 ? 4 : v));
      setActiveVersion((v) => (v < 4 ? 4 : v));
      notify("Versi baru v4 siap dibandingkan dan disetujui.");
    }, 1200);
  }

  const pageName = id.replace(/[^a-z0-9]+/gi, " ").replace(/\b\w/g, (m) => m.toUpperCase());

  return (
    <>
      <PageHeader
        title="Garansi 30 hari"
        description={`Angle Bukti bahan · versi ${version} · 7 Oktober 2026 · pratinjau interaktif dan komentar.`}
      >
        <Status label="Disetujui" tone="success" />
        <Button icon={Download} onClick={() => notify("HTML diunduh tanpa skrip preview.")}>
          Unduh HTML
        </Button>
        <Button
          variant="primary"
          icon={BadgeCheck}
          onClick={() => notify(`Versi ${activeVersion} disetujui. Dapat diunduh dan dipasang.`)}
        >
          Setujui versi ini
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex gap-2" role="group" aria-label="Lebar pratinjau">
              <Chip pressed={view === "mobile"} onClick={() => setView("mobile")}>
                Ponsel 390
              </Chip>
              <Chip pressed={view === "desktop"} onClick={() => setView("desktop")}>
                Desktop 1280
              </Chip>
            </div>
            <Chip
              pressed={commentMode}
              onClick={() => setCommentMode((v) => !v)}
              className="ml-auto"
            >
              <MessageSquarePlus className="size-3.5" aria-hidden />
              Mode komentar
            </Chip>
          </div>

          <div className="grid justify-items-center rounded-card border border-border bg-frame p-4">
            <div
              className={cn(
                "w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_12px_32px_rgba(31,41,55,0.08)] transition-[max-width] duration-200",
                view === "mobile" ? "max-w-[390px]" : "max-w-full",
              )}
            >
              <div className="flex items-center gap-1.5 border-b border-divider bg-sidebar px-3 py-2" aria-hidden>
                <i className="size-2.5 rounded-full bg-border" />
                <i className="size-2.5 rounded-full bg-border" />
                <i className="size-2.5 rounded-full bg-border" />
                <span className="ml-2 text-[10px] text-muted">serum-vitamin-c.id/garansi</span>
              </div>
              <div className="text-[12px] leading-normal text-text">
                {BLOCKS.map((block) => (
                  <div
                    key={block.id}
                    onClick={() => {
                      if (!commentMode) return;
                      setSelected(block);
                    }}
                    data-selected={selected?.id === block.id ? "true" : undefined}
                    className={cn(
                      "border-b border-dashed border-divider px-4.5 py-3.5 last:border-b-0",
                      block.kind === "hero" && "bg-frame py-5 text-center",
                      commentMode && "cursor-crosshair hover:bg-info/5",
                      selected?.id === block.id && "bg-info/8 outline-2 -outline-offset-2 outline-focus",
                    )}
                  >
                    {block.kind === "hero" ? (
                      <h3 className="mb-1 text-[15px]">{block.heading}</h3>
                    ) : (
                      <h4 className="mb-1 text-[13px]">{block.heading}</h4>
                    )}
                    {block.body ? <p className="text-secondary">{block.body}</p> : null}
                    {block.cta ? (
                      <span className="mt-2.5 inline-block rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-canvas">
                        {block.cta}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Panel title="Blok dan penanda" description="11 blok tetap · klaim dari 4 insight terkonfirmasi" icon={ListTree}>
            <div className="flex flex-wrap items-center gap-2">
              <Status label="Pixel terpasang" tone="success" />
              <Status label="UTM seragam" tone="success" />
              <Status label="4 insight terkonfirmasi" tone="info" />
              <Status label="Skrip preview tidak ikut terunduh" tone="info" />
            </div>
          </Panel>
        </div>

        <div className="grid gap-4">
          <Panel
            title="Komentar"
            description="Klik bagian halaman, lalu tulis komentar"
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
            {selected ? (
              <div className="mb-4 grid gap-2 rounded-control border border-border p-3">
                <span className="text-xs font-medium">
                  Bagian: <span className="text-muted">{selected.label}</span>
                </span>
                <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Jenis komentar">
                  <option>Ubah</option>
                  <option>Ganti teks</option>
                  <option>Pertanyaan</option>
                </Select>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={2000}
                  placeholder="mis. judul kurang menonjolkan garansi"
                  aria-label="Isi komentar"
                />
                <div className="flex gap-2">
                  <Button variant="primary" onClick={addComment}>
                    Simpan komentar
                  </Button>
                  <Button onClick={() => setSelected(null)}>Batal</Button>
                </div>
              </div>
            ) : null}

            {comments.length === 0 ? (
              <Empty icon={MessageSquareText} title="Belum ada komentar" message="Aktifkan mode komentar lalu klik bagian halaman." />
            ) : (
              <ul className="m-0 list-none p-0">
                {comments.map((comment) => (
                  <li key={comment.id} className="border-t border-divider py-3 first:border-t-0">
                    <Status label={comment.statusLabel} tone={comment.tone} />
                    <h3 className="mt-1.5 text-sm font-medium">{comment.body}</h3>
                    <p className="mt-0.5 text-xs text-muted">Bagian: {comment.label} · jenis: {comment.kind}</p>
                    {comment.response ? (
                      <p className="mt-1.5 rounded-control bg-frame px-2.5 py-2 text-[11px] text-secondary">{comment.response}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Riwayat versi" description="Setiap revisi membuat versi baru" icon={History}>
            <ul className="m-0 list-none p-0">
              {[version, ...([3, 2].filter((v) => v < version))].map((v, index) => (
                <li
                  key={v}
                  className={cn(
                    "flex items-center gap-2 rounded-control px-2 py-2",
                    activeVersion === v && "bg-frame",
                  )}
                >
                  <div className="min-w-0">
                    <b className="text-xs font-medium">v{v}</b>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {index === 0 && v === version && version >= 4 ? "baru · dari komentar" : v === 3 ? "7 Okt · disetujui" : "1 Okt"}
                    </p>
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

          <Panel>
            <DetailList
              items={[
                { term: "Halaman", value: pageName },
                { term: "Angle", value: "Bukti bahan" },
                { term: "Versi aktif", value: `v${activeVersion}` },
                { term: "Status", value: "Disetujui" },
              ]}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
