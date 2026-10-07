"use client";

import { useMemo, useState } from "react";
import { Activity, ClipboardCheck, Gauge, Images, Layers, Megaphone, Plus, RefreshCw, ShieldAlert, OctagonX } from "lucide-react";
import {
  Button,
  Chip,
  DetailList,
  Empty,
  Modal,
  PageHeader,
  Panel,
  Stat,
  Status,
  Table,
  TableWrap,
  Td,
  Th,
  notify,
  type Tone,
} from "@/components/ui";

type AdRow = {
  id: string;
  level: "campaign" | "adset";
  name: string;
  variable: string;
  status: "Aktif" | "Dijeda";
  meta: string;
  budget: string;
  spend: string;
  results: number;
  cpa: string;
  roas: string;
};

const INITIAL_ROWS: AdRow[] = [
  { id: "camp", level: "campaign", name: "Serum Vitamin C — Konversi", variable: "Konversi pembelian", status: "Aktif", meta: "ACTIVE", budget: "—", spend: "Rp 4,80 jt", results: 96, cpa: "Rp 50.000", roas: "3,4×" },
  { id: "a1", level: "adset", name: "Uji Bukti Sosial-A", variable: "Angle · bukti bahan", status: "Aktif", meta: "ACTIVE", budget: "Rp 180.000", spend: "Rp 1,42 jt", results: 32, cpa: "Rp 44.375", roas: "3,9×" },
  { id: "a2", level: "adset", name: "Uji Bukti Sosial-B", variable: "Angle · bukti bahan", status: "Aktif", meta: "ACTIVE", budget: "Rp 150.000", spend: "Rp 1,18 jt", results: 26, cpa: "Rp 45.385", roas: "3,9×" },
  { id: "a3", level: "adset", name: "Uji Kusam Siang-A", variable: "Angle · kusam siang", status: "Dijeda", meta: "PAUSED", budget: "Rp 120.000", spend: "Rp 860 rb", results: 14, cpa: "Rp 61.428", roas: "2,8×" },
  { id: "a4", level: "adset", name: "Uji Penawaran-A", variable: "Penawaran · gratis ongkir", status: "Aktif", meta: "ACTIVE", budget: "Rp 96.000", spend: "Rp 480 rb", results: 5, cpa: "Rp 96.000", roas: "1,8×" },
];

const PRECHECK = [
  { id: "pixel", icon: Activity, title: "Pixel dan CAPI", body: "Event Purchase terkirim · terakhir diperiksa 12.30 WIB", label: "Sehat", tone: "success" as Tone },
  { id: "url", icon: RefreshCw, title: "Domain, URL landing page, dan UTM", body: "serum-vitamin-c.id · UTM seragam dengan penamaan iklan", label: "Sesuai", tone: "success" as Tone },
  { id: "budget", icon: Gauge, title: "Anggaran dan batas keras", body: "Budget harian dan kenaikan maksimum dalam batas", label: "Dalam batas", tone: "success" as Tone },
  { id: "policy", icon: ShieldAlert, title: "Pra-cek kebijakan iklan", body: "3 iklan punya klaim berisiko sedang; perlu ditinjau", label: "Perlu ditinjau", tone: "warning" as Tone },
  { id: "kill", icon: OctagonX, title: "Kill switch", body: "Aksi tulis otomatis diizinkan", label: "Tidak aktif", tone: "success" as Tone },
];

export function KampanyeView() {
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [filter, setFilter] = useState<"all" | "Aktif" | "Dijeda">("all");
  const [detail, setDetail] = useState<AdRow | null>(null);

  const visible = useMemo(
    () => rows.filter((row) => row.level === "campaign" || filter === "all" || row.status === filter),
    [rows, filter],
  );

  function toggle(id: string) {
    const row = rows.find((entry) => entry.id === id);
    if (!row) return;
    const pausing = row.status === "Aktif";
    setRows((list) =>
      list.map((entry) =>
        entry.id === id
          ? { ...entry, status: pausing ? "Dijeda" : "Aktif", meta: pausing ? "PAUSED" : "ACTIVE" }
          : entry,
      ),
    );
    notify(`${pausing ? "Dijeda" : "Diaktifkan"} di Meta. Status dibaca kembali dan dicatat di action_log.`);
  }

  return (
    <>
      <PageHeader
        title="Kampanye"
        description="Kampanye, ad set, dan iklan beserta status di Meta dan status internal. Dibuat PAUSED lalu diaktifkan setelah approval. Data contoh."
      >
        <Button icon={RefreshCw} onClick={() => notify("Status dimuat ulang dari Meta. 0 perubahan.")}>
          Muat status dari Meta
        </Button>
        <Button variant="primary" icon={Plus} onClick={() => notify("Kampanye baru disiapkan berstatus PAUSED dan menunggu approval.")}>
          Kampanye baru
        </Button>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Megaphone} title="Kampanye" value="1" delta="1 berjalan" trend="flat" />
        <Stat icon={Layers} title="Ad set" value="4" delta="3 aktif · 1 dijeda" trend="flat" />
        <Stat icon={Images} title="Iklan" value="9" delta="2-3 per ad set" trend="flat" />
        <Stat icon={Gauge} title="Belanja hari ini" value="Rp 1,72 jt" delta="86% dari batas Rp 2 jt" trend="down" />
      </section>

      <Panel title="Pemeriksaan pra-peluncuran" description="Diperiksa sebelum peluncuran dan berkala" icon={ClipboardCheck}>
        <ul className="m-0 list-none p-0">
          {PRECHECK.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="flex flex-wrap items-center gap-2.5 border-t border-divider py-2.5 first:border-t-0">
                <Icon className="size-4 shrink-0 text-secondary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <b className="block text-sm font-medium">{item.title}</b>
                  <p className="mt-0.5 text-xs text-muted">{item.body}</p>
                </div>
                <Status label={item.label} tone={item.tone} className="ml-auto" />
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter status">
        {(["all", "Aktif", "Dijeda"] as const).map((key) => (
          <Chip key={key} pressed={filter === key} onClick={() => setFilter(key)}>
            {key === "all" ? "Semua" : key}
          </Chip>
        ))}
        <span className="text-xs text-muted">{visible.length} baris</span>
      </div>

      <Panel title="Struktur kampanye" description="Status Meta dibaca kembali setelah setiap aksi" icon={Layers}>
        {visible.length === 0 ? (
          <Empty icon={Layers} title="Tidak ada baris pada filter ini" message="Pilih filter lain." />
        ) : (
          <TableWrap>
            <Table>
              <caption className="sr-only">Kampanye, ad set, dan metrik utamanya</caption>
              <thead>
                <tr>
                  <Th>Objek</Th>
                  <Th>Variabel</Th>
                  <Th>Status internal · Meta</Th>
                  <Th>Budget</Th>
                  <Th>Belanja</Th>
                  <Th>Hasil</Th>
                  <Th>CPA · ROAS</Th>
                  <Th>
                    <span className="sr-only">Aksi</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id} className={row.level === "campaign" ? "bg-frame" : undefined}>
                    <Td className={row.level === "adset" ? "whitespace-normal pl-8 text-secondary" : "whitespace-normal"}>
                      {row.level === "campaign" ? (
                        <span className="flex items-center gap-2">
                          <Megaphone className="size-4 text-muted" aria-hidden />
                          <b className="font-semibold">{row.name}</b>
                        </span>
                      ) : (
                        row.name
                      )}
                    </Td>
                    <Td>{row.variable}</Td>
                    <Td>
                      <span className="flex items-center gap-2.5">
                        <Status label={row.status} tone={row.status === "Aktif" ? "success" : "warning"} />
                        <Status label={row.meta} tone={row.status === "Aktif" ? "success" : "warning"} />
                      </span>
                    </Td>
                    <Td numeric>{row.budget}</Td>
                    <Td numeric>{row.spend}</Td>
                    <Td numeric>{row.results}</Td>
                    <Td numeric>
                      {row.cpa} · {row.roas}
                    </Td>
                    <Td>
                      {row.level === "campaign" ? (
                        <Button onClick={() => setDetail(row)}>Detail</Button>
                      ) : (
                        <Button variant={row.status === "Dijeda" ? "primary" : "default"} onClick={() => toggle(row.id)}>
                          {row.status === "Aktif" ? "Jeda" : "Aktifkan"}
                        </Button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Panel>

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.name ?? "Detail"}
        description="Status internal dan status efektif dari Meta"
        footer={<Button onClick={() => setDetail(null)}>Tutup</Button>}
      >
        {detail ? (
          <DetailList
            items={[
              { term: "Jenis", value: detail.level === "campaign" ? "Kampanye" : "Ad set" },
              { term: "Tujuan / variabel", value: detail.variable },
              { term: "Status internal", value: detail.status },
              { term: "Status Meta", value: detail.meta },
            ]}
          />
        ) : null}
      </Modal>
    </>
  );
}
