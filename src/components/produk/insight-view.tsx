"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { titleize } from "@/lib/slug";
import {
  BadgeCheck,
  FileQuestion,
  HeartCrack,
  ListChecks,
  MessageCircleQuestion,
  Search,
  Sparkles,
  User,
} from "lucide-react";
import {
  Button,
  Chip,
  DetailList,
  Empty,
  PageHeader,
  Panel,
  Stat,
  Status,
  btnClass,
  notify,
  type Tone,
} from "@/components/ui";

type Insight = {
  id: string;
  kind: "strength" | "pain";
  badges: Array<{ label: string; tone: Tone }>;
  statement: string;
  detail: string;
  needsProof: boolean;
};

const INSIGHTS: Insight[] = [
  {
    id: "s1",
    kind: "strength",
    badges: [{ label: "Dari brief", tone: "info" }, { label: "Risiko klaim rendah", tone: "success" }],
    statement: "Kandungan vitamin C stabil 15% per pemakaian",
    detail: "Jenis: fitur · Bukti: ada (label & keterangan pemilik) · Prioritas 1",
    needsProof: false,
  },
  {
    id: "s2",
    kind: "strength",
    badges: [{ label: "Dari brief", tone: "info" }, { label: "Risiko klaim rendah", tone: "success" }],
    statement: "Tekstur ringan dan tidak lengket, nyaman untuk kulit berminyak",
    detail: 'Jenis: manfaat · Bukti: ada (foto tekstur) · Menjawab pain point "cepat kusam"',
    needsProof: false,
  },
  {
    id: "s3",
    kind: "strength",
    badges: [{ label: "Dari brief", tone: "info" }, { label: "Risiko klaim rendah", tone: "success" }],
    statement: "Kemasan 30 ml praktis untuk dibawa bepergian",
    detail: "Jenis: fitur · Bukti: ada (foto produk asli) · Prioritas 3",
    needsProof: false,
  },
  {
    id: "s4",
    kind: "strength",
    badges: [{ label: "Dugaan AI", tone: "warning" }, { label: "Butuh bukti", tone: "warning" }],
    statement: "Harga lebih rendah daripada kompetitor sejenis",
    detail: "Jenis: pembeda · Perlu data harga pembanding sebelum dipakai sebagai klaim",
    needsProof: true,
  },
  {
    id: "p1",
    kind: "pain",
    badges: [{ label: "Dugaan AI", tone: "warning" }, { label: "Intensitas tinggi", tone: "danger" }],
    statement: "Kulit berminyak cepat kusam di tengah hari",
    detail: 'Frasa audiens: "berapa lama tahan?", "jam 3 sudah kusam" · Menjawab kekuatan "tekstur ringan"',
    needsProof: true,
  },
  {
    id: "p2",
    kind: "pain",
    badges: [{ label: "Dari brief", tone: "info" }, { label: "Risiko klaim tinggi", tone: "danger" }],
    statement: "Takut produk tidak cocok dan justru memicu breakout",
    detail: 'Klaim kesehatan; hanya boleh dipakai dengan bukti. Menjawab kekuatan "vitamin C stabil"',
    needsProof: true,
  },
  {
    id: "p3",
    kind: "pain",
    badges: [{ label: "Dugaan AI", tone: "warning" }, { label: "Intensitas sedang", tone: "warning" }],
    statement: "Bingung memilih di antara banyak merek yang mirip",
    detail: 'Frasa audiens: "bedanya apa?", "takut salah beli" · Menjawab kekuatan "harga lebih rendah"',
    needsProof: true,
  },
];

type Filter = "all" | "strength" | "pain" | "proof";

export function InsightView({ productId }: { productId: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState(INSIGHTS);
  const [pinned, setPinned] = useState<Record<string, boolean>>({});

  const visible = useMemo(
    () =>
      items.filter((item) => {
        if (filter === "all") return true;
        if (filter === "strength") return item.kind === "strength";
        if (filter === "pain") return item.kind === "pain";
        return item.needsProof;
      }),
    [items, filter],
  );

  const proofCount = items.filter((item) => item.needsProof).length;

  return (
    <>
      <PageHeader
        title="Insight Produk"
        description={`${titleize(productId)} · dari brief manual (v1) · 7 Oktober 2026. Insight terkonfirmasi menjadi dasar landing page dan creative.`}
      >
        <Status label="Draf · menunggu konfirmasi" tone="warning" />
        <Link className={btnClass("default")} href="/produk/baru">
          Ubah brief
        </Link>
        <Button
          variant="primary"
          icon={BadgeCheck}
          onClick={() => {
            notify("Insight terkonfirmasi. Audiens, landing page, dan creative memakai insight ini.");
            router.push("/audiens");
          }}
        >
          Konfirmasi insight
        </Button>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Sparkles} title="Kekuatan" value={String(items.filter((i) => i.kind === "strength").length)} delta="dari brief & dugaan" trend="flat" />
        <Stat icon={HeartCrack} title="Pain point" value={String(items.filter((i) => i.kind === "pain").length)} delta="2 dugaan AI" trend="flat" />
        <Stat icon={FileQuestion} title="Butuh bukti" value={String(proofCount)} delta="perlu diisi pemilik" trend="down" />
        <Stat icon={BadgeCheck} title="Terkonfirmasi" value="0" delta="belum ada" trend="flat" />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Panel title="Kekuatan dan pain point" icon={ListChecks}>
          <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="Filter insight">
            {(
              [
                ["all", "Semua"],
                ["strength", "Kekuatan"],
                ["pain", "Pain point"],
                ["proof", "Butuh bukti"],
              ] as Array<[Filter, string]>
            ).map(([key, label]) => (
              <Chip key={key} pressed={filter === key} onClick={() => setFilter(key)}>
                {label}
              </Chip>
            ))}
            <span className="text-xs text-muted">{visible.length} tampil</span>
          </div>

          {visible.length === 0 ? (
            <Empty icon={Search} title="Tidak ada insight pada filter ini" message="Pilih filter lain untuk melihat insight lainnya." />
          ) : (
            <ul className="m-0 list-none p-0">
              {visible.map((item) => (
                <li key={item.id} className="flex gap-3 border-t border-divider py-3.5 first:border-t-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border bg-frame px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.04em] uppercase text-secondary">
                        {item.kind === "strength" ? "Kekuatan" : "Pain point"}
                      </span>
                      {item.badges.map((badge) => (
                        <Status key={badge.label} label={badge.label} tone={badge.tone} />
                      ))}
                      {pinned[item.id] ? <Status label="Dikunci" tone="info" /> : null}
                    </div>
                    <p className="mt-1.5 text-sm font-medium">{item.statement}</p>
                    <p className="mt-1 text-xs text-muted">{item.detail}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <Button
                        onClick={() => {
                          setPinned((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
                          notify(pinned[item.id] ? "Insight dibuka kembali." : "Insight dikunci. Tidak ikut dihasilkan ulang.");
                        }}
                      >
                        {pinned[item.id] ? "Terbuka" : "Kunci"}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => {
                          setItems((list) => list.filter((entry) => entry.id !== item.id));
                          notify("Insight ditolak dan dipindahkan ke riwayat.");
                        }}
                      >
                        Tolak
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="grid gap-4">
          <Panel title="Ringkasan brief" description="Sumber: brief manual v1" icon={User}>
            <DetailList
              items={[
                { term: "Produk", value: "Serum Vitamin C" },
                { term: "Harga", value: "Rp 129.000 · 30 ml" },
                { term: "Target", value: "Perempuan 20–35, kulit berminyak" },
                { term: "Nada bahasa", value: "Ramah dan santai" },
              ]}
            />
          </Panel>

          <Panel title="Pertanyaan klarifikasi" description="Maksimal lima sekaligus" icon={MessageCircleQuestion}>
            <ul className="m-0 list-none p-0">
              <li className="flex gap-3 border-t border-divider py-3 first:border-t-0">
                <span className="grid size-8 shrink-0 place-items-center rounded-control border border-border bg-surface">
                  <FileQuestion className="size-4 text-secondary" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium">Apakah ada hasil uji lab atau sertifikasi?</h3>
                  <p className="mt-1 text-xs text-muted">Belum dijawab · dibutuhkan untuk klaim faktual</p>
                </div>
              </li>
              <li className="flex gap-3 border-t border-divider py-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-control border border-border bg-surface">
                  <MessageCircleQuestion className="size-4 text-secondary" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium">Satu botol cukup untuk berapa lama?</h3>
                  <p className="mt-1 text-xs text-muted">
                    Dijawab pemilik: sekitar satu bulan, pemakaian dua kali sehari
                  </p>
                </div>
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
