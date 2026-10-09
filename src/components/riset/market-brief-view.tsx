"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Database, Puzzle, Radar, Search, ShieldAlert, Target, TrendingUp, AlertTriangle } from "lucide-react";
import {
  Button,
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
} from "@/components/ui";

import { titleize } from "@/lib/slug";
import type { Data } from "@/lib/riset-types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function formatRupiahRange(min: number | null, max: number | null): string {
  const fmt = (n: number | null) => n ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n) : "—";
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `≥ ${fmt(min)}`;
  if (max) return `≤ ${fmt(max)}`;
  return "—";
}

function getScoreLabel(key: string): string {
  switch (key) {
    case "demand": return "Permintaan";
    case "competition": return "Persaingan";
    case "margin": return "Margin";
    case "ad_ease": return "Kemudahan diiklankan";
    case "owner_fit": return "Kecocokan pemilik";
    default: return key;
  }
}

export function MarketBriefView({ productId, data }: { productId: string; data: Data }) {
  const router = useRouter();
  const name = data?.product?.name ?? titleize(productId);
  const brief = data?.brief;
  const scores = data?.scores ?? [];
  const product = data?.product;

  if (!brief) {
    return (
      <>
        <PageHeader
          title="Market Brief"
          description={`${name} · belum ada data riset`}
        >
          <Link className={btnClass("default")} href="/riset">
            <ArrowLeft className="size-4" aria-hidden />
            Daftar kandidat
          </Link>
        </PageHeader>
        <Panel>
          <Empty
            icon={Search}
            title="Belum ada market brief"
            message="Riset untuk produk ini belum selesai. Periksa status job di halaman Riset Pasar."
          />
        </Panel>
      </>
    );
  }

  const hasScores = scores.length === 5;

  return (
    <>
      <PageHeader
        title="Market Brief"
        description={`${name} · versi {brief.version} · disusun {formatDate(brief.createdAt)} · sumber dan tanggal dicantumkan.`}
      >
        <Status label="Fakta vs dugaan dibedakan" tone="info" />
        <Link className={btnClass("default")} href="/riset">
          <ArrowLeft className="size-4" aria-hidden />
          Daftar kandidat
        </Link>
        {product?.status !== "selected" && (
          <Button
            variant="primary"
            icon={Check}
            onClick={async () => {
              try {
                const res = await fetch(`/api/products/${productId}/select`, { method: "POST" });
                if (!res.ok) throw new Error("Gagal memilih produk");
                notify(`${name} dipilih sebagai produk aktif.`);
                router.push(`/produk/${productId}`);
              } catch {
                notify("Gagal memilih produk");
              }
            }}
          >
            Gunakan produk ini
          </Button>
        )}
      </PageHeader>

      {/* Skor Jev */}
      {hasScores && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5 mb-4">
          {scores.map((s) => (
            <Stat
              key={s.questionKey}
              icon={s.forwarded ? AlertTriangle : Target}
              title={getScoreLabel(s.questionKey)}
              value={s.answer.charAt(0).toUpperCase() + s.answer.slice(1)}
              delta={`${Math.round(s.confidence * 100)}% keyakinan`}
              trend={s.forwarded ? "down" : "up"}
              note={s.forwarded ? "Di bawah ambang, perlu ditinjau" : "Melewati ambang keyakinan"}
            />
          ))}
        </section>
      )}

      {/* Ringkasan utama dari brief */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_332px]">
        <div className="grid gap-4">
          <Panel title="Ringkasan permintaan" description="Fakta dari data publik, bukan jaminan hasil" icon={Search}>
            <p className="text-sm leading-relaxed text-secondary">{brief.demandSummary}</p>
          </Panel>

          <Panel
            title="Peta kompetitor"
            description="Perkiraan dari iklan aktif, tanpa data belanja"
            icon={Radar}
          >
            {brief.competitors && Array.isArray(brief.competitors) && brief.competitors.length > 0 ? (
              <TableWrap>
                <Table>
                  <caption className="sr-only">Ringkasan kompetitor</caption>
                  <thead>
                    <tr>
                      <Th>Brand</Th>
                      <Th>Angle utama</Th>
                      <Th>Penawaran</Th>
                      <Th>Lama tayang (perkiraan)</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {brief.competitors.map((c: unknown, i: number) => {
                      const comp = c as Record<string, unknown>;
                      return (
                        <tr key={i}>
                          <Td>{String(comp.brand ?? "")}</Td>
                          <Td>{String(comp.angle ?? "")}</Td>
                          <Td>{String(comp.offer ?? "")}</Td>
                          <Td numeric>{String(comp.days_running ?? comp.daysRunning ?? "—")} hari</Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </TableWrap>
            ) : (
              <p className="text-sm text-muted">Belum ada data kompetitor.</p>
            )}
          </Panel>

          <Panel title="Celah pasar" description="Angle yang jenuh dan yang masih kosong" icon={Puzzle}>
            <p className="text-sm leading-relaxed text-secondary">{brief.gaps ?? "Belum dianalisis."}</p>
          </Panel>
        </div>

        <div className="grid gap-4">
          <Panel title="Harga pasar" description="Rentang harga dari data marketplace" icon={Target}>
            <div className="text-2xl font-semibold tabular-nums">{formatRupiahRange(brief.priceMin, brief.priceMax)}</div>
            <p className="text-xs text-muted mt-1">Rentang harga kompetitor</p>
          </Panel>

          <Panel title="Risiko" description="Perlu mitigasi sebelum investasi besar" icon={ShieldAlert}>
            <p className="text-sm leading-relaxed text-secondary">{brief.risks ?? "Belum dianalisis."}</p>
            <div className="mt-3">
              <Status label="Risiko klaim: perlu review" tone="warning" />
            </div>
          </Panel>

          <Panel title="Rekomendasi" description="Arah strategis dari riset" icon={TrendingUp}>
            <p className="text-sm leading-relaxed text-secondary">{brief.recommendation ?? "Belum ada rekomendasi."}</p>
          </Panel>

          <Panel title="Rencana validasi" description="Tes kecil sebelum skala" icon={TrendingUp}>
            <p className="text-sm leading-relaxed text-secondary">{brief.validationPlan ?? "Belum direncanakan."}</p>
          </Panel>
        </div>
      </div>

      {/* Sumber data */}
      <Panel
        title="Sumber data dan tanggal"
        description="Setiap angka menyertai asalnya; dibedakan fakta, perkiraan, dan dugaan"
        icon={Database}
      >
        {brief.sources && brief.sources.length > 0 ? (
          <TableWrap>
            <Table>
              <caption className="sr-only">Sumber data market brief</caption>
              <thead>
                <tr>
                  <Th>Sumber</Th>
                  <Th>Jenis</Th>
                  <Th>Diambil</Th>
                </tr>
              </thead>
              <tbody>
                {brief.sources.map((s, i) => (
                  <tr key={i}>
                    <Td>{s.label}</Td>
                    <Td>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-inner text-[10px] font-medium bg-muted">
                        {s.kind.toUpperCase()}
                      </span>
                    </Td>
                    <Td>{formatDate(s.retrievedAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : (
          <p className="text-sm text-muted">Belum ada sumber data tercatat.</p>
        )}
      </Panel>
    </>
  );
}