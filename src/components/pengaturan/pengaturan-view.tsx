"use client";

import { useState } from "react";
import { BadgePercent, Cpu, Plus, Save, Target, UserPlus, UsersRound, Wallet } from "lucide-react";
import {
  Button,
  Field,
  Input,
  PageHeader,
  Panel,
  Score,
  Select,
  Status,
  notify,
  type Tone,
} from "@/components/ui";

export function PengaturanView() {
  const [aiStatus, setAiStatus] = useState<{ label: string; tone: Tone }>({ label: "Belum diuji sesi ini", tone: "info" });

  return (
    <>
      <PageHeader
        title="Pengaturan"
        description="Koneksi, pengguna, dan batas pemakaian AI. Kunci dan token hanya ada di variabel lingkungan server. Data contoh."
      >
        <Button variant="primary" icon={Save} onClick={() => notify("Pengaturan disimpan.")}>
          Simpan pengaturan
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Koneksi Meta" description="MCP Meta dengan Marketing API sebagai cadangan" icon={BadgePercent}>
          <Row title="Status koneksi" body="Akun iklan terhubung · region akun Asia/Jakarta" status={{ label: "Terhubung", tone: "success" }} />
          <Row title="Izin" body="ads_read · ads_management" status={{ label: "Lengkap", tone: "success" }} />
          <Row title="Token kedaluwarsa" body="13 Okt 2026 · alert dikirim 6 hari sebelum habis" status={{ label: "6 hari lagi", tone: "warning" }} />
          <div className="mt-3 flex justify-end">
            <Button onClick={() => notify("Uji koneksi Meta berhasil.")}>Uji koneksi</Button>
          </div>
        </Panel>

        <Panel title="Koneksi AI" description="Claude lewat base URL; model dapat diganti lewat konfigurasi" icon={Cpu}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Base URL" htmlFor="set-base">
              <Input id="set-base" defaultValue="https://api.ai.example/v1" readOnly />
            </Field>
            <Field label="API key (tersamar)" htmlFor="set-key">
              <Input id="set-key" defaultValue="sk-••••••••••••1234" readOnly className="font-mono text-[11px]" />
            </Field>
            <Field label="Model utama" htmlFor="set-main">
              <Input id="set-main" defaultValue="claude-sonnet" />
            </Field>
            <Field label="Model ringan" htmlFor="set-light">
              <Input id="set-light" defaultValue="claude-haiku" />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                setAiStatus({ label: "Terhubung · 210 ms", tone: "success" });
                notify("Uji koneksi AI berhasil.");
              }}
            >
              Uji koneksi
            </Button>
            <Status label={aiStatus.label} tone={aiStatus.tone} />
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Kunci tidak pernah dikirim ke peramban pengguna lain maupun ditulis ke log.
          </p>
        </Panel>

        <Panel title="Jev" description="Penilaian terstruktur bervolume tinggi" icon={BadgePercent}>
          <Row title="Status" body="Fungsi judge() aktif · dapat dialihkan ke model umum" status={{ label: "Tersedia", tone: "success" }} />
          <div className="flex flex-wrap items-center gap-3 border-t border-divider py-2.5">
            <div className="min-w-0 flex-1">
              <b className="block text-sm font-medium">Ambang keyakinan</b>
              <p className="mt-0.5 text-xs text-muted">Di bawah ambang diteruskan ke Claude atau manusia</p>
            </div>
            <strong className="tabular-nums">80%</strong>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              onClick={() => {
                setAiStatus({ label: "Terhubung · 210 ms", tone: "success" });
                notify("Uji penilaian Jev berhasil.");
              }}
            >
              Uji penilaian
            </Button>
          </div>
        </Panel>

        <Panel title="Batas pemakaian AI" description="Batas harian dan bulanan termasuk gambar/video" icon={Wallet}>
          <div className="grid gap-2.5">
            <Score label="Panggilan hari ini" value="312 / 800" pct={39} />
            <Score label="Anggaran bulan ini" value="Rp 412 rb / Rp 1,5 jt" pct={27} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Batas panggilan harian" htmlFor="set-day">
              <Input id="set-day" inputMode="numeric" defaultValue="800" />
            </Field>
            <Field label="Batas anggaran bulanan (Rp)" htmlFor="set-month">
              <Input id="set-month" inputMode="numeric" defaultValue="1500000" />
            </Field>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Pengguna" description="Akses dibatasi daftar putih Telegram" icon={UsersRound}>
          <ul className="m-0 list-none p-0">
            <li className="flex items-center gap-2.5 border-t border-divider py-2.5 first:border-t-0">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-frame text-[11px] font-semibold text-secondary">PM</span>
              <div className="min-w-0">
                <b className="block text-sm font-medium">Pemilik</b>
                <small className="block text-[11px] text-muted">Akses penuh · owner</small>
              </div>
              <Status label="Aktif" tone="success" className="ml-auto" />
            </li>
            <li className="flex items-center gap-2.5 border-t border-divider py-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-frame text-[11px] font-semibold text-secondary">RN</span>
              <div className="min-w-0">
                <b className="block text-sm font-medium">Rani</b>
                <small className="block text-[11px] text-muted">Menyiapkan aset &amp; melihat · admin</small>
              </div>
              <Status label="Aktif" tone="success" className="ml-auto" />
            </li>
          </ul>
          <div className="mt-3">
            <Button icon={UserPlus} onClick={() => notify("Undang pengguna baru lewat bot Telegram; hanya akun terdaftar yang dilayani.")}>
              Tambah pengguna
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Admin tidak dapat mengaktifkan kampanye otomatis, mengubah aturan, atau mengelola pengguna.
          </p>
        </Panel>

        <Panel title="Target dan produk aktif" icon={Target}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Target CPA (Rp)" htmlFor="set-cpa">
              <Input id="set-cpa" inputMode="numeric" defaultValue="60000" />
            </Field>
            <Field label="Target ROAS" htmlFor="set-roas">
              <Input id="set-roas" inputMode="decimal" defaultValue="3.0" />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Produk aktif" htmlFor="set-product">
              <Select id="set-product" defaultValue="Serum Vitamin C">
                <option>Serum Vitamin C</option>
                <option>Blender Portable 4-in-1</option>
                <option>Kue Kering Premium</option>
              </Select>
            </Field>
          </div>
          <div className="mt-3 flex justify-end">
            <Button icon={Plus} onClick={() => notify("Produk aktif diperbarui.")}>
              Simpan target
            </Button>
          </div>
        </Panel>
      </div>
    </>
  );
}

function Row({
  title,
  body,
  status,
}: {
  title: string;
  body: string;
  status: { label: string; tone: Tone };
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-t border-divider py-2.5 first:border-t-0">
      <div className="min-w-0 flex-1">
        <b className="block text-sm font-medium">{title}</b>
        <p className="mt-0.5 text-xs text-muted">{body}</p>
      </div>
      <Status label={status.label} tone={status.tone} className="ml-auto" />
    </div>
  );
}
