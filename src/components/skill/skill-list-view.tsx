"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Brain, CircleCheck, FlaskConical, Pencil, Plus, Search } from "lucide-react";
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

type Skill = {
  key: string;
  name: string;
  stage: string;
  model: "Utama" | "Ringan";
  version: number;
  status: "active" | "draft";
  statusLabel: string;
  statusTone: Tone;
  updated: string;
};

const SKILLS: Skill[] = [
  { key: "market_researcher", name: "Riset Pasar", stage: "Riset & market brief", model: "Utama", version: 4, status: "active", statusLabel: "Aktif", statusTone: "success", updated: "6 Okt 2026" },
  { key: "product_analyst", name: "Analisa Insight Produk", stage: "Brief manual → kekuatan & pain point", model: "Utama", version: 3, status: "active", statusLabel: "Aktif", statusTone: "success", updated: "6 Okt 2026" },
  { key: "audience_analyst", name: "Riset Audiens", stage: "Persona & bank hook", model: "Utama", version: 2, status: "active", statusLabel: "Aktif", statusTone: "success", updated: "5 Okt 2026" },
  { key: "landing_page_builder", name: "Pembuat Landing Page", stage: "Landing page HTML", model: "Utama", version: 5, status: "active", statusLabel: "Aktif", statusTone: "success", updated: "7 Okt 2026" },
  { key: "ad_copywriter", name: "Penulis Copy Iklan", stage: "Paket creative", model: "Utama", version: 4, status: "active", statusLabel: "Aktif", statusTone: "success", updated: "7 Okt 2026" },
  { key: "creative_director", name: "Arahan Visual & Video", stage: "Konsep visual dan video", model: "Utama", version: 2, status: "active", statusLabel: "Aktif", statusTone: "success", updated: "4 Okt 2026" },
  { key: "ads_analyst", name: "Analis Iklan", stage: "Laporan harian & mingguan", model: "Utama", version: 3, status: "active", statusLabel: "Aktif", statusTone: "success", updated: "7 Okt 2026" },
  { key: "competitor_analyst", name: "Analis Kompetitor", stage: "Peta pasar & celah", model: "Ringan", version: 1, status: "draft", statusLabel: "Draf", statusTone: "warning", updated: "3 Okt 2026" },
  { key: "creative_reviser", name: "Revisi dari Komentar", stage: "Revisi landing page & creative", model: "Utama", version: 2, status: "draft", statusLabel: "Draf", statusTone: "warning", updated: "2 Okt 2026" },
];

export function SkillListView() {
  const [filter, setFilter] = useState<"all" | "active" | "draft">("all");
  const rows = useMemo(() => SKILLS.filter((s) => filter === "all" || s.status === filter), [filter]);

  return (
    <>
      <PageHeader
        title="Skill Agent"
        description="Isi skill dikelola di sini dan dijalankan lewat n8n. Skill tidak dapat mengubah batas keras, kill switch, atau aturan scale. Data contoh."
      >
        <Button variant="primary" icon={Plus} onClick={() => notify("Skill baru dimulai dari templat bawaan.")}>
          Skill baru
        </Button>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Brain} title="Total skill" value="9" delta="9 tahap" trend="flat" />
        <Stat icon={CircleCheck} title="Aktif" value="7" delta="dipakai workflow" trend="up" />
        <Stat icon={Pencil} title="Draf" value="2" delta="menunggu uji" trend="flat" />
        <Stat icon={FlaskConical} title="Baru diuji" value="3" delta="7 hari terakhir" trend="flat" />
      </section>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter status skill">
        {(["all", "active", "draft"] as const).map((key) => (
          <Chip key={key} pressed={filter === key} onClick={() => setFilter(key)}>
            {key === "all" ? "Semua" : key === "active" ? "Aktif" : "Draf"}
          </Chip>
        ))}
        <span className="text-xs text-muted">{rows.length} skill</span>
      </div>

      <Panel title="Daftar skill" description="Hanya pemilik dapat mengaktifkan versi" icon={Brain}>
        {rows.length === 0 ? (
          <Empty icon={Search} title="Tidak ada skill pada filter ini" message="Pilih filter lain." />
        ) : (
          <TableWrap>
            <Table>
              <caption className="sr-only">Daftar skill agent</caption>
              <thead>
                <tr>
                  <Th>Skill</Th>
                  <Th>Tahap yang memakai</Th>
                  <Th>Model</Th>
                  <Th>Versi aktif</Th>
                  <Th>Status</Th>
                  <Th>Diperbarui</Th>
                  <Th>
                    <span className="sr-only">Aksi</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((skill) => (
                  <tr key={skill.key}>
                    <Td className="whitespace-normal">
                      <span className="block font-mono text-[11px] text-muted">{skill.key}</span>
                      <b className="font-medium">{skill.name}</b>
                    </Td>
                    <Td className="whitespace-normal text-secondary">{skill.stage}</Td>
                    <Td>{skill.model}</Td>
                    <Td>v{skill.version}</Td>
                    <Td><Status label={skill.statusLabel} tone={skill.statusTone} /></Td>
                    <Td>{skill.updated}</Td>
                    <Td>
                      <Link className={btnClass("default")} href={`/skill/${skill.key}`}>
                        Buka editor
                      </Link>
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
