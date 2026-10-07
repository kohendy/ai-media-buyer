"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, ClockAlert, Inbox, RefreshCw, ShieldAlert, X } from "lucide-react";
import {
  Button,
  Chip,
  Empty,
  Modal,
  PageHeader,
  Panel,
  Stat,
  Status,
  Textarea,
  btnClass,
  notify,
} from "@/components/ui";

type Kind = "product" | "audience" | "landing_page" | "creative_pack" | "scale" | "pause";

type Item = {
  id: string;
  kind: Kind;
  kindLabel: string;
  source?: { label: string; tone: "info" | "success" | "warning" };
  age: string;
  title: string;
  summary: string;
  reasons: string[];
  link?: { href: string; label: string };
};

const INITIAL: Item[] = [
  { id: "scale", kind: "scale", kindLabel: "Scale", source: { label: "Usulan otomatis", tone: "info" }, age: "2 jam lalu · kedaluwarsa 46 jam", title: 'Naikkan budget ad set "Uji Bukti Sosial-B"', summary: "Rp 150.000 → Rp 180.000 (+20%)", reasons: ["CPA di bawah target 4 hari berturut-turut", "38 hasil (minimum 30) · tracking sehat", "Batas keras lolos (maks +20%, jeda 48 jam)"], link: { href: "/kampanye", label: "Lihat di kampanye" } },
  { id: "pause", kind: "pause", kindLabel: "Pause", source: { label: "Usulan otomatis", tone: "info" }, age: "3 jam lalu", title: 'Jeda ad set "Uji Penawaran-A"', summary: "CPA Rp 96.400 (di atas 1,5× target) dengan data cukup", reasons: ["CPA melewati ambang 1,5× target (Rp 90.000)", "Belanja Rp 480.000 tanpa hasil pada periode uji"] },
  { id: "landing", kind: "landing_page", kindLabel: "Landing page", source: { label: "Versi 3", tone: "info" }, age: "5 jam lalu", title: 'Landing page "Garansi 30 hari"', summary: "Angle bukti bahan · pra-cek lulus · kecocokan pesan 92%", reasons: ["Dasar klaim: 4 insight terkonfirmasi", "Ukuran 84 KB, satu berkas HTML mandiri"], link: { href: "/landing-page/garansi-30-hari", label: "Pratinjau" } },
  { id: "creative", kind: "creative_pack", kindLabel: "Creative", source: { label: "3 varian", tone: "info" }, age: "5 jam lalu", title: 'Paket creative "Angle Bukti Sosial"', summary: "3 varian copy dan 4 visual 4:5 & 9:16", reasons: ["Pra-cek kebijakan: risiko klaim rendah, skor hook 82", "Aset produk asli; AI hanya latar"], link: { href: "/creative/bukti-video", label: "Pratinjau" } },
  { id: "product", kind: "product", kindLabel: "Produk", source: { label: "Skor Jev 4,2", tone: "success" }, age: "1 hari lalu", title: 'Pilih produk "Serum Vitamin C"', summary: "Kandidat terbaik dari riset pasar", reasons: [], link: { href: "/riset/serum-vitamin-c", label: "Market brief" } },
  { id: "audience", kind: "audience", kindLabel: "Audiens", source: { label: "3 persona", tone: "info" }, age: "1 hari lalu", title: "Profil audiens dan bank hook", summary: "3 persona · 12 hook awal · 4 angle", reasons: [], link: { href: "/audiens", label: "Lihat audiens" } },
];

const FILTERS: Array<{ key: Kind | "all"; label: string }> = [
  { key: "all", label: "Semua" },
  { key: "product", label: "Produk" },
  { key: "audience", label: "Audiens" },
  { key: "landing_page", label: "Landing page" },
  { key: "creative_pack", label: "Creative" },
  { key: "scale", label: "Scale" },
  { key: "pause", label: "Pause" },
];

export function ApprovalView() {
  const [items, setItems] = useState(INITIAL);
  const [filter, setFilter] = useState<Kind | "all">("all");
  const [revision, setRevision] = useState<Item | null>(null);
  const [note, setNote] = useState("");

  const visible = useMemo(() => items.filter((i) => filter === "all" || i.kind === filter), [items, filter]);

  function decide(item: Item, approved: boolean) {
    setItems((list) => list.filter((entry) => entry.id !== item.id));
    notify(
      approved
        ? `Disetujui: ${item.title}. Aksi dijalankan dan dicatat.`
        : `Ditolak: ${item.title}. Item dipindahkan ke riwayat.`,
    );
  }

  return (
    <>
      <PageHeader
        title="Antrean Approval"
        description="Semua item menunggu keputusan dengan alasan dan angka. Item kedaluwarsa bila tidak ditanggapi 48 jam. Data contoh."
      >
        <Button icon={RefreshCw} onClick={() => notify("Antrean dimuat ulang.")}>
          Muat ulang
        </Button>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Inbox} title="Menunggu" value={String(items.length)} delta="paling lama 6 jam" trend="flat" />
        <Stat icon={Check} title="Disetujui hari ini" value="3" delta="rata-rata 42 menit" trend="up" />
        <Stat icon={X} title="Ditolak hari ini" value="1" delta="dengan catatan" trend="flat" />
        <Stat icon={ClockAlert} title="Kedaluwarsa" value="0" delta="48 jam" trend="flat" />
      </section>

      <Panel title="Aturan keputusan" description="Berlaku untuk semua item" icon={ShieldAlert}>
        <p className="m-0 text-xs text-muted">
          Item tidak dapat disetujui saat kill switch aktif. Keputusan yang menyentuh uang mengikuti batas
          keras di kode; skor dan analisa hanya masukan.
        </p>
      </Panel>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter jenis item">
        {FILTERS.map((f) => (
          <Chip key={f.key} pressed={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
        <span className="text-xs text-muted">{visible.length} menunggu</span>
      </div>

      <Panel title="Menunggu keputusan" icon={Inbox}>
        {visible.length === 0 ? (
          <Empty icon={Inbox} title="Antrean kosong" message="Semua item sudah diputuskan." />
        ) : (
          <ul className="m-0 list-none p-0">
            {visible.map((item) => (
              <li key={item.id} className="border-t border-divider py-4 first:border-t-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-border bg-frame px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.04em] uppercase text-secondary">
                    {item.kindLabel}
                  </span>
                  {item.source ? <Status label={item.source.label} tone={item.source.tone} /> : null}
                  <span className="ml-auto text-[11px] text-muted">{item.age}</span>
                </div>
                <h3 className="mt-2 text-sm font-medium">{item.title}</h3>
                <p className="mt-1 text-xs text-muted">{item.summary}</p>
                {item.reasons.length > 0 ? (
                  <ul className="mt-2.5 grid list-none gap-1 p-0">
                    {item.reasons.map((reason) => (
                      <li key={reason} className="flex gap-2 text-xs text-secondary">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden />
                        {reason}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button variant="primary" onClick={() => decide(item, true)}>
                    Setujui
                  </Button>
                  <Button onClick={() => decide(item, false)}>Tolak</Button>
                  <Button
                    onClick={() => {
                      setRevision(item);
                      setNote("");
                    }}
                  >
                    Minta revisi
                  </Button>
                  {item.link ? (
                    <Link className={btnClass("link")} href={item.link.href}>
                      {item.link.label}
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Modal
        open={revision !== null}
        onClose={() => setRevision(null)}
        title="Minta revisi"
        description={revision?.title}
        footer={
          <>
            <Button onClick={() => setRevision(null)}>Batal</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!note.trim()) return;
                const title = revision?.title ?? "";
                setItems((list) => list.filter((entry) => entry.id !== revision?.id));
                setRevision(null);
                notify(`Revisi diminta untuk "${title}": ${note.trim()}`);
              }}
            >
              Kirim permintaan revisi
            </Button>
          </>
        }
      >
        <label className="mb-1 block text-xs font-medium" htmlFor="approval-note">
          Catatan revisi
        </label>
        <Textarea
          id="approval-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="mis. turunkan klaim garansi jadi 14 hari"
        />
        <p className="mt-1 text-[11px] text-muted">
          Item kembali ke draf dan diajukan ulang setelah diperbaiki.
        </p>
      </Modal>
    </>
  );
}
