"use client";

import { useState } from "react";
import { BadgePercent, Gauge, History, OctagonAlert, OctagonX, Pause, Repeat, Save, SlidersHorizontal, Target, TrendingUp, ToggleRight } from "lucide-react";
import {
  Button,
  DetailList,
  Field,
  Input,
  PageHeader,
  Panel,
  Stat,
  Status,
  notify,
} from "@/components/ui";

const TRIGGERS = [
  "Frekuensi melewati ambang disertai CTR menurun",
  "CPA di atas target meski data cukup",
  "Pemenang A/B ditemukan (buat variasi)",
  "Jadwal batch mingguan",
];

export function AturanView() {
  const [mode, setMode] = useState<"suggest" | "auto">("suggest");
  const [kill, setKill] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({
    capAds: "500000",
    capDaily: "2000000",
    capStep: "20",
    capGap: "48",
    scaleDays: "4",
    scaleStep: "20",
    scaleMin: "30",
    scaleGap: "48",
    pauseCpa: "1.5",
    pauseSpend: "2",
    fatFreq: "3.0",
    fatCtr: "15",
    jev: "80",
  });
  const [triggers, setTriggers] = useState<boolean[]>(TRIGGERS.map(() => true));

  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  function save() {
    const invalid = Object.entries(values).find(([, v]) => !isFinite(Number(v.replace(",", "."))) || Number(v.replace(",", ".")) <= 0);
    if (invalid) {
      notify("Periksa kembali nilai yang belum valid.");
      return;
    }
    notify("Aturan dan batas disimpan. Batas keras berlaku pada aksi berikutnya.");
  }

  const modeLabel = mode === "auto" ? "Otomatis" : "Saran";

  return (
    <>
      <PageHeader
        title="Aturan & Batas"
        description="Batas keras diperiksa di lapisan kode sebelum aksi dikirim ke Meta; model AI tidak dapat melewatinya. Data contoh."
      >
        <Status label={mode === "auto" ? "Otomatis dengan batas" : "Saran + approve"} tone={mode === "auto" ? "warning" : "info"} />
        <Button icon={History} onClick={() => notify("Riwayat perubahan aturan ditampilkan pada halaman Log.")}>
          Riwayat perubahan
        </Button>
        <Button variant="primary" icon={Save} onClick={save}>
          Simpan perubahan
        </Button>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={SlidersHorizontal} title="Mode operasi" value={modeLabel} delta="approve dulu" trend="flat" />
        <Stat icon={Target} title="Target CPA" value="Rp 60.000" delta="per hasil" trend="flat" />
        <Stat icon={Gauge} title="Batas harian" value="Rp 2 jt" delta="total semua iklan" trend="flat" />
        <Stat icon={BadgePercent} title="Ambang Jev" value="80%" delta="di bawah → diteruskan" trend="flat" />
      </section>

      <Panel title="Mode operasi" description="Otomatis tetap tunduk pada batas keras" icon={ToggleRight}>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              { key: "suggest" as const, chip: "Bawaan", title: "Saran + approve", body: "Setiap aksi menunggu persetujuan pemilik sebelum dikirim ke Meta." },
              { key: "auto" as const, chip: "Perlu kehati-hatian", title: "Otomatis dengan batas", body: "Aksi dalam batas dijalankan otomatis. Aktifkan hanya setelah aturan terbukti beberapa minggu." },
            ]
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={mode === option.key}
              onClick={() => {
                setMode(option.key);
                notify(option.key === "auto" ? "Mode otomatis diaktifkan. Tetap tunduk pada batas keras." : "Mode saran + approve diaktifkan.");
              }}
              className={
                "flex gap-2.5 rounded-control border p-3.5 text-left " +
                (mode === option.key ? "border-accent shadow-[inset_0_0_0_1px_var(--color-accent)]" : "border-border")
              }
            >
              <div className="min-w-0">
                <span className="mb-1.5 inline-block rounded-full border border-border bg-frame px-2 py-0.5 text-[11px] text-secondary">
                  {option.chip}
                </span>
                <b className="block text-sm font-medium">{option.title}</b>
                <span className="mt-1 block text-xs text-muted">{option.body}</span>
              </div>
            </button>
          ))}
        </div>
        {mode === "auto" ? (
          <p className="mt-3 text-xs text-muted">
            Mode otomatis aktif. Kill switch, batas keras, dan kunci tracking tetap berlaku.
          </p>
        ) : null}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Batas keras" description="Tidak dapat dilewati model AI" icon={OctagonAlert}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Budget harian maks per iklan (Rp)" htmlFor="cap-ads">
              <Input id="cap-ads" inputMode="numeric" value={values.capAds} onChange={(e) => set("capAds", e.target.value)} />
            </Field>
            <Field label="Total spend harian maks (Rp)" htmlFor="cap-daily">
              <Input id="cap-daily" inputMode="numeric" value={values.capDaily} onChange={(e) => set("capDaily", e.target.value)} />
            </Field>
            <Field label="Kenaikan maksimum per langkah (%)" htmlFor="cap-step">
              <Input id="cap-step" inputMode="numeric" value={values.capStep} onChange={(e) => set("capStep", e.target.value)} />
            </Field>
            <Field label="Jeda minimum antar scale (jam)" htmlFor="cap-gap">
              <Input id="cap-gap" inputMode="numeric" value={values.capGap} onChange={(e) => set("capGap", e.target.value)} />
            </Field>
          </div>
        </Panel>

        <Panel title="Aturan scale" description="Naikkan budget hanya bila kondisi terpenuhi" icon={TrendingUp}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CPA di bawah target selama (hari)" htmlFor="scale-days">
              <Input id="scale-days" inputMode="numeric" value={values.scaleDays} onChange={(e) => set("scaleDays", e.target.value)} />
            </Field>
            <Field label="Kenaikan per langkah (%)" htmlFor="scale-step">
              <Input id="scale-step" inputMode="numeric" value={values.scaleStep} onChange={(e) => set("scaleStep", e.target.value)} />
            </Field>
            <Field label="Hasil minimum sebelum scale" htmlFor="scale-min">
              <Input id="scale-min" inputMode="numeric" value={values.scaleMin} onChange={(e) => set("scaleMin", e.target.value)} />
            </Field>
            <Field label="Jeda antar scale (jam)" htmlFor="scale-gap">
              <Input id="scale-gap" inputMode="numeric" value={values.scaleGap} onChange={(e) => set("scaleGap", e.target.value)} />
            </Field>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Scale dikunci otomatis bila tracking bermasalah atau kill switch aktif.
          </p>
        </Panel>

        <Panel title="Aturan pause" description="Hentikan bila biaya tidak terkendali" icon={Pause}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CPA di atas (× target)" htmlFor="pause-cpa">
              <Input id="pause-cpa" inputMode="decimal" value={values.pauseCpa} onChange={(e) => set("pauseCpa", e.target.value)} />
            </Field>
            <Field label="Spend tanpa hasil (× CPA target)" htmlFor="pause-spend">
              <Input id="pause-spend" inputMode="decimal" value={values.pauseSpend} onChange={(e) => set("pauseSpend", e.target.value)} />
            </Field>
          </div>
        </Panel>

        <Panel title="Kejenuhan creative" description="Pemicu creative baru" icon={Repeat}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ambang frekuensi" htmlFor="fat-freq">
              <Input id="fat-freq" inputMode="decimal" value={values.fatFreq} onChange={(e) => set("fatFreq", e.target.value)} />
            </Field>
            <Field label="Penurunan CTR (%)" htmlFor="fat-ctr">
              <Input id="fat-ctr" inputMode="numeric" value={values.fatCtr} onChange={(e) => set("fatCtr", e.target.value)} />
            </Field>
          </div>
          <div className="mt-3 grid gap-2">
            {TRIGGERS.map((trigger, index) => (
              <label key={trigger} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={triggers[index]}
                  onChange={() => setTriggers((list) => list.map((v, i) => (i === index ? !v : v)))}
                />
                {trigger}
              </label>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Ambang keyakinan Jev" description="Di bawah ambang, penilaian diteruskan ke Claude atau manusia" icon={BadgePercent}>
          <div className="max-w-[220px]">
            <Field label="Ambang keyakinan (%)" htmlFor="jev">
              <Input id="jev" inputMode="numeric" value={values.jev} onChange={(e) => set("jev", e.target.value)} />
            </Field>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Setel ulang setelah beberapa minggu berdasarkan dasbor akurasi per pertanyaan.
          </p>
        </Panel>

        <Panel title="Kill switch" description="Menghentikan seluruh aksi tulis otomatis" icon={OctagonX}>
          <div className="flex flex-wrap items-center gap-3">
            <Status label={kill ? "Aktif" : "Tidak aktif"} tone={kill ? "danger" : "success"} />
            <Button
              variant="danger"
              aria-pressed={kill}
              className="ml-auto"
              onClick={() => {
                const next = !kill;
                setKill(next);
                notify(next ? "Kill switch aktif. Semua aksi otomatis dihentikan." : "Kill switch dimatikan. Aksi otomatis dilanjutkan.");
              }}
            >
              {kill ? "Aktifkan kembali" : "Hentikan semua aksi"}
            </Button>
          </div>
          <DetailList
            className="mt-3"
            items={[
              { term: "Status", value: kill ? "Aktif" : "Tidak aktif" },
              { term: "Dampak", value: "Workflow hanya membaca; persetujuan terkunci" },
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
