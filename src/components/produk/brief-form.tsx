"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Info, ListChecks, ClipboardList, Sparkles } from "lucide-react";
import {
  Button,
  Chip,
  Field,
  Input,
  PageHeader,
  Panel,
  Select,
  Textarea,
  notify,
} from "@/components/ui";

type Mode = "quick" | "full";

const QUICK_FIELDS = [
  { id: "name", label: "Nama produk", placeholder: "", textarea: false },
  { id: "price", label: "Harga dan varian", placeholder: "mis. Rp 129.000 · 30 ml", textarea: false },
  { id: "desc", label: "Deskripsi singkat", placeholder: "", textarea: true },
  { id: "target", label: "Target pembeli", placeholder: "", textarea: true },
  { id: "strengths", label: "Tiga kelebihan menurut pemilik", placeholder: "", textarea: true },
  { id: "problem", label: "Masalah utama yang diselesaikan", placeholder: "", textarea: true },
] as const;

export function BriefForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("quick");
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  function setValue(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
    if (value.trim()) setErrors((prev) => ({ ...prev, [id]: false }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, boolean> = {};
    QUICK_FIELDS.forEach((field) => {
      if (!values[field.id]?.trim()) nextErrors[field.id] = true;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      notify("Lengkapi isian wajib yang ditandai.");
      return;
    }
    notify("Brief disimpan. Insight Produk sedang dirumuskan dari brief ini.");
    router.push("/produk/serum-vitamin-c");
  }

  return (
    <>
      <PageHeader
        title="Brief Produk Baru"
        description="Isi jalur manual bila produk sudah ditentukan. Mode cepat cukup lima isian wajib."
      />

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Mode pengisian">
        <Chip pressed={mode === "quick"} onClick={() => setMode("quick")}>
          Mode cepat
        </Chip>
        <Chip pressed={mode === "full"} onClick={() => setMode("full")}>
          Mode lengkap
        </Chip>
        <span className="text-xs text-muted">
          Dapat ditempel sebagai teks atau diunggah dari berkas.
        </span>
      </div>

      <form className="grid gap-4" onSubmit={onSubmit} noValidate>
        <Panel
          title="Lima isian wajib"
          description="Dipakai untuk merumuskan kekuatan dan pain point"
          icon={ListChecks}
          bodyClassName="grid gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {QUICK_FIELDS.slice(0, 2).map((field) => (
              <Field
                key={field.id}
                label={`${field.label} *`}
                htmlFor={`brief-${field.id}`}
                error={errors[field.id] ? `${field.label} wajib diisi.` : undefined}
              >
                {field.textarea ? (
                  <Textarea
                    id={`brief-${field.id}`}
                    value={values[field.id] ?? ""}
                    onChange={(e) => setValue(field.id, e.target.value)}
                  />
                ) : (
                  <Input
                    id={`brief-${field.id}`}
                    value={values[field.id] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(e) => setValue(field.id, e.target.value)}
                  />
                )}
              </Field>
            ))}
          </div>

          <Field
            label="Deskripsi singkat *"
            htmlFor="brief-desc"
            error={errors.desc ? "Deskripsi wajib diisi." : undefined}
          >
            <Textarea
              id="brief-desc"
              value={values.desc ?? ""}
              onChange={(e) => setValue("desc", e.target.value)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            {QUICK_FIELDS.slice(3).map((field) => (
              <Field
                key={field.id}
                label={`${field.label} *`}
                htmlFor={`brief-${field.id}`}
                error={errors[field.id] ? `${field.label} wajib diisi.` : undefined}
              >
                <Textarea
                  id={`brief-${field.id}`}
                  value={values[field.id] ?? ""}
                  onChange={(e) => setValue(field.id, e.target.value)}
                />
              </Field>
            ))}
          </div>
        </Panel>

        {mode === "full" ? (
          <Panel
            title="Detail lengkap (opsional)"
            description="Melengkapi bukti dan batasan klaim agar halaman tidak bergantung pada dugaan AI"
            icon={ClipboardList}
            bodyClassName="grid gap-4 sm:grid-cols-2"
          >
            <Field label="Varian dan spesifikasi" htmlFor="brief-specs">
              <Textarea id="brief-specs" value={values.specs ?? ""} onChange={(e) => setValue("specs", e.target.value)} />
            </Field>
            <Field label="Pembeda dari kompetitor" htmlFor="brief-diff">
              <Textarea id="brief-diff" value={values.diff ?? ""} onChange={(e) => setValue("diff", e.target.value)} />
            </Field>
            <Field label="Bukti (testimoni, sertifikasi, angka)" htmlFor="brief-proof" help="Bukti ini yang boleh dipakai sebagai klaim faktual.">
              <Textarea id="brief-proof" value={values.proof ?? ""} onChange={(e) => setValue("proof", e.target.value)} />
            </Field>
            <Field label="Batasan klaim (tidak boleh dipakai)" htmlFor="brief-limits">
              <Textarea id="brief-limits" value={values.limits ?? ""} onChange={(e) => setValue("limits", e.target.value)} />
            </Field>
            <Field label="Penawaran dan garansi" htmlFor="brief-offer">
              <Textarea id="brief-offer" value={values.offer ?? ""} onChange={(e) => setValue("offer", e.target.value)} />
            </Field>
            <Field label="Cara order atau lokasi" htmlFor="brief-order">
              <Input id="brief-order" value={values.order ?? ""} placeholder="mis. WhatsApp atau link checkout" onChange={(e) => setValue("order", e.target.value)} />
            </Field>
            <Field label="Nada bahasa" htmlFor="brief-tone">
              <Select id="brief-tone" value={values.tone ?? "Ramah dan santai"} onChange={(e) => setValue("tone", e.target.value)}>
                <option>Ramah dan santai</option>
                <option>Netral dan meyakinkan</option>
                <option>Premium dan tenang</option>
              </Select>
            </Field>
            <Field label="Unggah berkas brief" htmlFor="brief-file" help="Setelah dibaca, brief langsung mengisi isian di atas.">
              <Input id="brief-file" type="file" accept=".txt,.md,.doc,.docx,.pdf" />
            </Field>
          </Panel>
        ) : null}

        <div className="flex gap-2 rounded-control border border-border bg-frame p-3 text-xs text-secondary" role="note">
          <Info className="mt-0.5 size-3.5 shrink-0 text-info" aria-hidden />
          <span>
            Bila brief kurang atau ambigu, agent mengajukan maksimal lima pertanyaan klarifikasi sebelum
            merumuskan insight. Angka, sertifikasi, dan testimoni tidak dibuat oleh AI.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              setValues({});
              setErrors({});
              setMode("quick");
              notify("Formulir dikosongkan.");
            }}
          >
            Kosongkan
          </Button>
          <Button variant="primary" type="submit" icon={Sparkles} className="ml-auto">
            Simpan dan rumuskan insight
          </Button>
        </div>
      </form>
    </>
  );
}
