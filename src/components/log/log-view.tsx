"use client";

import { useMemo, useState } from "react";
import { Download, FileDiff, Filter, Workflow, TriangleAlert } from "lucide-react";
import {
  Button,
  Chip,
  Empty,
  Field,
  Input,
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

type Tab = "data" | "meta" | "jobs";

const DATA_ROWS = [
  { id: 1, time: "7 Okt 2026 12.40", user: "Pemilik", type: "approve", entity: "approvals / scale #A-1042", change: "status: pending → approved · Budget Rp 150.000 → Rp 180.000" },
  { id: 2, time: "7 Okt 2026 11.05", user: "Rani", type: "update", entity: "product_insights #I-207", change: "proof_status: needs_proof → verified · bukti label kemasan ditambahkan" },
  { id: 3, time: "7 Okt 2026 10.25", user: "Pemilik", type: "update", entity: "rules / pause", change: "params.threshold: 1.4 → 1.5" },
  { id: 4, time: "7 Okt 2026 08.10", user: "Sistem", type: "create", entity: "analyses #AN-88", change: "insert daily_report" },
  { id: 5, time: "6 Okt 2026 22.15", user: "Sistem", type: "kill", entity: "settings / kill_switch_active", change: "false → true lalu true → false (terjadwal)" },
];

const META_ROWS: Array<{ time: string; action: string; target: string; mode: string; key: string; status: string; tone: Tone }> = [
  { time: "7 Okt 2026 12.41", action: "set_budget", target: "ad_set Uji Bukti Sosial-B", mode: "manual_approved", key: "scale:8f2a…:2026-10-07", status: "Terkonfirmasi", tone: "success" },
  { time: "7 Okt 2026 10.30", action: "pause_ad", target: "ad_set Uji Penawaran-A", mode: "manual_approved", key: "pause:1c9b…:2026-10-07", status: "Terkonfirmasi", tone: "success" },
  { time: "7 Okt 2026 09.12", action: "create_ad", target: "campaign Serum Vitamin C", mode: "manual_approved", key: "create:44de…:2026-10-07", status: "PAUSED dibaca ulang", tone: "info" },
  { time: "6 Okt 2026 22.10", action: "set_budget", target: "ad_set Uji Kusam Siang-A", mode: "auto", key: "scale:77aa…:2026-10-06", status: "Gagal · dibatalkan kill switch", tone: "danger" },
];

const JOB_ROWS: Array<{ time: string; workflow: string; trigger: string; duration: string; skill: string; status: string; tone: Tone }> = [
  { time: "7 Okt 2026 12.28", workflow: "daily_loop", trigger: "cron", duration: "42 s", skill: "ads_analyst v3", status: "Berhasil", tone: "success" },
  { time: "7 Okt 2026 09.00", workflow: "creative_pack", trigger: "user", duration: "3 m 10 s", skill: "ad_copywriter v4", status: "Berhasil", tone: "success" },
  { time: "7 Okt 2026 06.00", workflow: "weekly_report", trigger: "cron", duration: "1 m 05 s", skill: "ads_analyst v3", status: "Berhasil", tone: "success" },
  { time: "6 Okt 2026 21.00", workflow: "sync_insights", trigger: "cron", duration: "2 m 40 s", skill: "—", status: "Diulang lalu berhasil", tone: "warning" },
];

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "data", label: "Perubahan data" },
  { key: "meta", label: "Aksi Meta" },
  { key: "jobs", label: "Eksekusi workflow" },
];

export function LogView() {
  const [tab, setTab] = useState<Tab>("data");
  const [user, setUser] = useState("all");
  const [type, setType] = useState("all");
  const [applied, setApplied] = useState({ user: "all", type: "all" });

  const dataRows = useMemo(
    () => DATA_ROWS.filter((r) => (applied.user === "all" || r.user === applied.user) && (applied.type === "all" || r.type === applied.type)),
    [applied],
  );

  const count = tab === "data" ? dataRows.length : tab === "meta" ? META_ROWS.length : JOB_ROWS.length;

  function exportCsv() {
    let rows: string[][] = [];
    if (tab === "data") {
      rows = [["Waktu", "Pelaku", "Jenis", "Entitas", "Perubahan"], ...dataRows.map((r) => [r.time, r.user, r.type, r.entity, r.change])];
    } else if (tab === "meta") {
      rows = [["Waktu", "Aksi", "Target", "Mode", "Idempotency key", "Status"], ...META_ROWS.map((r) => [r.time, r.action, r.target, r.mode, r.key, r.status])];
    } else {
      rows = [["Waktu", "Workflow", "Pemicu", "Durasi", "Versi skill", "Status"], ...JOB_ROWS.map((r) => [r.time, r.workflow, r.trigger, r.duration, r.skill, r.status])];
    }
    const csv = rows.map((r) => r.map((v) => `"${v.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `log-${tab}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Log diekspor ke CSV.");
  }

  return (
    <>
      <PageHeader
        title="Log Audit"
        description="Semua perubahan data dan aksi ke Meta tercatat dan dapat ditelusuri. Penghapusan bersifat soft delete. Data contoh."
      >
        <Button icon={Download} onClick={exportCsv}>
          Ekspor log
        </Button>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={FileDiff} title="Perubahan data" value="128" delta="7 hari" trend="flat" />
        <Stat icon={Workflow} title="Aksi Meta" value="23" delta="0 gagal" trend="up" />
        <Stat icon={Workflow} title="Eksekusi workflow" value="86" delta="1 diulang" trend="flat" />
        <Stat icon={TriangleAlert} title="Kegagalan" value="1" delta="ditangani otomatis" trend="down" />
      </section>

      <Panel title="Saring log" description="Sesuai pelaku, jenis, dan tanggal" icon={Filter}>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Pengguna" htmlFor="log-user" className="min-w-[160px]">
            <Select id="log-user" value={user} onChange={(e) => setUser(e.target.value)}>
              <option value="all">Semua</option>
              <option value="Pemilik">Pemilik</option>
              <option value="Rani">Rani</option>
              <option value="Sistem">Sistem</option>
            </Select>
          </Field>
          <Field label="Jenis" htmlFor="log-type" className="min-w-[160px]">
            <Select id="log-type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">Semua</option>
              <option value="create">create</option>
              <option value="update">update</option>
              <option value="approve">approve</option>
              <option value="kill">kill</option>
            </Select>
          </Field>
          <Field label="Dari" htmlFor="log-from" className="min-w-[160px]">
            <Input id="log-from" type="date" defaultValue="2026-10-01" />
          </Field>
          <Field label="Sampai" htmlFor="log-to" className="min-w-[160px]">
            <Input id="log-to" type="date" defaultValue="2026-10-07" />
          </Field>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setApplied({ user, type });
                notify("Log disaring.");
              }}
            >
              Terapkan
            </Button>
            <Button
              onClick={() => {
                setUser("all");
                setType("all");
                setApplied({ user: "all", type: "all" });
                notify("Filter log diatur ulang.");
              }}
            >
              Atur ulang
            </Button>
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Jenis log">
        {TABS.map((item) => (
          <Chip key={item.key} pressed={tab === item.key} onClick={() => setTab(item.key)}>
            {item.label}
          </Chip>
        ))}
        <span className="text-xs text-muted">{count} baris</span>
      </div>

      {tab === "data" ? (
        <Panel title="Perubahan data" description="Sebelum dan sesudah" icon={FileDiff}>
          {dataRows.length === 0 ? (
            <Empty icon={Filter} title="Tidak ada baris" message="Longgarkan filter." />
          ) : (
            <TableWrap>
              <Table>
                <caption className="sr-only">Perubahan data</caption>
                <thead>
                  <tr>
                    <Th>Waktu</Th>
                    <Th>Pelaku</Th>
                    <Th>Jenis</Th>
                    <Th>Entitas</Th>
                    <Th>Perubahan</Th>
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((r) => (
                    <tr key={r.id}>
                      <Td numeric>{r.time}</Td>
                      <Td>{r.user}</Td>
                      <Td>{r.type}</Td>
                      <Td className="whitespace-normal">{r.entity}</Td>
                      <Td className="min-w-[260px] whitespace-normal">{r.change}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </Panel>
      ) : null}

      {tab === "meta" ? (
        <Panel title="Aksi Meta" description="Dengan kunci idempotensi" icon={Workflow}>
          <TableWrap>
            <Table>
              <caption className="sr-only">Aksi ke Meta</caption>
              <thead>
                <tr>
                  <Th>Waktu</Th>
                  <Th>Aksi</Th>
                  <Th>Target</Th>
                  <Th>Mode</Th>
                  <Th>Idempotency key</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {META_ROWS.map((r) => (
                  <tr key={r.key}>
                    <Td numeric>{r.time}</Td>
                    <Td>{r.action}</Td>
                    <Td className="whitespace-normal">{r.target}</Td>
                    <Td>{r.mode}</Td>
                    <Td className="font-mono text-[11px] text-muted">{r.key}</Td>
                    <Td><Status label={r.status} tone={r.tone} /></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Panel>
      ) : null}

      {tab === "jobs" ? (
        <Panel title="Eksekusi workflow" description="Termasuk versi skill yang dipakai" icon={Workflow}>
          <TableWrap>
            <Table>
              <caption className="sr-only">Eksekusi workflow</caption>
              <thead>
                <tr>
                  <Th>Waktu</Th>
                  <Th>Workflow</Th>
                  <Th>Pemicu</Th>
                  <Th>Durasi</Th>
                  <Th>Versi skill</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {JOB_ROWS.map((r) => (
                  <tr key={`${r.workflow}-${r.time}`}>
                    <Td numeric>{r.time}</Td>
                    <Td>{r.workflow}</Td>
                    <Td>{r.trigger}</Td>
                    <Td numeric>{r.duration}</Td>
                    <Td>{r.skill}</Td>
                    <Td><Status label={r.status} tone={r.tone} /></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Panel>
      ) : null}
    </>
  );
}
