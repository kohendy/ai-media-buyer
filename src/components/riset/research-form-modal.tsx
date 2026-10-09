"use client";

import { useState, useCallback } from "react";
import { Plus, Minus, Loader2, AlertCircle, SlidersHorizontal, Search } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { researchFormSchema, type ResearchForm } from "@/lib/riset-schema";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
  Modal,
  notify,
  Panel,
} from "@/components/ui";

const PRODUCT_TYPES = [
  { value: "online_physical", label: "Online — Produk fisik (dikirim)" },
  { value: "digital", label: "Digital (ebook, course, software)" },
  { value: "offline_service", label: "Offline — Jasa/Layanan (tempat fisik)" },
  { value: "other", label: "Lainnya" },
] as const;

export function ResearchFormModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ResearchForm) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResearchForm>({
    resolver: zodResolver(researchFormSchema),
    defaultValues: {
      ownerContext: {
        productType: "online_physical",
        location: "",
        capitalIdr: 15_000_000,
        minMarginPct: 55,
        productionCapability: "",
      },
      candidates: [{ name: "", category: "", note: "" }],
      suggestFromCategory: "",
    },
  });

  const { fields: candidateFields, append, remove } = useFieldArray({ control, name: "candidates" });

  const handleAddCandidate = useCallback(() => {
    append({ name: "", category: "", note: "" });
  }, [append]);

  const handleRemoveCandidate = useCallback(
    (index: number) => {
      if (candidateFields.length <= 1) {
        notify("Minimal 1 kandidat produk");
        return;
      }
      remove(index);
    },
    [candidateFields.length, remove]
  );

  const onFormSubmit = handleSubmit(async (data: ResearchForm) => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal memulai riset";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mulai Riset Pasar Baru"
      description="Isi konteks pemilik dan daftar kandidat produk. Minimal 1, maksimal 10 kandidat."
      footer={
        <>
          <Button variant="default" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button variant="primary" onClick={onFormSubmit} disabled={submitting} icon={submitting ? Loader2 : undefined}>
            {submitting ? "Memulai..." : "Mulai riset"}
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-inner bg-danger bg-opacity-10 border border-danger text-danger-ink text-sm flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={onFormSubmit} className="grid gap-6">
        {/* --- Konteks Pemilik --- */}
        <Panel title="Konteks Pemilik" description="Batasan yang dipakai untuk menyaring dan menilai kandidat" icon={SlidersHorizontal}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Jenis produk" htmlFor="productType" error={errors.ownerContext?.productType?.message}>
              <Controller
                name="ownerContext.productType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                    {PRODUCT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </Field>

            <Field label="Lokasi / radius layanan" htmlFor="location" error={errors.ownerContext?.location?.message}>
              <Controller
                name="ownerContext.location"
                control={control}
                render={({ field }) => <Input id="location" placeholder="Contoh: Nasional (kirim dari Jakarta) / Jakarta & sekitar 30 km" {...field} />}
              />
            </Field>

            <Field label="Modal awal (Rp)" htmlFor="capitalIdr" error={errors.ownerContext?.capitalIdr?.message}>
              <Controller
                name="ownerContext.capitalIdr"
                control={control}
                render={({ field }) => <Input id="capitalIdr" type="number" min={1} step={1000000} placeholder="15000000" value={field.value ?? 0} onChange={(e) => field.onChange(Number(e.target.value) || 0)} />}
              />
            </Field>

            <Field label="Margin minimum (%)" htmlFor="minMarginPct" error={errors.ownerContext?.minMarginPct?.message}>
              <Controller
                name="ownerContext.minMarginPct"
                control={control}
                render={({ field }) => <Input id="minMarginPct" type="number" min={1} max={100} placeholder="55" value={field.value ?? 0} onChange={(e) => field.onChange(Number(e.target.value) || 0)} />}
              />
            </Field>

            <Field
              label="Kemampuan produksi / pengadaan"
              htmlFor="productionCapability"
              error={errors.ownerContext?.productionCapability?.message}
              className="sm:col-span-2"
            >
              <Controller
                name="ownerContext.productionCapability"
                control={control}
                render={({ field }) => <Textarea id="productionCapability" rows={3} placeholder="Contoh: Bisa produksi sendiri 500 unit/bulan, stok bahan baku siap, pengiriman lewat JNE/J&T" {...field} />}
              />
            </Field>
          </div>
        </Panel>

        {/* --- Kandidat Produk --- */}
        <Panel title="Kandidat Produk" description="3–10 kandidat. Bisa kosong jika ingin sistem mengusulkan dari kategori." icon={Plus}>
          {candidateFields.map((candidate, index) => (
            <div key={candidate.id} className="flex flex-col gap-3 p-4 rounded-inner bg-frame border border-divider">
              <div className="flex items-center justify-between">
                <span className="font-medium">Kandidat #{index + 1}</span>
                {candidateFields.length > 1 && (
                  <Button variant="default" icon={Minus} onClick={() => handleRemoveCandidate(index)} aria-label="Hapus kandidat" />
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nama produk" error={errors.candidates?.[index]?.name?.message}>
                  <Controller
                    name={`candidates.${index}.name`}
                    control={control}
                    render={({ field }) => <Input placeholder="Contoh: Serum Vitamin C 15%" {...field} />}
                  />
                </Field>

                <Field label="Kategori (opsional)">
                  <Controller
                    name={`candidates.${index}.category`}
                    control={control}
                    render={({ field }) => <Input placeholder="Contoh: Skincare / Makanan / Alat rumah" {...field} />}
                  />
                </Field>

                <Field label="Catatan (opsional)" className="sm:col-span-2">
                  <Controller
                    name={`candidates.${index}.note`}
                    control={control}
                    render={({ field }) => <Textarea rows={2} placeholder="Catatan tambahan untuk kandidat ini" {...field} />}
                  />
                </Field>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3">
            <Button variant="default" type="button" icon={Plus} onClick={handleAddCandidate} disabled={candidateFields.length >= 10}>
              Tambah kandidat
            </Button>
            <span className="text-xs text-muted">{candidateFields.length} / 10 kandidat</span>
          </div>
        </Panel>

        {/* --- Usulan dari Kategori (opsional) --- */}
        <Panel title="Usulkan dari Kategori (Opsional)" description="Biarkan kosong jika sudah punya daftar kandidat di atas" icon={Search}>
          <Field label="Kategori untuk usulan sistem" error={errors.suggestFromCategory?.message}>
            <Controller
              name="suggestFromCategory"
              control={control}
              render={({ field }) => <Input placeholder="Contoh: skincare, makanan sehat, peralatan dapur" {...field} />}
            />
          </Field>
        </Panel>
      </form>
    </Modal>
  );
}