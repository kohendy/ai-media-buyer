"use client";

import { useState } from "react";
import { Download, FileText, PenLine, Table2, Target, TrendingUp, Wallet, GitBranch, Images } from "lucide-react";
import {
  Button,
  PageHeader,
  Panel,
  Select,
  Stat,
  Status,
  Table,
  TableWrap,
  Td,
  Th,
  notify,
  type Tone,
} from "@/components/ui";

type Period = "daily" | "weekly" | "monthly";

const FIXTURES: Record<Period, { stats: string[]; label: string }> = {
  daily: { stats: ["Rp 13,7 jt", "255", "Rp 53.725", "3,26×"], label: "Harian · 7 Okt 2026" },
  weekly: { stats: ["Rp 92,4 jt", "1.712", "Rp 53.972", "3,24×"], label: "Mingguan · 1–7 Okt 2026" },
  monthly: { stats: ["Rp 386,2 jt", "7.180", "Rp 53.788", "3,25×"], label: "Bulanan · Okt 2026" },
};

const ANGLES = [
  { name: "Bukti bahan (A1)", spend: "Rp 6,31 jt", results: 117, cpa: "Rp 53.932", roas: "3,9×", trend: "Naik", tone: "success" as Tone },
  { name: "Kusam siang (A2)", spend: "Rp 4,12 jt", results: 74, cpa: "Rp 55.676", roas: "3,1×", trend: "Datar", tone: "warning" as Tone },
  { name: "Hemat (A3)", spend: "Rp 3,27 jt", results: 64, cpa: "Rp 51.094", roas: "3,0×", trend: "Datar", tone: "warning" as Tone },
];

const CREATIVES = [
  { name: "Bukti Video v1", ctr: "2,1%", cpa: "Rp 48.000", status: "Dipakai", tone: "info" as Tone },
  { name: "Bukti Hook1 v1", ctr: "1,8%", cpa: "Rp 52.000", status: "Disetujui", tone: "success" as Tone },
  { name: "Kusam Hook3 v1", ctr: "1,5%", cpa: "Rp 61.000", status: "Diuji", tone: "warning" as Tone },
  { name: "Bukti Hook4 v1", ctr: "0,9%", cpa: "Rp 88.000", status: "Jenuh", tone: "danger" as Tone },
];

function exportCsv() {
  const rows = [
    ["Angle", "Belanja", "Hasil", "CPA", "ROAS"],
    ...ANGLES.map((a) => [a.name, a.spend, String(a.results), a.cpa, a.roas]),
  ];
  const csv = rows.map((r) => r.map((v) => `"${v.replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "laporan-per-angle.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify("Laporan per angle diekspor ke CSV.");
}

export function LaporanView() {
  const [period, setPeriod] = useState<Period>("daily");
  const fixture = FIXTURES[period];

  return (
    <>
      <PageHeader
        title="Laporan"
        description="Angka dihitung oleh kode, ulasan dan hipotesis ditulis Claude. Fakta dan dugaan dibedakan. Data contoh."
      >
        <Status label={fixture.label} tone="info" />
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          aria-label="Periode laporan"
          className="w-auto"
        >
          <option value="daily">Harian</option>
          <option value="weekly">Mingguan</option>
          <option value="monthly">Bulanan</option>
        </Select>
        <Button icon={Table2} onClick={exportCsv}>
          Ekspor Excel
        </Button>
        <Button
          icon={FileText}
          onClick={() => {
            notify("Menyiapkan PDF. Dialog cetak dibuka.");
            window.print();
          }}
        >
          Ekspor PDF
        </Button>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Wallet} title="Belanja periode" value={fixture.stats[0]} delta="vs periode sebelumnya −4,2%" trend="up" />
        <Stat icon={Target} title="Hasil" value={fixture.stats[1]} delta="+6,4%" trend="up" />
        <Stat icon={FileText} title="CPA" value={fixture.stats[2]} delta="target Rp 60.000" trend="up" />
        <Stat icon={TrendingUp} title="ROAS" value={fixture.stats[3]} delta="target 3,0×" trend="up" />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          <Panel title="Ulasan periode" description="Ditulis Claude dari angka yang sudah dihitung kode" icon={PenLine}>
            <div className="grid gap-1.5 text-sm leading-relaxed text-secondary">
              <h4 className="m-0 text-xs font-semibold uppercase tracking-[0.04em] text-muted">Fakta</h4>
              <ul className="m-0 grid list-none gap-1 p-0">
                <li className="flex gap-2">
                  <Tag label="Fakta" tone="success" />
                  <span>Belanja turun 4,2% sementara hasil naik 6,4%; CPA membaik menjadi <strong className="text-text">Rp 53.725</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <Tag label="Fakta" tone="success" />
                  <span>Angle <strong className="text-text">Bukti bahan</strong> menyumbang 46% hasil dengan ROAS 3,9×.</span>
                </li>
                <li className="flex gap-2">
                  <Tag label="Fakta" tone="success" />
                  <span>Creative video 9:16 punya CTR tertinggi (2,1%).</span>
                </li>
              </ul>
              <h4 className="mt-2 m-0 text-xs font-semibold uppercase tracking-[0.04em] text-muted">Dugaan dan hipotesis</h4>
              <ul className="m-0 grid list-none gap-1 p-0">
                <li className="flex gap-2">
                  <Tag label="Dugaan" tone="warning" />
                  <span>Peningkatan hasil kemungkinan dari pesan bukti bahan yang cocok dengan landing page.</span>
                </li>
                <li className="flex gap-2">
                  <Tag label="Dugaan" tone="warning" />
                  <span>Frekuensi Uji Penawaran-A yang naik menandakan audiens mulai jenuh; perlu diuji varian baru.</span>
                </li>
              </ul>
            </div>
          </Panel>

          <Panel title="Performa per angle" description="Digabungkan lintas creative" icon={GitBranch}>
            <TableWrap>
              <Table>
                <caption className="sr-only">Performa per angle</caption>
                <thead>
                  <tr>
                    <Th>Angle</Th>
                    <Th>Belanja</Th>
                    <Th>Hasil</Th>
                    <Th>CPA</Th>
                    <Th>ROAS</Th>
                    <Th>Tren</Th>
                  </tr>
                </thead>
                <tbody>
                  {ANGLES.map((a) => (
                    <tr key={a.name}>
                      <Td className="whitespace-normal">{a.name}</Td>
                      <Td numeric>{a.spend}</Td>
                      <Td numeric>{a.results}</Td>
                      <Td numeric>{a.cpa}</Td>
                      <Td numeric>{a.roas}</Td>
                      <Td><Status label={a.trend} tone={a.tone} /></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Panel>
        </div>

        <div className="grid gap-4">
          <Panel title="Performa per creative" icon={Images}>
            <TableWrap>
              <Table>
                <caption className="sr-only">Performa per creative</caption>
                <thead>
                  <tr>
                    <Th>Creative</Th>
                    <Th>CTR</Th>
                    <Th>CPA</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {CREATIVES.map((c) => (
                    <tr key={c.name}>
                      <Td>{c.name}</Td>
                      <Td numeric>{c.ctr}</Td>
                      <Td numeric>{c.cpa}</Td>
                      <Td><Status label={c.status} tone={c.tone} /></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Panel>

          <Panel title="Ekspor" description="Excel dan PDF berisi angka periode ini" icon={Download}>
            <p className="m-0 text-xs text-muted">
              Ekspor Excel menghasilkan berkas CSV; ekspor PDF membuka dialog cetak peramban.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button icon={Table2} onClick={exportCsv}>
                Excel
              </Button>
              <Button icon={FileText} onClick={() => window.print()}>
                PDF
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Tag({ label, tone }: { label: string; tone: Tone }) {
  const styles: Record<string, string> = {
    success: "bg-success/14 text-success-ink",
    warning: "bg-warning/16 text-warning-ink",
  };
  return (
    <span className={`inline-block h-fit rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] ${styles[tone] ?? "bg-frame text-secondary"}`}>
      {label}
    </span>
  );
}
