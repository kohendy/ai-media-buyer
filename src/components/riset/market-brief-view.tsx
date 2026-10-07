"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Database, Puzzle, Radar, Search, ShieldAlert, Target, TrendingUp } from "lucide-react";
import {
  Button,
  DetailList,
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

export function MarketBriefView({ productId }: { productId: string }) {
  const router = useRouter();
  const name = titleize(productId);

  return (
    <>
      <PageHeader
        title="Market Brief"
        description={`${name} · versi 1 · disusun 6 Oktober 2026 · sumber dan tanggal dicantumkan.`}
      >
        <Status label="Fakta vs dugaan dibedakan" tone="info" />
        <Link className={btnClass("default")} href="/riset">
          <ArrowLeft className="size-4" aria-hidden />
          Daftar kandidat
        </Link>
        <Button
          variant="primary"
          icon={Check}
          onClick={() => {
            notify("Produk dipilih. Lanjut menyusun Insight Produk.");
            router.push(`/produk/${productId}`);
          }}
        >
          Gunakan produk ini
        </Button>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={TrendingUp} title="Permintaan" value="Tinggi" delta="+18% dalam 90 hari" trend="up" note="Pencarian dan penjualan naik" />
        <Stat icon={Target} title="Harga pasar" value="Rp 89–159 rb" delta="Median Rp 124.000" trend="flat" note="Dari 6 penjual teratas" />
        <Stat icon={Radar} title="Kompetitor aktif" value="6" delta="3 ganti angle 30 hari" trend="up" note="Dipantau di Ad Library" />
        <Stat icon={Puzzle} title="Celah utama" value="Bukti bahan" delta="Belum ada yang menonjolkan" trend="flat" note="Peluang message match" />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_332px]">
        <div className="grid gap-4">
          <Panel title="Ringkasan permintaan" description="Fakta dari data publik, bukan jaminan hasil" icon={Search}>
            <p className="text-sm leading-relaxed text-secondary">
              Permintaan stabil dan berulang. Ulasan paling sering menyebut{" "}
              <strong className="text-text">tekstur ringan</strong> dan{" "}
              <strong className="text-text">tidak lengket</strong>. Puncak pembelian terjadi pada awal
              bulan; musim ramai awal tahun dan menjelang Ramadan.
            </p>
          </Panel>

          <Panel
            title="Peta kompetitor"
            description="Perkiraan dari iklan aktif, tanpa data belanja"
            icon={Radar}
          >
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
                  <tr><Td>Glowlab</Td><Td>Bukti dermatolog</Td><Td>Bundling 2 botol</Td><Td numeric>84 hari</Td></tr>
                  <tr><Td>Skin+</Td><Td>Harga termurah</Td><Td>Gratis ongkir</Td><Td numeric>41 hari</Td></tr>
                  <tr><Td>Dermaclear</Td><Td>Sebelum–sesudah</Td><Td>Garansi 30 hari</Td><Td numeric>27 hari</Td></tr>
                  <tr><Td>Naturé</Td><Td>Bahan alami</Td><Td>Cashback</Td><Td numeric>19 hari</Td></tr>
                </tbody>
              </Table>
            </TableWrap>
          </Panel>

          <Panel title="Celah pasar" description="Angle yang jenuh dan yang masih kosong" icon={Puzzle}>
            <ul className="m-0 grid list-none gap-1.5 p-0">
              <li className="flex gap-2 text-xs text-secondary">
                <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                <span>
                  <strong className="text-text">Kosong:</strong> penjelasan kandungan dan cara kerja bahan
                  dengan visual produk asli.
                </span>
              </li>
              <li className="flex gap-2 text-xs text-secondary">
                <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                <span>
                  <strong className="text-text">Kosong:</strong> testimoni pelanggan nyata berbahasa
                  Indonesia untuk tipe kulit berminyak.
                </span>
              </li>
              <li className="flex gap-2 text-xs text-secondary">
                <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-warning-ink" aria-hidden />
                <span>
                  <strong className="text-text">Jenuh:</strong> klaim &ldquo;sebelum–sesudah&rdquo; dan
                  janji hasil instan; berisiko ditolak Meta.
                </span>
              </li>
            </ul>
          </Panel>
        </div>

        <div className="grid gap-4">
          <Panel title="Risiko" description="Perlu mitigasi sebelum investasi besar" icon={ShieldAlert}>
            <p className="text-sm leading-relaxed text-secondary">
              Persaingan sedang dan produk mudah ditiru. Klaim kesehatan berisiko ditolak, jadi copy
              harus fokus pada pengalaman pemakaian, bukan janji medis.
            </p>
            <div className="mt-3">
              <Status label="Risiko klaim: sedang" tone="warning" />
            </div>
          </Panel>

          <Panel title="Rencana validasi" description="Tes kecil sebelum skala" icon={TrendingUp}>
            <DetailList
              items={[
                { term: "Budget tes", value: "Rp 500.000" },
                { term: "Durasi", value: "3 hari" },
                { term: "Hipotesis", value: 'Angle "bukti bahan" menurunkan CPA' },
                { term: "Ukuran minimum", value: "30 hasil atau 3× CPA target" },
              ]}
            />
          </Panel>
        </div>
      </div>

      <Panel
        title="Sumber data dan tanggal"
        description="Setiap angka menyertai asalnya"
        icon={Database}
      >
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
              <tr><Td>Pencarian &amp; minat kategori skincare</Td><Td>Tren pencarian</Td><Td>5 Okt 2026</Td></tr>
              <tr><Td>Penjual teratas di marketplace</Td><Td>Harga &amp; ulasan</Td><Td>5 Okt 2026</Td></tr>
              <tr><Td>Snapshot iklan kompetitor (semi-manual)</Td><Td>Angle &amp; penawaran</Td><Td>4 Okt 2026</Td></tr>
              <tr><Td>Brief pemilik</Td><Td>Harga, margin, kapasitas</Td><Td>3 Okt 2026</Td></tr>
            </tbody>
          </Table>
        </TableWrap>
      </Panel>
    </>
  );
}
