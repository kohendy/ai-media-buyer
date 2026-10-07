"use client";

import { useMemo, useState } from "react";
import { CalendarClock, FileCheck, FlaskConical, Plus, Trophy } from "lucide-react";
import {
  Button,
  Chip,
  DetailList,
  Empty,
  Modal,
  PageHeader,
  Panel,
  Score,
  Stat,
  Status,
  notify,
  type ScoreTone,
  type Tone,
} from "@/components/ui";

type Arm = { key: string; name: string; results: string; detail: string; pct: number; tone: ScoreTone; winner?: boolean };

type Experiment = {
  id: string;
  title: string;
  hypothesis: string;
  variable: string;
  status: "running" | "concluded" | "planned";
  statusLabel: string;
  statusTone: Tone;
  arms: Arm[];
  facts?: string;
  plan?: Array<{ term: string; value: string }>;
};

const INITIAL: Experiment[] = [
  {
    id: "ex1",
    title: "Angle: bukti sosial vs masalah-solusi",
    hypothesis: "Hipotesis: angle bukti sosial menurunkan CPA",
    variable: "angle",
    status: "running",
    statusLabel: "Berjalan",
    statusTone: "info",
    arms: [
      { key: "A", name: "Masalah–solusi", results: "22 / 30 hasil", detail: "CPA Rp 58.000 · ROAS 3,0×", pct: 73, tone: "warning" },
      { key: "B", name: "Bukti sosial", results: "34 / 30 hasil", detail: "CPA Rp 44.375 · ROAS 3,9× · unggul 34%", pct: 100, tone: "success", winner: true },
    ],
    facts: "34 hasil pada varian B · CPA Rp 44.375 (target Rp 60.000) · selisih CPA 23% dibanding A · data minimum terpenuhi.",
  },
  {
    id: "ex2",
    title: "Visual: foto asli vs latar AI",
    hypothesis: "Hipotesis: foto asli menaikkan CTR",
    variable: "visual",
    status: "concluded",
    statusLabel: "Selesai",
    statusTone: "success",
    arms: [
      { key: "A", name: "Foto asli", results: "40 / 30 hasil", detail: "CTR 2,1% · CPA Rp 46.000", pct: 100, tone: "success", winner: true },
      { key: "B", name: "Latar AI", results: "40 / 30 hasil", detail: "CTR 1,6% · CPA Rp 62.000", pct: 100, tone: "accent" },
    ],
    facts: "Pemenang: foto asli (A). CTR 2,1% vs 1,6% · CPA Rp 46.000 vs Rp 62.000. Varian B dijeda; variasi dibuat dari angle pemenang.",
  },
  {
    id: "ex3",
    title: "Penawaran: gratis ongkir vs bundling",
    hypothesis: "Hipotesis: bundling menaikkan ROAS",
    variable: "penawaran",
    status: "planned",
    statusLabel: "Rencana",
    statusTone: "warning",
    arms: [],
    plan: [
      { term: "Metrik penentu", value: "ROAS" },
      { term: "Ukuran minimum", value: "30 hasil per varian" },
      { term: "Budget total", value: "Rp 1.200.000" },
      { term: "Durasi", value: "5 hari" },
    ],
  },
];

const FILTERS: Array<{ key: Experiment["status"] | "all"; label: string }> = [
  { key: "all", label: "Semua" },
  { key: "running", label: "Berjalan" },
  { key: "concluded", label: "Selesai" },
  { key: "planned", label: "Rencana" },
];

export function EksperimenView() {
  const [experiments, setExperiments] = useState(INITIAL);
  const [filter, setFilter] = useState<Experiment["status"] | "all">("all");
  const [detail, setDetail] = useState<Experiment | null>(null);

  const visible = useMemo(
    () => experiments.filter((e) => filter === "all" || e.status === filter),
    [experiments, filter],
  );

  return (
    <>
      <PageHeader
        title="Eksperimen"
        description="Satu variabel per eksperimen, kriteria menang ditulis sebelum aktif. Pemenang ditetapkan aturan kode, bukan tebakan. Data contoh."
      >
        <Button variant="primary" icon={Plus} onClick={() => notify("Susun variabel, hipotesis, ukuran minimum, dan kriteria menang sebelum aktif.")}>
          Eksperimen baru
        </Button>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={FlaskConical} title="Berjalan" value="1" delta="data cukup di 1 varian" trend="flat" />
        <Stat icon={Trophy} title="Selesai" value="1" delta="pemenang ditetapkan" trend="up" />
        <Stat icon={CalendarClock} title="Rencana" value="1" delta="menunggu peluncuran" trend="flat" />
        <Stat icon={FileCheck} title="Kriteria tertulis" value="100%" delta="3 dari 3" trend="up" />
      </section>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter status">
        {FILTERS.map((item) => (
          <Chip key={item.key} pressed={filter === item.key} onClick={() => setFilter(item.key)}>
            {item.label}
          </Chip>
        ))}
      </div>

      {visible.length === 0 ? (
        <Panel>
          <Empty icon={FlaskConical} title="Tidak ada eksperimen" message="Pilih filter lain." />
        </Panel>
      ) : (
        <div className="grid gap-4">
          {visible.map((experiment) => (
            <Panel
              key={experiment.id}
              title={experiment.title}
              description={experiment.hypothesis}
              icon={experiment.status === "concluded" ? Trophy : FlaskConical}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border bg-frame px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.04em] uppercase text-secondary">
                  Variabel: {experiment.variable}
                </span>
                <Status label={experiment.statusLabel} tone={experiment.statusTone} />
                {experiment.status === "running" ? (
                  <span className="text-xs text-muted">
                    Metrik penentu: CPA · min 30 hasil per varian · menang bila selisih ≥ 15%
                  </span>
                ) : null}
              </div>

              {experiment.arms.length > 0 ? (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {experiment.arms.map((arm) => (
                    <div
                      key={arm.key}
                      className={
                        arm.winner
                          ? "grid gap-2 rounded-control border border-success/45 bg-success/5 p-3"
                          : "grid gap-2 rounded-control border border-border p-3"
                      }
                    >
                      <div className="flex items-center gap-2">
                        <Status label={arm.key} tone={arm.winner ? "success" : "neutral"} />
                        <b className="text-sm font-medium">{arm.name}</b>
                        <span className="ml-auto text-xs text-muted">{arm.results}</span>
                      </div>
                      <p className="m-0 text-xs text-muted">{arm.detail}</p>
                      <Score label="Progres data" value={arm.results.split(" ")[0] + "/" + arm.results.split(" ")[2]} pct={arm.pct} tone={arm.tone} />
                    </div>
                  ))}
                </div>
              ) : null}

              {experiment.plan ? <DetailList className="mt-3" items={experiment.plan} /> : null}

              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                {experiment.status === "running" ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setExperiments((list) =>
                        list.map((e) =>
                          e.id === experiment.id ? { ...e, status: "concluded", statusLabel: "Selesai", statusTone: "success" } : e,
                        ),
                      );
                      notify("Pemenang \"Bukti sosial (B)\" ditetapkan. Varian kalah dijeda dan variasi dibuat dari pemenang.");
                    }}
                  >
                    Tetapkan pemenang
                  </Button>
                ) : null}
                {experiment.facts ? <Button onClick={() => setDetail(experiment)}>Lihat hasil</Button> : null}
                {experiment.status === "concluded" ? (
                  <Button onClick={() => notify("Susun eksperimen berikutnya: satu variabel, kriteria menang tertulis.")}>
                    Uji eksperimen berikutnya
                  </Button>
                ) : null}
                {experiment.status === "planned" ? (
                  <Button variant="primary" onClick={() => notify("Rencana peluncuran disiapkan: kampanye PAUSED dan ringkasan approval dibuat.")}>
                    Siapkan peluncuran
                  </Button>
                ) : null}
              </div>
            </Panel>
          ))}
        </div>
      )}

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title="Hasil eksperimen"
        description={detail?.title}
        footer={<Button onClick={() => setDetail(null)}>Tutup</Button>}
      >
        <p className="text-sm leading-relaxed text-secondary">{detail?.facts}</p>
      </Modal>
    </>
  );
}
