"use client";

import { useMemo, useState } from "react";
import { Lightbulb, Plus, Radar, Repeat, Search, Store, TriangleAlert } from "lucide-react";
import {
  Button,
  Chip,
  DetailList,
  Empty,
  Modal,
  PageHeader,
  Panel,
  Stat,
  Table,
  TableWrap,
  Td,
  Th,
  notify,
} from "@/components/ui";

type Competitor = {
  id: string;
  brand: string;
  initials: string;
  source: "manual" | "provider";
  angle: string;
  hook: string;
  offer: string;
  days: number;
  variants: number;
  checked: string;
};

const COMPETITORS: Competitor[] = [
  { id: "glowlab", brand: "Glowlab", initials: "GL", source: "manual", angle: "Bukti dermatolog", hook: "dijamin dokter", offer: "Bundling 2 botol", days: 84, variants: 6, checked: "5 Okt 2026" },
  { id: "skin-plus", brand: "Skin+", initials: "S+", source: "manual", angle: "Harga termurah", hook: "paling murah", offer: "Gratis ongkir", days: 41, variants: 3, checked: "5 Okt 2026" },
  { id: "dermaclear", brand: "Dermaclear", initials: "DC", source: "manual", angle: "Sebelum–sesudah", hook: "hasil 7 hari", offer: "Garansi 30 hari", days: 27, variants: 4, checked: "4 Okt 2026" },
  { id: "natur", brand: "Naturé", initials: "NT", source: "provider", angle: "Bahan alami", hook: "100% alami", offer: "Cashback", days: 19, variants: 2, checked: "3 Okt 2026" },
];

const GAPS = [
  { kind: "full" as const, title: "Jenuh: klaim sebelum–sesudah", body: "Dipakai Dermaclear dan Glowlab; berisiko ditolak Meta bila berlebihan.", action: "Catat sebagai risiko" },
  { kind: "empty" as const, title: "Kosong: bukti bahan", body: "Belum ada yang menjelaskan kandungan dengan visual produk asli.", action: "Buat brief angle baru" },
  { kind: "empty" as const, title: "Kosong: testimoni kulit berminyak", body: "Testimoni asli berbahasa Indonesia untuk tipe kulit berminyak belum dipakai.", action: "Buat brief angle baru" },
  { kind: "empty" as const, title: "Kosong: rutinitas pagi", body: 'Sudut "cara pakai pagi" belum digarap kompetitor.', action: "Buat brief angle baru" },
];

export function CompetitorView() {
  const [source, setSource] = useState<"all" | "manual" | "provider">("all");
  const [selected, setSelected] = useState<Competitor | null>(null);

  const rows = useMemo(
    () => COMPETITORS.filter((c) => source === "all" || c.source === source),
    [source],
  );

  return (
    <>
      <PageHeader
        title="Kompetitor"
        description="Snapshot iklan kompetitor dari masukan semi-manual. Hanya data publik; lama tayang adalah perkiraan. Data contoh."
      >
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => notify("Masukkan nama brand, kata kunci, URL Ad Library, atau tangkapan iklan.")}
        >
          Tambah kompetitor
        </Button>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Radar} title="Kompetitor dipantau" value="4" delta="1 dari provider" trend="flat" />
        <Stat icon={Store} title="Iklan aktif (perkiraan)" value="18" delta="snapshot 5 Okt" trend="up" />
        <Stat icon={Repeat} title="Angle jenuh" value="3" delta="banyak dipakai" trend="down" />
        <Stat icon={Lightbulb} title="Celah ditemukan" value="4" delta="usulan angle baru" trend="up" />
      </section>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter sumber">
        {(["all", "manual", "provider"] as const).map((key) => (
          <Chip key={key} pressed={source === key} onClick={() => setSource(key)}>
            {key === "all" ? "Semua" : key === "manual" ? "Masukan manual" : "Provider pihak ketiga"}
          </Chip>
        ))}
      </div>

      <Panel
        title="Kompetitor dipantau"
        description="Label angle, hook, dan penawaran dari penilaian Jev"
        icon={Store}
      >
        {rows.length === 0 ? (
          <Empty icon={Search} title="Tidak ada kompetitor pada filter ini" message="Pilih filter lain." />
        ) : (
          <TableWrap>
            <Table>
              <caption className="sr-only">Daftar kompetitor dan snapshot iklan</caption>
              <thead>
                <tr>
                  <Th>Brand</Th>
                  <Th>Angle utama</Th>
                  <Th>Hook</Th>
                  <Th>Penawaran</Th>
                  <Th>Lama tayang (perkiraan)</Th>
                  <Th>Variasi</Th>
                  <Th>Diperiksa</Th>
                  <Th>
                    <span className="sr-only">Aksi</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <Td>
                      <span className="flex items-center gap-2.5">
                        <span className="grid size-7.5 shrink-0 place-items-center rounded-inner border border-border bg-frame text-[11px] font-semibold text-secondary">
                          {c.initials}
                        </span>
                        <b className="font-medium">{c.brand}</b>
                      </span>
                    </Td>
                    <Td>{c.angle}</Td>
                    <Td>&ldquo;{c.hook}&rdquo;</Td>
                    <Td>{c.offer}</Td>
                    <Td numeric>{c.days} hari</Td>
                    <Td numeric>{c.variants}</Td>
                    <Td>{c.checked}</Td>
                    <Td>
                      <Button onClick={() => setSelected(c)}>Lihat snapshot</Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Panel>

      <Panel title="Peta celah pasar" description="Angle yang jenuh dan yang masih kosong" icon={Lightbulb}>
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          {GAPS.map((gap) => (
            <div key={gap.title} className="flex gap-2.5 rounded-control border border-border p-3">
              {gap.kind === "full" ? (
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-ink" aria-hidden />
              ) : (
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-success-ink" aria-hidden />
              )}
              <div className="min-w-0">
                <h3 className="text-sm font-medium">{gap.title}</h3>
                <p className="mt-1 mb-1.5 text-xs text-muted">{gap.body}</p>
                <Button
                  variant={gap.kind === "empty" ? "primary" : "default"}
                  onClick={() => notify(`Brief angle "${gap.title.replace(/^[^:]+:\s*/, "")}" dibuat dan masuk antrean approval.`)}
                >
                  {gap.action}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.brand ?? "Snapshot iklan"}
        description="Hanya data publik · lama tayang adalah perkiraan, bukan data belanja."
        footer={<Button onClick={() => setSelected(null)}>Tutup</Button>}
      >
        {selected ? (
          <DetailList
            items={[
              { term: "Angle", value: selected.angle },
              { term: "Hook", value: `"${selected.hook}"` },
              { term: "Penawaran", value: selected.offer },
              { term: "Format", value: selected.id === "dermaclear" ? "Carousel" : selected.id === "glowlab" ? "Video" : "Gambar" },
              { term: "Lama tayang (perkiraan)", value: `${selected.days} hari` },
              { term: "Tahap funnel", value: "Pertimbangan" },
            ]}
          />
        ) : null}
      </Modal>
    </>
  );
}
