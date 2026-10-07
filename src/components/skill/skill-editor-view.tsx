"use client";

import { useState } from "react";
import { Check, FilePen, FlaskConical, History, Info, Save, ShieldCheck } from "lucide-react";
import {
  Button,
  DetailList,
  Field,
  PageHeader,
  Panel,
  Select,
  Status,
  Textarea,
  notify,
} from "@/components/ui";

const DEFAULT_INSTRUCTIONS = `Kamu penulis copy iklan Meta berbahasa Indonesia untuk pemilik bisnis pemula.

Aturan:
- Tulis 3 varian dengan kerangka berbeda: masalah-solusi, bukti sosial, penawaran.
- Pakai kata yang dipakai audiens; hindari istilah teknis.
- Jangan mengarang angka, harga, sertifikasi, atau testimoni. Klaim faktual hanya dari insight terkonfirmasi.
- Sertakan batas teks agar tidak terpotong pada tampilan nyata.
- Bedakan fakta dan dugaan.`;

const SCHEMA = `{
  "variants": [
    {
      "framework": "masalah-solusi | bukti-sosial | penawaran",
      "primary_text": "string",
      "headline": "string",
      "description": "string",
      "cta": "string",
      "claims_used": ["insight_id"],
      "needs_proof": boolean
    }
  ]
}`;

export function SkillEditorView({ skillId }: { skillId: string }) {
  const [tier, setTier] = useState("Utama");
  const [instructions, setInstructions] = useState(DEFAULT_INSTRUCTIONS);
  const [examples, setExamples] = useState('Hook: "Kulit berminyak bukan berarti harus kusam."\nTeks utama: ringkas, satu ide per kalimat.\nHeadline: manfaat utama, maks 40 karakter.');
  const [brand, setBrand] = useState('Nada ramah dan santai. Harga ditulis "Rp 129.000". Dilarang klaim "menyembuhkan".');
  const [sample, setSample] = useState("Serum Vitamin C · angle bukti bahan");
  const [tested, setTested] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [activeVersion, setActiveVersion] = useState(4);
  const [version, setVersion] = useState(4);

  return (
    <>
      <PageHeader
        title={`${skillId} · Penulis Copy Iklan`}
        description={`Versi ${version} · dipakai tahap Paket creative · hanya pemilik dapat mengaktifkan versi. Data contoh.`}
      >
        <Status label="Aktif" tone="success" />
        <Button
          icon={FlaskConical}
          onClick={() => {
            setTested(true);
            notify("Uji selesai. 0 pelanggaran skema; 1 catatan butuh bukti.");
          }}
        >
          Uji skill
        </Button>
        <Button
          variant="primary"
          icon={Check}
          disabled={!tested}
          onClick={() => {
            setActiveVersion(version);
            notify(`Versi ${version} diaktifkan. Workflow n8n memakai versi ini mulai sekarang.`);
          }}
        >
          Aktifkan versi
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          <Panel title="Editor skill" description="Perubahan disimpan sebagai versi draf baru" icon={FilePen}>
            <div className="mb-4 max-w-[240px]">
              <Field label="Tingkat model" htmlFor="skill-tier">
                <Select id="skill-tier" value={tier} onChange={(e) => setTier(e.target.value)}>
                  <option>Utama</option>
                  <option>Ringan</option>
                </Select>
              </Field>
            </div>

            <Field label="Instruksi peran dan aturan menulis" htmlFor="skill-instructions">
              <Textarea
                id="skill-instructions"
                className="min-h-[180px]"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </Field>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Contoh keluaran baik" htmlFor="skill-examples">
                <Textarea id="skill-examples" value={examples} onChange={(e) => setExamples(e.target.value)} />
              </Field>
              <Field label="Panduan brand dan bahasa" htmlFor="skill-brand">
                <Textarea id="skill-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
              </Field>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium" htmlFor="skill-schema">
                Skema keluaran (divalidasi sebelum dipakai)
              </label>
              <pre
                id="skill-schema"
                className="m-0 overflow-x-auto rounded-control border border-border bg-frame p-3 font-mono text-[11px] leading-relaxed whitespace-pre text-secondary"
              >
                {SCHEMA}
              </pre>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="primary"
                icon={Save}
                onClick={() => {
                  setVersion((v) => v + 1);
                  setTested(false);
                  setShowDiff(false);
                  notify("Perubahan disimpan sebagai versi draf baru. Uji sebelum mengaktifkan.");
                }}
              >
                Simpan sebagai draf baru
              </Button>
              <Button
                onClick={() => {
                  setInstructions(DEFAULT_INSTRUCTIONS);
                  notify("Suntingan dikembalikan ke versi aktif.");
                }}
              >
                Kembalikan suntingan
              </Button>
            </div>
          </Panel>

          <Panel title="Uji skill" description="Jalankan pada contoh masukan sebelum diaktifkan" icon={FlaskConical}>
            <div className="mb-3 max-w-[320px]">
              <Field label="Contoh masukan" htmlFor="skill-sample">
                <Select id="skill-sample" value={sample} onChange={(e) => setSample(e.target.value)}>
                  <option>Serum Vitamin C · angle bukti bahan</option>
                  <option>Serum Vitamin C · angle kusam siang</option>
                  <option>Blender Portable · angle praktis</option>
                </Select>
              </Field>
            </div>

            {tested ? (
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium">Keluaran versi aktif (v{version})</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Varian bukti sosial · headline 38 karakter · klaim memakai insight terkonfirmasi ·
                      menandai 1 butuh bukti. ({sample})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium">Keluaran versi sebelumnya (v{version - 1})</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Varian bukti sosial · headline 52 karakter · 1 ajakan ganda · tidak menandai butuh bukti.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button aria-pressed={showDiff} onClick={() => setShowDiff((v) => !v)}>
                    Tampilkan selisih teks
                  </Button>
                  <Status label="Skema valid" tone="success" />
                </div>
                {showDiff ? (
                  <div className="grid gap-0.5 font-mono text-[11px]">
                    <div className="rounded bg-success/12 px-2 py-1 text-success-ink">
                      + v{version}: menambahkan catatan &ldquo;needs_proof&rdquo; untuk klaim yang belum berbukti
                    </div>
                    <div className="rounded bg-success/12 px-2 py-1 text-success-ink">
                      + v{version}: headline lebih pendek (maks 40 karakter)
                    </div>
                    <div className="rounded bg-danger/10 px-2 py-1 text-danger-ink">
                      − v{version - 1}: menghapus kalimat ajakan ganda pada penutup
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-muted">Pilih contoh masukan lalu tekan Uji skill.</p>
            )}
          </Panel>
        </div>

        <div className="grid gap-4">
          <Panel title="Riwayat versi" description="Setiap perubahan membuat versi baru" icon={History}>
            <ul className="m-0 list-none p-0">
              {Array.from(new Set([version, 4, 3, 2].filter((v) => v <= version))).map((v) => (
                <li
                  key={v}
                  className={
                    "flex items-center gap-2 border-t border-divider px-2 py-2.5 first:border-t-0 " +
                    (activeVersion === v ? "rounded-control bg-frame" : "")
                  }
                >
                  <div className="min-w-0">
                    <b className="text-xs font-medium">v{v}</b>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {v === 4 ? "7 Okt · menambah aturan bukti" : v === 3 ? "2 Okt · nada lebih santai" : "24 Sep · kerangka 3 varian"}
                    </p>
                  </div>
                  {activeVersion === v ? (
                    <Status label="Aktif" tone="success" className="ml-auto" />
                  ) : (
                    <Button
                      className="ml-auto"
                      onClick={() => {
                        setActiveVersion(v);
                        notify(`Versi ${v} dikembalikan sebagai versi aktif.`);
                      }}
                    >
                      Kembalikan
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Batas skill" description="Yang tidak dapat diubah skill" icon={Info}>
            <ul className="m-0 grid list-none gap-1.5 p-0 text-xs text-muted">
              <li>Batas keras, kill switch, dan aturan scale tetap di kode.</li>
              <li>Pertanyaan penilaian Jev dikelola terpisah di halaman Aturan.</li>
              <li>Setiap keluaran mencatat versi skill yang dipakai.</li>
            </ul>
          </Panel>

          <Panel>
            <DetailList
              items={[
                { term: "Skill", value: skillId },
                { term: "Model", value: tier },
                { term: "Versi aktif", value: `v${activeVersion}` },
                { term: "Skema", value: "Tervalidasi" },
              ]}
            />
            <div className="mt-2 flex items-center gap-2 text-xs text-muted">
              <ShieldCheck className="size-4 text-success" aria-hidden />
              Keluaran tidak valid ditolak dan dicatat.
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
