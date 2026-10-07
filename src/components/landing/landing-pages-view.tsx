"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeCheck, Download, FileCode2, Files, Plus, RefreshCw, Search } from "lucide-react";
import {
  Button,
  Chip,
  Empty,
  PageHeader,
  Panel,
  Stat,
  Status,
  Table,
  TableWrap,
  Td,
  Th,
  btnClass,
  notify,
  type Tone,
} from "@/components/ui";

type Row = {
  id: string;
  title: string;
  product: string;
  angle: string;
  version: number;
  status: "draft" | "approved" | "deployed" | "stale";
  statusLabel: string;
  statusTone: Tone;
  precheck: Array<{ label: string; tone: Tone }>;
  sizeKb: number;
  updated: string;
};

const ROWS: Row[] = [
  { id: "garansi-30-hari", title: "Garansi 30 hari", product: "Serum Vitamin C", angle: "Bukti bahan", version: 3, status: "approved", statusLabel: "Disetujui", statusTone: "success", precheck: [{ label: "Kecocokan 92%", tone: "success" }, { label: "Risiko rendah", tone: "success" }], sizeKb: 84, updated: "7 Okt 2026" },
  { id: "kusam-siang-hari", title: "Kusam siang hari", product: "Serum Vitamin C", angle: "Kusam siang", version: 2, status: "stale", statusLabel: "Perlu diperbarui", statusTone: "warning", precheck: [{ label: "Kecocokan 81%", tone: "warning" }, { label: "Risiko sedang", tone: "warning" }], sizeKb: 79, updated: "6 Okt 2026" },
  { id: "bukti-bahan-live", title: "Bukti bahan (live)", product: "Dipasang di domain sendiri", angle: "Bukti bahan", version: 1, status: "deployed", statusLabel: "Dipasang", statusTone: "info", precheck: [{ label: "Tracking sehat", tone: "success" }, { label: "Risiko rendah", tone: "success" }], sizeKb: 86, updated: "4 Okt 2026" },
  { id: "hemat-sebulan", title: "Hemat sebulan", product: "Serum Vitamin C", angle: "Hemat", version: 1, status: "draft", statusLabel: "Draf", statusTone: "info", precheck: [{ label: "Kecocokan 74%", tone: "warning" }, { label: "Risiko rendah", tone: "success" }], sizeKb: 72, updated: "5 Okt 2026" },
  { id: "mahasiswa-hemat", title: "Mahasiswa hemat", product: "Serum Vitamin C", angle: "Hemat", version: 1, status: "draft", statusLabel: "Draf", statusTone: "info", precheck: [{ label: "Kecocokan 70%", tone: "warning" }, { label: "Risiko rendah", tone: "success" }], sizeKb: 68, updated: "3 Okt 2026" },
  { id: "garansi-30-hari-v2", title: "Garansi 30 hari", product: "Versi sebelumnya", angle: "Bukti bahan", version: 2, status: "approved", statusLabel: "Disetujui", statusTone: "success", precheck: [{ label: "Kecocokan 88%", tone: "success" }, { label: "Risiko rendah", tone: "success" }], sizeKb: 81, updated: "1 Okt 2026" },
];

function downloadHtml(title: string) {
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head><body><main style="font-family:Arial,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;color:#1f2937"><h1 style="letter-spacing:-.8px">${title}</h1><p>Contoh berkas HTML mandiri. Ganti isi ini dengan hasil sebenarnya.</p><p><a href="#" style="display:inline-block;background:#1f2937;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Pesan sekarang</a></p></main></body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.html`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const FILTERS: Array<{ key: Row["status"] | "all"; label: string }> = [
  { key: "all", label: "Semua" },
  { key: "draft", label: "Draf" },
  { key: "approved", label: "Disetujui" },
  { key: "deployed", label: "Dipasang" },
  { key: "stale", label: "Perlu diperbarui" },
];

export function LandingPagesView() {
  const [filter, setFilter] = useState<Row["status"] | "all">("all");
  const rows = useMemo(() => ROWS.filter((row) => filter === "all" || row.status === filter), [filter]);

  return (
    <>
      <PageHeader
        title="Landing Page"
        description="Satu file HTML mandiri per angle. Setiap revisi membuat versi baru, bukan menimpa. Data contoh."
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => notify("Halaman baru dibuat dari insight terkonfirmasi dan angle terpilih.")}
        >
          Buat halaman baru
        </Button>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={FileCode2} title="Total versi" value="6" delta="4 angle" trend="flat" />
        <Stat icon={BadgeCheck} title="Disetujui" value="3" delta="siap dipasang" trend="up" />
        <Stat icon={RefreshCw} title="Perlu diperbarui" value="1" delta="brief berubah" trend="down" />
        <Stat icon={Download} title="Unduhan" value="12" delta="30 hari" trend="flat" />
      </section>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter status">
        {FILTERS.map((item) => (
          <Chip key={item.key} pressed={filter === item.key} onClick={() => setFilter(item.key)}>
            {item.label}
          </Chip>
        ))}
        <span className="text-xs text-muted">{rows.length} halaman</span>
      </div>

      <Panel title="Daftar halaman dan versi" description="Pra-cek berupa peringatan, bukan jaminan lolos tinjauan Meta" icon={Files}>
        {rows.length === 0 ? (
          <Empty icon={Search} title="Tidak ada halaman pada filter ini" message="Pilih filter lain untuk melihat halaman lainnya." />
        ) : (
          <TableWrap>
            <Table>
              <caption className="sr-only">Daftar landing page</caption>
              <thead>
                <tr>
                  <Th>Halaman</Th>
                  <Th>Angle</Th>
                  <Th>Versi</Th>
                  <Th>Status</Th>
                  <Th>Pra-cek</Th>
                  <Th>Ukuran</Th>
                  <Th>Diperbarui</Th>
                  <Th>
                    <span className="sr-only">Aksi</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <Td className="whitespace-normal">
                      <b className="block font-medium">{row.title}</b>
                      <span className="block text-xs text-muted">{row.product}</span>
                    </Td>
                    <Td>{row.angle}</Td>
                    <Td>v{row.version}</Td>
                    <Td><Status label={row.statusLabel} tone={row.statusTone} /></Td>
                    <Td>
                      <span className="flex flex-wrap items-center gap-2">
                        {row.precheck.map((p) => (
                          <Status key={p.label} label={p.label} tone={p.tone} />
                        ))}
                      </span>
                    </Td>
                    <Td numeric>{row.sizeKb} KB</Td>
                    <Td>{row.updated}</Td>
                    <Td>
                      <span className="flex flex-wrap items-center gap-2">
                        <Link className={btnClass("default")} href={`/landing-page/${row.id}`}>
                          Pratinjau
                        </Link>
                        <Button
                          onClick={() => {
                            downloadHtml(row.title);
                            notify(`Berkas "${row.title}.html" diunduh. Pasang di hosting sendiri dan isi Pixel ID.`);
                          }}
                        >
                          Unduh
                        </Button>
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}
