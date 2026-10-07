"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BadgeCheck, MapPin, Quote, Target, UsersRound, Copy } from "lucide-react";
import {
  Button,
  Chip,
  DetailList,
  Empty,
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

type Persona = {
  id: string;
  label: string;
  lead: string;
  facts: Array<{ term: string; value: string }>;
};

const PERSONAS: Persona[] = [
  {
    id: "p1",
    label: "Rani · 27",
    lead: "Rani, 27. Staf kantor di Jakarta, kulit berminyak, bekerja di ruangan ber-AC lalu terkena panas saat perjalanan pulang.",
    facts: [
      { term: "Masalah utama", value: "Wajah cepat kusam dan terasa lengket siang hari" },
      { term: "Hasil yang diinginkan", value: "Wajah segar sampai sore tanpa touch-up berulang" },
      { term: "Kata yang dipakai", value: '"gerah", "kusam", "berat", "nyaman"' },
      { term: "Keberatan", value: "Takut lengket dan memicu jerawat" },
    ],
  },
  {
    id: "p2",
    label: "Dewi · 31",
    lead: "Dewi, 31. Ibu bekerja, aktif di luar ruangan, mulai mencari produk dengan bahan yang jelas dan beredar resmi.",
    facts: [
      { term: "Masalah utama", value: "Sulit menemukan produk yang menjelaskan kandungannya" },
      { term: "Hasil yang diinginkan", value: "Kulit ternutrisi dengan pemakaian sederhana" },
      { term: "Kata yang dipakai", value: '"aman", "isi", "jelas", "direkomendasikan"' },
      { term: "Keberatan", value: "Ragu bila tidak ada bukti sertifikasi" },
    ],
  },
  {
    id: "p3",
    label: "Mahasiswa · 21",
    lead: "Mahasiswa, 21. Budget terbatas, banyak mencari perbandingan dan review sebelum membeli.",
    facts: [
      { term: "Masalah utama", value: "Takut salah beli dan uang terbuang" },
      { term: "Hasil yang diinginkan", value: "Produk murah namun terasa bekerja" },
      { term: "Kata yang dipakai", value: '"worth it", "murce", "review dulu"' },
      { term: "Keberatan", value: "Harga dan pengiriman" },
    ],
  },
];

const PAINS = [
  "Wajah cepat kusam di tengah hari",
  "Produk terasa lengket dan berat",
  "Takut breakout saat mencoba produk baru",
  "Bingung memilih di antara merek yang mirip",
];

type Hook = { text: string; angle: string; type: string; status: string; tone: Tone };

const HOOKS: Hook[] = [
  { text: '"Kulit berminyak bukan berarti harus kusam."', angle: "A1", type: "Pernyataan", status: "Ide", tone: "info" },
  { text: '"Kandungan vitamin C-nya kami tulis terbuka."', angle: "A1", type: "Bukti", status: "Ide", tone: "info" },
  { text: '"Jam 3 sore, wajahmu masih segar?"', angle: "A2", type: "Pertanyaan", status: "Diuji", tone: "warning" },
  { text: '"Tekstur ringan, tanpa rasa lengket."', angle: "A2", type: "Manfaat", status: "Ide", tone: "info" },
  { text: '"Satu botol cukup sebulan, tanpa isi ulang."', angle: "A3", type: "Penawaran", status: "Ide", tone: "info" },
  { text: '"Coba dulu, baru nilai. Garansi 30 hari."', angle: "A3", type: "Keberatan", status: "Ide", tone: "info" },
];

const ANGLES = ["all", "A1", "A2", "A3"] as const;

export function AudiensView() {
  const router = useRouter();
  const [personaId, setPersonaId] = useState(PERSONAS[0].id);
  const [angle, setAngle] = useState<(typeof ANGLES)[number]>("all");

  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];
  const hooks = useMemo(() => HOOKS.filter((h) => angle === "all" || h.angle === angle), [angle]);

  return (
    <>
      <PageHeader
        title="Riset Audiens"
        description="Serum Vitamin C · disusun dari insight terkonfirmasi dan suara pelanggan publik. Data contoh."
      >
        <Status label="Draf · menunggu persetujuan" tone="warning" />
        <Button
          variant="primary"
          icon={BadgeCheck}
          onClick={() => {
            notify("Persona dan targeting awal disetujui. Lanjut ke landing page dan creative.");
            router.push("/landing-page");
          }}
        >
          Setujui persona
        </Button>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={UsersRound} title="Persona" value="3" delta="maksimal 3" trend="flat" />
        <Stat icon={Quote} title="Hook awal" value="12" delta="10–20 disarankan" trend="flat" />
        <Stat icon={Target} title="Keberatan" value="5" delta="dari komentar publik" trend="flat" />
        <Stat icon={BadgeCheck} title="Angle (angle_id)" value="4" delta="siap diuji" trend="up" />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Panel title="Persona" description="Maksimal tiga; setiap angle menempel pada satu angle_id" icon={UsersRound}>
          <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Pilih persona">
            {PERSONAS.map((p) => (
              <Chip key={p.id} pressed={p.id === personaId} onClick={() => setPersonaId(p.id)}>
                {p.label}
              </Chip>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-secondary">
            <strong className="text-text">{persona.label.split(" · ")[0]}</strong>
            {persona.lead.slice(persona.lead.indexOf(".") + 1)}
          </p>
          <DetailList className="mt-3.5" items={persona.facts} />
        </Panel>

        <div className="grid gap-4">
          <Panel title="Masalah dan keberatan" description="Diambil dari ulasan dan diskusi publik" icon={Target}>
            <ul className="m-0 grid list-none gap-2 p-0">
              {PAINS.map((pain) => (
                <li key={pain} className="flex gap-2 text-xs text-secondary">
                  <Target className="mt-0.5 size-3.5 shrink-0 text-warning-ink" aria-hidden />
                  {pain}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Usulan targeting awal" description="Acuan awal, bukan jaminan hasil" icon={MapPin}>
            <DetailList
              items={[
                { term: "Lokasi", value: "Jabodetabek & kota besar" },
                { term: "Usia", value: "20–35 tahun" },
                { term: "Pendekatan", value: "Luas, lalu berbasis minat skincare" },
                { term: "Bahasa", value: "Indonesia, santai" },
              ]}
            />
          </Panel>
        </div>
      </div>

      <Panel title="Bank hook" description="Setiap hook menempel pada satu angle_id" icon={Quote}>
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filter angle">
          {ANGLES.map((key) => (
            <Chip key={key} pressed={angle === key} onClick={() => setAngle(key)}>
              {key === "all" ? "Semua angle" : `${key} · ${key === "A1" ? "Bukti bahan" : key === "A2" ? "Kusam siang" : "Hemat"}`}
            </Chip>
          ))}
        </div>

        {hooks.length === 0 ? (
          <Empty icon={Quote} title="Tidak ada hook" message="Pilih angle lain." />
        ) : (
          <TableWrap>
            <Table>
              <caption className="sr-only">Bank hook awal</caption>
              <thead>
                <tr>
                  <Th>Hook</Th>
                  <Th>Angle</Th>
                  <Th>Tipe</Th>
                  <Th>Status</Th>
                  <Th>
                    <span className="sr-only">Aksi</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {hooks.map((hook) => (
                  <tr key={hook.text}>
                    <Td className="whitespace-normal">{hook.text}</Td>
                    <Td className="font-mono text-[11px] text-muted">{hook.angle}</Td>
                    <Td>{hook.type}</Td>
                    <Td>
                      <Status label={hook.status} tone={hook.tone} />
                    </Td>
                    <Td>
                      <Button
                        icon={Copy}
                        onClick={() => {
                          const text = hook.text.replace(/^"|"$/g, "");
                          if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
                          notify(`Hook disalin: "${text}"`);
                        }}
                      >
                        Salin
                      </Button>
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
