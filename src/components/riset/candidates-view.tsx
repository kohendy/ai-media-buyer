"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, SlidersHorizontal, Plus, RefreshCw } from "lucide-react";
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
} from "@/components/ui";
import { ResearchFormModal } from "./research-form-modal";
import type { Score as ScoreType } from "@/lib/riset-types";

type MarketBrief = {
  id: string;
  demandSummary: string;
  priceMin: number | null;
  priceMax: number | null;
  version: number;
  createdAt: string;
} | null;

type JobStatus = {
  id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  error: string | null;
  createdAt: string;
} | null;

type ProductStatus = "candidate" | "selected" | "rejected" | "archived";

type Candidate = {
  id: string;
  name: string;
  kind: string;
  score: number | null;
  confidence: number | null;
  context: Record<string, unknown> | null;
  marketBrief: MarketBrief;
  latestJob: JobStatus;
  status: ProductStatus;
  scores: ScoreType[];
};

type SortKey = "score" | "name" | "confidence";

interface CandidatesViewProps {
  initialCandidates: Candidate[];
}

function formatRupiah(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function getJobStatusTone(status: "queued" | "running" | "succeeded" | "failed"): "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "succeeded":
      return "success";
    case "running":
      return "info";
    case "failed":
      return "danger";
    default:
      return "warning";
  }
}

function getJobStatusLabel(status: "queued" | "running" | "succeeded" | "failed"): string {
  switch (status) {
    case "queued":
      return "Antrean";
    case "running":
      return "Berjalan";
    case "succeeded":
      return "Selesai";
    case "failed":
      return "Gagal";
    default:
      return "—";
  }
}

const QUESTION_LABELS: Record<string, string> = {
  demand: "Permintaan",
  competition: "Persaingan",
  margin: "Margin",
  ad_ease: "Kemudahan diiklankan",
  owner_fit: "Kecocokan pemilik",
};

const QUESTION_KEYS = ["demand", "competition", "margin", "ad_ease", "owner_fit"] as const;

export function CandidatesView({ initialCandidates }: CandidatesViewProps) {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [sort, setSort] = useState<SortKey>("score");
  const [onlyHigh, setOnlyHigh] = useState(false);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  // Polling state: single timer for all active jobs
  const [polling, setPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const backoffRef = useRef(5000); // start at 5s, max 30s

  // Determine which job IDs need polling (queued or running)
  const activeJobIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of candidates) {
      if (c.latestJob && (c.latestJob.status === "queued" || c.latestJob.status === "running")) {
        ids.add(c.latestJob.id);
      }
    }
    return Array.from(ids);
  }, [candidates]);

  // Poll all active jobs with single timer + backoff
  const pollJobs = useCallback(async () => {
    if (activeJobIds.length === 0) {
      setPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setPolling(true);
    let anyStillActive = false;

    for (const jobId of activeJobIds) {
      try {
        const res = await fetch(`/api/workflows/jobs/${jobId}`);
        if (!res.ok) continue;
        const data = await res.json();
        const job = data.job;
        if (!job) continue;

        anyStillActive = job.status === "queued" || job.status === "running";

        // Update candidate(s) with this job
        setCandidates((prev) =>
          prev.map((c) =>
            c.latestJob?.id === jobId ? { ...c, latestJob: job } : c
          )
        );

        if (job.status === "succeeded") {
          // Refresh server data to get updated scores, briefs, status
          router.refresh();
          notify("Riset selesai. Data kandidat diperbarui.");
        } else if (job.status === "failed") {
          notify(`Riset gagal: ${job.error ?? "Unknown error"}`);
        }
      } catch {
        // ignore network errors, will retry with backoff
      }
    }

    // Adjust backoff
    if (anyStillActive) {
      backoffRef.current = Math.min(backoffRef.current * 1.5, 30000);
    } else {
      backoffRef.current = 5000;
      setPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [activeJobIds, router]);

  // Start/stop polling based on activeJobIds
  useEffect(() => {
    if (activeJobIds.length > 0 && !intervalRef.current) {
      backoffRef.current = 5000;
      pollJobs(); // immediate first poll
      intervalRef.current = setInterval(pollJobs, backoffRef.current);
    } else if (activeJobIds.length === 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setPolling(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeJobIds, pollJobs]);

  const visible = useMemo(() => {
    const list = candidates.filter((c) => !onlyHigh || (c.score ?? 0) >= 4.0);
    return list.slice().sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "id");
      if (sort === "confidence") return (b.confidence ?? 0) - (a.confidence ?? 0);
      return (b.score ?? 0) - (a.score ?? 0);
    });
  }, [candidates, sort, onlyHigh]);

  const handleStartResearch = useCallback(async (data: {
    ownerContext: Record<string, unknown>;
    candidates: Array<{ name: string; category?: string; note?: string }>;
    suggestFromCategory?: string;
  }) => {
    const res = await fetch("/api/research", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      const msg = result.error?.message || "Gagal memulai riset";
      throw new Error(msg);
    }
    // Tambahkan produk baru ke state lokal (optimistic)
    const newProducts = result.products.map((p: Candidate) => ({
      ...p,
      marketBrief: null,
      latestJob: { id: result.jobId, status: "queued" as const, error: null, createdAt: new Date().toISOString() },
      scores: [],
    }));
    setCandidates((prev) => [...newProducts, ...prev]);
    notify("Riset dimulai. Status job akan diperbarui otomatis.");
  }, []);

  const handleSelectProduct = useCallback(async (candidate: Candidate) => {
    if (candidate.status === "selected") {
      notify("Produk ini sudah dipilih.");
      return;
    }
    // Validasi: hanya boleh pilih jika ada market brief
    if (!candidate.marketBrief) {
      notify("Belum ada market brief. Tunggu riset selesai.");
      return;
    }
    try {
      const res = await fetch(`/api/products/${candidate.id}/select`, {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Gagal memilih produk");
      }
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidate.id ? { ...c, status: "selected" as ProductStatus } : c))
      );
      notify(`${candidate.name} dipilih sebagai produk aktif.`);
      setSelected(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal memilih produk";
      notify(msg);
    }
  }, []);

  // Ambil konteks pemilik dari kandidat pertama yang punya context
  const ownerContext = useMemo(() => {
    for (const c of candidates) {
      if (c.context?.ownerContext) return c.context.ownerContext as Record<string, unknown>;
    }
    return null;
  }, [candidates]);

  return (
    <>
      <PageHeader
        title="Riset Pasar"
        description={candidates.length === 0 ? "Belum ada riset. Klik tombol di bawah untuk memulai." : "Kandidat produk diberi skor dan alasan sebelum Anda memilih satu."}
      >
        <Button variant="primary" icon={Plus} onClick={() => setFormOpen(true)}>
          Mulai riset baru
        </Button>
        {polling && (
          <Button variant="default" icon={RefreshCw} disabled>
            Memantau {activeJobIds.length} job…
          </Button>
        )}
      </PageHeader>

      {ownerContext && (
        <Panel title="Konteks Pemilik" description="Batasan yang dipakai menyaring dan menilai kandidat" icon={SlidersHorizontal}>
          <DetailList
            items={[
              { term: "Jenis produk", value: ownerContext.productType as string },
              { term: "Lokasi / radius", value: ownerContext.location as string },
              { term: "Modal awal", value: formatRupiah(ownerContext.capitalIdr as number) },
              { term: "Margin minimum", value: `${ownerContext.minMarginPct}%` },
              { term: "Kemampuan produksi", value: (ownerContext.productionCapability as string).slice(0, 80) + "..." },
            ]}
          />
        </Panel>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid w-[220px] gap-0.5">
          <label className="text-xs font-medium" htmlFor="riset-sort">
            Urutkan
          </label>
          <Select
            id="riset-sort"
            value={sort}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setSort(event.target.value as SortKey)}
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
        Skor 1–5 pada lima pertanyaan Jev. Untuk persaingan, skor tinggi berarti persaingan rendah (lebih baik).
      </p>

      <div className="grid gap-4">
        {visible.map((candidate) => (
          <Panel key={candidate.id} title={candidate.name} description={candidate.kind} icon={Check}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-base font-semibold tabular-nums">
                {candidate.score != null ? `Rata-rata ${candidate.score.toFixed(1).replace(".", ",")} / 5` : "Belum dinilai"}
              </span>
              {candidate.confidence != null && (
                <Status
                  label={`Keyakinan ${candidate.confidence}%`}
                  tone={candidate.confidence >= 85 ? "success" : "warning"}
                />
              )}
              {candidate.latestJob && (
                <Status
                  label={getJobStatusLabel(candidate.latestJob.status)}
                  tone={getJobStatusTone(candidate.latestJob.status)}
                />
              )}
            </div>

            {candidate.score != null && candidate.scores.length > 0 && (
              <div className="mt-3 grid gap-x-5 gap-y-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
                {QUESTION_KEYS.map((key) => {
                  const score = candidate.scores.find((s) => s.questionKey === key);
                  if (!score) return null;
                  // Convert 1-5 scale to percentage for bar
                  const pct = (score.confidence * 100);
                  const tone = key === "competition" && score.answer === "tinggi" ? "danger" : "accent";
                  return (
                    <Score
                      key={key}
                      label={QUESTION_LABELS[key]}
                      value={`${score.answer} (${answerToScore(key, score.answer)} / 5)`}
                      pct={pct}
                      tone={tone}
                    />
                  );
                })}
              </div>
            )}

            {candidate.marketBrief && (
              <div className="mt-3 text-xs text-secondary">
                <strong>Market Brief v{candidate.marketBrief.version}</strong> ·{" "}
                {formatDate(candidate.marketBrief.createdAt)} ·{" "}
                <Link className="underline hover:text-accent" href={`/riset/${candidate.id}`}>
                  Lihat detail
                </Link>
              </div>
            )}

            {candidate.latestJob && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-muted">Job:</span>
                <code className="bg-frame px-1.5 py-0.5 rounded-inner font-mono">{candidate.latestJob.id.slice(0, 8)}…</code>
                <Status label={getJobStatusLabel(candidate.latestJob.status)} tone={getJobStatusTone(candidate.latestJob.status)} />
                {candidate.latestJob.error && (
                  <span className="text-danger-ink flex-1 truncate">⚠ {candidate.latestJob.error}</span>
                )}
              </div>
            )}

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              {candidate.status !== "selected" && candidate.marketBrief ? (
                <Button variant="primary" onClick={() => handleSelectProduct(candidate)} icon={Check}>
                  Pilih produk
                </Button>
              ) : candidate.status !== "selected" ? (
                <Button variant="default" disabled>
                  Menunggu brief
                </Button>
              ) : (
                <Button variant="default" disabled icon={Check}>
                  Dipilih
                </Button>
              )}
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
              title={candidates.length === 0 ? "Belum ada riset pasar" : "Tidak ada kandidat yang cocok"}
              message={candidates.length === 0 ? "Klik “Mulai riset baru” untuk memulai riset pertama Anda." : "Longgarkan filter skor untuk melihat semua kandidat."}
            />
          </Panel>
        ) : null}
      </div>

      {/* Modal konfirmasi pilih produk (tetap ada untuk UX) */}
      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="Pilih produk ini?"
        description="Keputusan akhir ada di pemilik. Setelah disetujui, produk menjadi konteks tahap audiens, landing page, dan creative."
        footer={
          <>
            <Button onClick={() => setSelected(null)}>Batal</Button>
            <Button variant="primary" onClick={() => handleSelectProduct(selected!)} disabled={!selected}>
              Setujui pilihan produk
            </Button>
          </>
        }
      >
        <p className="text-sm text-secondary">{selected ? `${selected.name} · kandidat terpilih` : ""}</p>
      </Modal>

      {/* Modal form riset baru */}
      <ResearchFormModal open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleStartResearch} />
    </>
  );
}

// Helper to compute score for display (1-5 scale with competition inverted)
function answerToScore(questionKey: string, answer: string): number {
  const normalized = answer.toLowerCase().trim();
  if (!["rendah", "sedang", "tinggi"].includes(normalized)) return 3;
  let score: number;
  switch (normalized) {
    case "rendah": score = 1; break;
    case "sedang": score = 3; break;
    case "tinggi": score = 5; break;
    default: score = 3;
  }
  if (questionKey === "competition") score = 6 - score;
  return score;
}