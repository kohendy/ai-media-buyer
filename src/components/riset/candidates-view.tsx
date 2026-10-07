"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, SlidersHorizontal, TriangleAlert, Plus } from "lucide-react";
import {
  Button,
  Chip,
  DetailList,
  Empty,
  Modal,
  PageHeader,
  Panel,
  Score,
  Select,
  Status,
  btnClass,
  notify,
  type ScoreTone,
} from "@/components/ui";

type CandidateScore = { label: string; value: string; pct: number; tone?: ScoreTone };

type Candidate = {
  id: string;
  name: string;
  kind: string;
  score: number;
  confidence: number;
  note: string;
  scores: CandidateScore[];
  reasons: string[];
};

const CANDIDATES: Candidate[] = [
  {
    id: "serum-vitamin-c",
    name: "Serum Vitamin C",
    kind: "Skincare · margin 62%",
    score: 4.2,
    confidence: 88,
    note: "Permintaan naik 18% (90 hari)",
    scores: [
      { label: "Permintaan", value: "5,0", pct: 100, tone: "success" },
      { label: "Persaingan", value: "3,0", pct: 60, tone: "warning" },
      { label: "Margin", value: "4,0", pct: 80, tone: "success" },
      { label: "Kemudahan diiklankan", value: "5,0", pct: 100, tone: "success" },
      { label: "Kecocokan dengan pemilik", value: "4,0", pct: 80 },
    ],
    reasons: [
      "Permintaan stabil dan berulang; ulasan banyak menyebut tekstur ringan.",
      "Persaingan sedang: banyak pemain, tetapi belum ada yang menonjolkan bukti bahan.",
    ],
  },
  {
    id: "blender-portable",
    name: "Blender Portable 4-in-1",
    kind: "Peralatan dapur · margin 58%",
    score: 3.6,
    confidence: 81,
    note: "Permintaan naik 9% (90 hari)",
    scores: [
      { label: "Permintaan", value: "4,0", pct: 80, tone: "success" },
      { label: "Persaingan", value: "3,0", pct: 60, tone: "warning" },
      { label: "Margin", value: "4,0", pct: 80, tone: "success" },
      { label: "Kemudahan diiklankan", value: "4,0", pct: 80 },
      { label: "Kecocokan dengan pemilik", value: "3,0", pct: 60, tone: "warning" },
    ],
    reasons: [
      "Visual produk mudah dibuat dan cocok untuk format video pendek.",
      "Klaim mudah rusak; perlu bukti dari pengguna asli.",
    ],
  },
  {
    id: "kue-kering-premium",
    name: "Kue Kering Premium",
    kind: "Offline service · margin 67%",
    score: 3.6,
    confidence: 76,
    note: "Musiman (Lebaran & Natal)",
    scores: [
      { label: "Permintaan", value: "4,0", pct: 80, tone: "success" },
      { label: "Persaingan", value: "2,0", pct: 40, tone: "danger" },
      { label: "Margin", value: "5,0", pct: 100, tone: "success" },
      { label: "Kemudahan diiklankan", value: "3,0", pct: 60, tone: "warning" },
      { label: "Kecocokan dengan pemilik", value: "4,0", pct: 80 },
    ],
    reasons: [
      "Margin dan pembelian berulang tinggi di musim tertentu.",
      "Bukan online fisik; butuh radius layanan dan kapasitas produksi.",
    ],
  },
  {
    id: "alat-rumah-multifungsi",
    name: "Alat Rumah Multifungsi",
    kind: "Peralatan rumah · margin 45%",
    score: 3.2,
    confidence: 69,
    note: "Permintaan datar",
    scores: [
      { label: "Permintaan", value: "3,0", pct: 60, tone: "warning" },
      { label: "Persaingan", value: "3,0", pct: 60, tone: "warning" },
      { label: "Margin", value: "4,0", pct: 80, tone: "success" },
      { label: "Kemudahan diiklankan", value: "3,0", pct: 60, tone: "warning" },
      { label: "Kecocokan dengan pemilik", value: "3,0", pct: 60, tone: "warning" },
    ],
    reasons: [
      "Harga jual tinggi dan stok mudah dicari.",
      "Margin di bawah minimum 55% dan permintaan cenderung datar.",
    ],
  },
];

type SortKey = "score" | "name" | "confidence";

export function CandidatesView() {
  const [sort, setSort] = useState<SortKey>("score");
  const [onlyHigh, setOnlyHigh] = useState(false);
  const [selected, setSelected] = useState<Candidate | null>(null);

  const visible = useMemo(() => {
    const list = CANDIDATES.filter((c) => !onlyHigh || c.score >= 4.0);
    return list.slice().sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "id");
      if (sort === "confidence") return b.confidence - a.confidence;
      return b.score - a.score;
    });
  }, [sort, onlyHigh]);

  return (
    <>
      <PageHeader
        title="Riset Pasar"
        description="Kandidat produk diberi skor dan alasan sebelum Anda memilih satu. Data contoh."
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => notify("Formulir kandidat baru tersedia pada halaman Brief Produk Baru.")}
        >
          Tambah kandidat
        </Button>
      </PageHeader>

      <Panel
        title="Konteks pemilik"
        description="Batasan yang dipakai menyaring kandidat"
        icon={SlidersHorizontal}
      >
        <DetailList
          items={[
            { term: "Jenis produk", value: "Online, produk fisik" },
            { term: "Lokasi / radius", value: "Nasional (kirim dari Jakarta)" },
            { term: "Modal awal", value: "Rp 15.000.000" },
            { term: "Margin minimum", value: "55%" },
          ]}
        />
      </Panel>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid w-[220px] gap-0.5">
          <label className="text-xs font-medium" htmlFor="riset-sort">
            Urutkan
          </label>
          <Select
            id="riset-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
          >
            <option value="score">Skor tertinggi</option>
            <option value="name">Nama (A–Z)</option>
            <option value="confidence">Keyakinan tertinggi</option>
          </Select>
        </div>
        <Chip pressed={onlyHigh} onClick={() => setOnlyHigh((v) => !v)}>
          Hanya skor ≥ 4,0
        </Chip>
        <span className="text-xs text-muted">{visible.length} kandidat</span>
      </div>

      <p className="m-0 text-xs text-muted">
        Skor 0–5 pada lima pertanyaan Jev. Untuk persaingan, skor tinggi berarti pasar makin ramai.
      </p>

      <div className="grid gap-4">
        {visible.map((candidate) => (
          <Panel
            key={candidate.id}
            title={candidate.name}
            description={candidate.kind}
            icon={Check}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-base font-semibold tabular-nums">
                Rata-rata {candidate.score.toFixed(1).replace(".", ",")} / 5
              </span>
              <Status
                label={`Keyakinan ${candidate.confidence}%`}
                tone={candidate.confidence >= 85 ? "success" : "warning"}
              />
              <span className="text-[11px] text-muted">{candidate.note}</span>
            </div>

            <div className="mt-3 grid gap-x-5 gap-y-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
              {candidate.scores.map((score) => (
                <Score key={score.label} {...score} />
              ))}
            </div>

            <ul className="mt-3.5 grid list-none gap-1 p-0">
              {candidate.reasons.map((reason, index) => (
                <li key={reason} className="flex gap-2 text-xs text-secondary">
                  {index === 0 ? (
                    <Check className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden />
                  ) : (
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden />
                  )}
                  {reason}
                </li>
              ))}
            </ul>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <Button variant="primary" onClick={() => setSelected(candidate)}>
                Pilih produk
              </Button>
              <Link className={btnClass("default")} href={`/riset/${candidate.id}`}>
                Lihat market brief
              </Link>
            </div>
          </Panel>
        ))}

        {visible.length === 0 ? (
          <Panel>
            <Empty
              icon={SlidersHorizontal}
              title="Tidak ada kandidat yang cocok"
              message="Longgarkan filter skor untuk melihat semua kandidat."
            />
          </Panel>
        ) : null}
      </div>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="Pilih produk ini?"
        description="Keputusan akhir ada di pemilik. Setelah disetujui, produk menjadi konteks tahap audiens, landing page, dan creative."
        footer={
          <>
            <Button onClick={() => setSelected(null)}>Batal</Button>
            <Button
              variant="primary"
              onClick={() => {
                const name = selected?.name ?? "";
                setSelected(null);
                notify(`${name} disetujui sebagai produk aktif. Lanjut ke insight produk dan audiens.`);
              }}
            >
              Setujui pilihan produk
            </Button>
          </>
        }
      >
        <p className="text-sm text-secondary">
          {selected ? `${selected.name} · kandidat terpilih` : ""}
        </p>
      </Modal>
    </>
  );
}
