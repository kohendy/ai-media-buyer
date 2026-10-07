"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Check,
  Gauge,
  OctagonX,
  PlugZap,
  ReceiptText,
  Repeat,
  Target,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDecimal, formatNumber, formatPercent, formatRupiah, formatRupiahShort } from "@/lib/format";
import { Button, Empty, PageHeader, Panel, Select, Stat, Status, notify, type Tone, type Trend } from "@/components/ui";

const AOV = 175_000;
const TARGET = { cpa: 60_000, roas: 3.0 };

type PeriodKey = 7 | 30 | 90;
type MetricKey = "spend" | "hasil";

type PeriodData = {
  label: string;
  cmp: string;
  days: string[];
  spend: number[];
  hasil: number[];
  delta: Record<MetricKey | "cpa" | "roas", number>;
};

const PERIODS: Record<PeriodKey, PeriodData> = {
  7: {
    label: "7 hari terakhir",
    cmp: "vs 7 hari sebelumnya",
    days: ["Kam 1", "Jum 2", "Sab 3", "Min 4", "Sen 5", "Sel 6", "Rab 7"],
    spend: [1_850_000, 2_050_000, 1_980_000, 2_300_000, 2_450_000, 1_650_000, 1_420_000],
    hasil: [34, 39, 37, 43, 46, 30, 26],
    delta: { spend: -4.2, hasil: 6.4, cpa: -9.1, roas: 8.3 },
  },
  30: {
    label: "30 hari terakhir",
    cmp: "vs 30 hari sebelumnya",
    days: ["H-30", "H-26", "H-22", "H-18", "H-14", "H-10", "H-6", "H-2"],
    spend: [1_650_000, 1_780_000, 1_900_000, 2_040_000, 1_980_000, 2_180_000, 2_320_000, 1_520_000],
    hasil: [30, 33, 36, 39, 38, 41, 44, 28],
    delta: { spend: 3.4, hasil: 5.1, cpa: -1.6, roas: 1.6 },
  },
  90: {
    label: "90 hari terakhir",
    cmp: "vs 90 hari sebelumnya",
    days: ["H-90", "H-75", "H-60", "H-45", "H-30", "H-15"],
    spend: [6_200_000, 6_600_000, 7_100_000, 7_400_000, 7_800_000, 8_100_000],
    hasil: [118, 126, 135, 141, 149, 155],
    delta: { spend: 6.2, hasil: 9.8, cpa: -3.3, roas: 3.4 },
  },
};

type ApprovalItem = {
  id: string;
  kind: string;
  kindLabel: string;
  title: string;
  summary: string;
  reasons: string[];
};

const INITIAL_APPROVALS: ApprovalItem[] = [
  {
    id: "scale",
    kind: "scale",
    kindLabel: "Scale",
    title: 'Naikkan budget ad set "Uji Bukti Sosial-B"',
    summary: "Rp 150.000 → Rp 180.000 (+20%)",
    reasons: [
      "CPA di bawah target 4 hari berturut-turut",
      "38 hasil (minimum 30) · tracking sehat",
      "Batas keras lolos (maks +20%, jeda 48 jam)",
    ],
  },
  {
    id: "pause",
    kind: "pause",
    kindLabel: "Pause",
    title: 'Jeda ad set "Uji Penawaran-A"',
    summary: "CPA Rp 96.400 (di atas 1,5× target) dengan data cukup",
    reasons: [
      "CPA melewati ambang 1,5× target (Rp 90.000)",
      "Belanja Rp 480.000 tanpa hasil pada periode uji",
    ],
  },
  {
    id: "landing",
    kind: "landing_page",
    kindLabel: "Landing page",
    title: 'Landing page "Garansi 30 hari"',
    summary: "Angle bukti bahan · pra-cek lulus · kecocokan pesan 92%",
    reasons: ["Dasar klaim: 4 insight terkonfirmasi", "Ukuran 84 KB, satu berkas HTML mandiri"],
  },
  {
    id: "creative",
    kind: "creative_pack",
    kindLabel: "Creative",
    title: 'Paket creative "Angle Bukti Sosial"',
    summary: "3 varian copy dan 4 visual 4:5 & 9:16",
    reasons: ["Pra-cek kebijakan: risiko klaim rendah, skor hook 82", "Aset produk asli; AI hanya latar"],
  },
  {
    id: "product",
    kind: "product",
    kindLabel: "Produk",
    title: 'Pilih produk "Serum Vitamin C"',
    summary: "Skor kandidat 4,2/5 · rencana validasi Rp 500.000 selama 3 hari",
    reasons: ["Permintaan tinggi, persaingan sedang, margin 62%"],
  },
];

const ALERTS = [
  { id: "cpa", period: "today", tone: "danger" as Tone, icon: TrendingUp, title: "CPA melewati 1,5× target", time: "08.10 WIB", body: "Ad set Uji Penawaran-A · CPA Rp 96.400 (target Rp 60.000) · 3 hari berturut-turut" },
  { id: "tracking", period: "today", tone: "danger" as Tone, icon: PlugZap, title: "Tracking Pixel/CAPI bermasalah", time: "10.25 WIB", body: "Event Purchase tidak terkirim 2 jam terakhir · aturan scale dikunci sampai pulih" },
  { id: "freq", period: "today", tone: "warning" as Tone, icon: Repeat, title: "Frekuensi tinggi pada creative pemenang", time: "09.40 WIB", body: "Frekuensi 3,4 (ambang 3,0) · CTR turun 18% dibanding kemarin" },
  { id: "budget", period: "today", tone: "yellow" as Tone, icon: Gauge, title: "Belanja mendekati batas harian", time: "12.30 WIB", body: "Terpakai Rp 1.720.000 (86%) dari batas harian Rp 2.000.000" },
  { id: "winner", period: "today", tone: "success" as Tone, icon: Trophy, title: "Pemenang eksperimen siap ditetapkan", time: "11.05 WIB", body: 'Variabel angle · "bukti sosial" unggul 34% pada hasil' },
  { id: "token", period: "week", tone: "warning" as Tone, icon: PlugZap, title: "Token Meta kedaluwarsa dalam 6 hari", time: "2 hari lalu", body: "Izin ads_management perlu diperbarui" },
  { id: "report", period: "week", tone: "success" as Tone, icon: Activity, title: "Laporan mingguan terkirim", time: "Senin 07.00", body: "Angle terbaik minggu ini: bukti sosial · ROAS 3,9× · 148 hasil" },
];

const metricTone = (value: number): Trend => (value > 0 ? "up" : value < 0 ? "down" : "flat");

function niceMax(value: number) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / (magnitude / 2)) * (magnitude / 2);
}

export function HomeView() {
  const [period, setPeriod] = useState<PeriodKey>(7);
  const [metric, setMetric] = useState<MetricKey>("spend");
  const [kill, setKill] = useState(false);
  const [alertPeriod, setAlertPeriod] = useState<"today" | "week">("today");
  const [approvals, setApprovals] = useState(INITIAL_APPROVALS);
  const [activeBar, setActiveBar] = useState(0);

  const data = PERIODS[period];
  const totals = useMemo(() => {
    const spend = data.spend.reduce((a, b) => a + b, 0);
    const hasil = data.hasil.reduce((a, b) => a + b, 0);
    return {
      spend,
      hasil,
      cpa: hasil ? spend / hasil : 0,
      roas: spend ? (hasil * AOV) / spend : 0,
    };
  }, [data]);

  const values = data[metric];
  const max = niceMax(Math.max(...values, 1));
  const total = metric === "spend" ? totals.spend : totals.hasil;
  const totalDelta = data.delta[metric === "spend" ? "spend" : "hasil"];
  const activeValue = values[Math.min(activeBar, values.length - 1)];

  const stats = [
    { key: "spend", title: "Belanja Iklan", icon: Wallet, value: formatRupiahShort(totals.spend), delta: formatPercent(data.delta.spend), trend: metricTone(data.delta.spend), note: data.cmp },
    { key: "hasil", title: "Hasil", icon: Target, value: formatNumber(totals.hasil), delta: formatPercent(data.delta.hasil), trend: metricTone(data.delta.hasil), note: data.cmp },
    { key: "cpa", title: "Biaya per Hasil", icon: ReceiptText, value: formatRupiah(totals.cpa), delta: formatPercent(data.delta.cpa), trend: metricTone(-data.delta.cpa), note: totals.cpa <= TARGET.cpa ? "Di bawah target · aman" : "Di atas target · periksa aturan pause" },
    { key: "roas", title: "ROAS", icon: TrendingUp, value: `${formatDecimal(totals.roas)}×`, delta: formatPercent(data.delta.roas), trend: metricTone(data.delta.roas), note: totals.roas >= TARGET.roas ? "Di atas target · sehat" : "Di bawah target · tinjau creative" },
  ];

  function decide(item: ApprovalItem, approved: boolean) {
    setApprovals((list) => list.filter((entry) => entry.id !== item.id));
    notify(
      approved
        ? `Disetujui: ${item.title}. Aksi dicatat di action_log.`
        : `Ditolak: ${item.title}. Item dipindahkan ke riwayat keputusan.`,
    );
  }

  const visibleAlerts = ALERTS.filter((a) => alertPeriod === "week" || a.period === alertPeriod);

  return (
    <>
      <PageHeader
        title="Ringkasan"
        description="Performa iklan Meta per 7 Oktober 2026 · zona waktu WIB. Data contoh."
      >
        <label className="sr-only" htmlFor="home-period">
          Periode ringkasan
        </label>
        <Select
          id="home-period"
          className="w-auto"
          value={period}
          onChange={(event) => {
            setPeriod(Number(event.target.value) as PeriodKey);
            setActiveBar(0);
          }}
        >
          <option value={7}>7 hari terakhir</option>
          <option value={30}>30 hari terakhir</option>
          <option value={90}>90 hari terakhir</option>
        </Select>
      </PageHeader>

      {/* Control bar: loop status + kill switch */}
      <section
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3 transition-colors",
          kill && "border-danger/45 bg-danger/5",
        )}
        aria-labelledby="home-loop"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Activity className={cn("size-4", kill ? "text-danger" : "text-success")} aria-hidden />
          <div className="min-w-0">
            <b id="home-loop" className="text-sm font-medium">
              {kill ? "Semua aksi otomatis dihentikan" : "Loop harian berjalan"}
            </b>
            <small className="block text-xs text-muted">
              {kill
                ? "Aksi tulis otomatis dihentikan · workflow hanya membaca data"
                : "Sinkronisasi data iklan tiap 3 jam · terakhir 12 menit lalu (12.40 WIB)"}
            </small>
          </div>
        </div>
        <Button
          variant="danger"
          icon={OctagonX}
          aria-pressed={kill}
          onClick={() => {
            const next = !kill;
            setKill(next);
            notify(
              next
                ? "Semua aksi otomatis dihentikan. Persetujuan terkunci."
                : "Aksi otomatis diaktifkan kembali. Persetujuan dibuka.",
            );
          }}
          className={cn(!kill && "border-transparent bg-danger-ink text-white hover:bg-danger-ink")}
        >
          {kill ? "Aktifkan kembali" : "Hentikan semua aksi"}
        </Button>
      </section>

      {/* Metrics */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Metrik utama">
        {stats.map((stat) => (
          <Stat
            key={stat.key}
            icon={stat.icon}
            title={stat.title}
            value={stat.value}
            delta={stat.delta}
            trend={stat.trend}
            note={stat.note}
          />
        ))}
      </section>

      {/* Chart */}
      <Panel
        title="Hasil dan belanja harian"
        description={`${data.label} · per hari · ${metric === "spend" ? "Rupiah" : "jumlah hasil"}`}
        actions={
          <div className="inline-flex rounded-control border border-border bg-frame p-0.5" role="group" aria-label="Metrik grafik">
            {(["spend", "hasil"] as MetricKey[]).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={metric === key}
                onClick={() => {
                  setMetric(key);
                  setActiveBar(0);
                }}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  metric === key ? "bg-surface text-text shadow-sm" : "text-secondary",
                )}
              >
                {key === "spend" ? "Belanja" : "Hasil"}
              </button>
            ))}
          </div>
        }
      >
        <div className="mb-3 flex flex-wrap items-baseline gap-2.5">
          <strong className="text-chart font-medium leading-none tracking-[-0.8px] tabular-nums">
            {metric === "spend" ? formatRupiah(total) : `${formatNumber(total)} hasil`}
          </strong>
          <span className="text-xs text-muted">
            <b className={cn("mr-1.5 font-medium", totalDelta >= 0 ? "text-success-ink" : "text-danger-ink")}>
              {formatPercent(totalDelta)}
            </b>
            {data.cmp}
          </span>
        </div>

        <div className="relative mr-[60px]">
          <div
            className="relative h-[190px]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to top, var(--color-divider) 0 1px, transparent 1px 47px)",
            }}
          >
            <div className="absolute inset-0 flex items-end gap-1">
              {values.map((value, index) => (
                <button
                  key={`${metric}-${index}`}
                  type="button"
                  onMouseEnter={() => setActiveBar(index)}
                  onFocus={() => setActiveBar(index)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowRight") setActiveBar(Math.min(index + 1, values.length - 1));
                    if (event.key === "ArrowLeft") setActiveBar(Math.max(index - 1, 0));
                  }}
                  aria-pressed={activeBar === index}
                  aria-label={`${data.days[index]}: ${metric === "spend" ? formatRupiahShort(value) : formatNumber(value)}`}
                  className="flex h-full min-w-0 flex-1 items-end focus-visible:rounded-md"
                >
                  <span
                    className={cn(
                      "block w-full rounded-t-[5px] border border-surface/50 transition-colors",
                      activeBar === index
                        ? "bg-gradient-to-b from-accent-top to-accent"
                        : metric === "spend"
                          ? "bg-gradient-to-b from-info/55 to-info/20"
                          : "bg-gradient-to-b from-success/55 to-success/20",
                    )}
                    style={{ height: `${Math.max(2, Math.round((value / max) * 100))}%` }}
                  />
                </button>
              ))}
            </div>

            {/* Marker + tooltip */}
            <div
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted"
              style={{ top: `${Math.max(0, Math.min(96, 100 - (activeValue / max) * 100))}%` }}
            >
              <span className="absolute right-0 bottom-1.5 rounded-[5px] bg-accent px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-canvas">
                {data.days[Math.min(activeBar, values.length - 1)]}:{" "}
                {metric === "spend" ? formatRupiahShort(activeValue) : formatNumber(activeValue)}
              </span>
            </div>

            {/* Axis */}
            <div className="absolute inset-y-[-6px] left-full ml-2 flex w-max flex-col justify-between whitespace-nowrap text-[10px] text-muted tabular-nums">
              {[1, 0.75, 0.5, 0.25, 0].map((f) => (
                <span key={f}>{metric === "spend" ? formatRupiahShort(max * f) : formatNumber(max * f)}</span>
              ))}
            </div>
          </div>

          <div className="mt-2 flex justify-between gap-1 text-[10px] text-muted">
            {data.days.map((day) => (
              <span key={day} className="min-w-0 flex-1 truncate text-center">
                {day}
              </span>
            ))}
          </div>
        </div>

        <details className="mt-4">
          <summary className="text-xs text-secondary">Lihat data grafik</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <caption className="pb-1.5 text-left text-muted">
                Belanja, hasil, biaya per hasil, dan ROAS per hari
              </caption>
              <thead>
                <tr className="text-muted">
                  {["Hari", "Belanja", "Hasil", "Biaya/hasil", "ROAS"].map((h) => (
                    <th key={h} scope="col" className="border-b border-divider px-2 py-1.5 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.days.map((day, index) => {
                  const spend = data.spend[index];
                  const hasil = data.hasil[index];
                  const cpa = hasil ? spend / hasil : 0;
                  const roas = spend ? (hasil * AOV) / spend : 0;
                  return (
                    <tr key={day}>
                      <th scope="row" className="border-b border-divider px-2 py-1.5 text-left font-normal">
                        {day}
                      </th>
                      <td className="border-b border-divider px-2 py-1.5 tabular-nums">{formatRupiah(spend)}</td>
                      <td className="border-b border-divider px-2 py-1.5 tabular-nums">{formatNumber(hasil)}</td>
                      <td className="border-b border-divider px-2 py-1.5 tabular-nums">{cpa ? formatRupiah(cpa) : "—"}</td>
                      <td className="border-b border-divider px-2 py-1.5 tabular-nums">{roas ? `${formatDecimal(roas)}×` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      </Panel>

      {/* Approvals + Alerts */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Panel
          title="Menunggu persetujuan"
          description="Tidak ada aksi tulis ke akun iklan tanpa keputusan pemilik."
          actions={
            <span className="grid h-5 min-w-5 place-items-center rounded-full border border-border bg-frame px-1.5 text-[11px] font-semibold">
              {approvals.length}
            </span>
          }
        >
          {kill ? (
            <p className="mb-3 rounded-control bg-danger/8 px-2.5 py-2 text-[11px] text-danger-ink">
              Kill switch aktif. Persetujuan terkunci sampai aksi otomatis diaktifkan kembali.
            </p>
          ) : null}

          {approvals.length === 0 ? (
            <Empty icon={Check} title="Antrean approval kosong" message="Semua item sudah diputuskan." />
          ) : (
            <ul className="m-0 list-none p-0">
              {approvals.map((item) => (
                <li key={item.id} className="border-t border-divider py-3.5 first:border-t-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-border bg-frame px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.04em] uppercase text-secondary">
                      {item.kindLabel}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-medium">{item.title}</h3>
                  <p className="mt-1 text-xs text-muted">{item.summary}</p>
                  <ul className="mt-2.5 grid list-none gap-1 p-0">
                    {item.reasons.map((reason) => (
                      <li key={reason} className="flex gap-2 text-xs text-secondary">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden />
                        {reason}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="primary" onClick={() => decide(item, true)} disabled={kill}>
                      Setujui
                    </Button>
                    <Button onClick={() => decide(item, false)}>Tolak</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Peringatan aktif" description={`${visibleAlerts.length} peringatan ${alertPeriod === "today" ? "hari ini" : "7 hari terakhir"}`}>
          <div className="mb-3 flex gap-1.5" role="group" aria-label="Rentang peringatan">
            {(["today", "week"] as const).map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={alertPeriod === key}
                onClick={() => setAlertPeriod(key)}
                className={cn(
                  "h-7 rounded-full border border-border bg-surface px-3 text-[11px] font-medium text-secondary",
                  alertPeriod === key && "border-accent bg-accent text-canvas",
                )}
              >
                {key === "today" ? "Hari ini" : "7 hari"}
              </button>
            ))}
          </div>
          {visibleAlerts.length === 0 ? (
            <Empty icon={Check} title="Tidak ada peringatan" message="Tidak ada peringatan pada rentang ini." />
          ) : (
            <ul className="m-0 grid list-none gap-0 p-0">
              {visibleAlerts.map((alert) => {
                const Icon = alert.icon;
                return (
                  <li key={alert.id} className="flex gap-3 border-t border-divider py-3 first:border-t-0">
                    <span className="grid size-8 shrink-0 place-items-center rounded-control border border-border bg-surface">
                      <Icon className="size-4 text-secondary" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-xs font-medium">{alert.title}</h3>
                        <time className="shrink-0 text-[11px] text-muted">{alert.time}</time>
                      </div>
                      <p className="mt-1 text-[11px] text-muted">{alert.body}</p>
                      <Status label={alert.tone === "danger" ? "Penting" : alert.tone === "warning" ? "Perhatian" : "Info"} tone={alert.tone} className="mt-1.5" />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
