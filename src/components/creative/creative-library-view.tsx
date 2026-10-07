"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CopyPlus, GalleryHorizontal, Image as ImageIcon, Images, Play, Rocket, Search, Sparkles, TrendingDown } from "lucide-react";
import {
  Button,
  Chip,
  Empty,
  Input,
  PageHeader,
  Panel,
  Stat,
  Status,
  btnClass,
  notify,
  type Tone,
} from "@/components/ui";

type Format = "image" | "video" | "carousel";

type Creative = {
  id: string;
  name: string;
  angle: "A1" | "A2" | "A3";
  format: Format;
  ratio: string;
  status: "draft" | "approved" | "in_use" | "fatigued";
  statusLabel: string;
  statusTone: Tone;
  ctr: string;
  cpa: string;
  roas: string;
  hook: number;
};

const INITIAL: Creative[] = [
  { id: "bukti-hook1", name: "SerumVC_Bukti_Hook1_v1", angle: "A1", format: "image", ratio: "4:5", status: "approved", statusLabel: "Disetujui", statusTone: "success", ctr: "1,8%", cpa: "Rp 52 rb", roas: "3,3×", hook: 82 },
  { id: "bukti-video", name: "SerumVC_Bukti_Video_v1", angle: "A1", format: "video", ratio: "9:16", status: "in_use", statusLabel: "Dipakai", statusTone: "info", ctr: "2,1%", cpa: "Rp 48 rb", roas: "3,6×", hook: 85 },
  { id: "kusam-hook3", name: "SerumVC_Kusam_Hook3_v1", angle: "A2", format: "image", ratio: "4:5", status: "draft", statusLabel: "Draf", statusTone: "info", ctr: "1,5%", cpa: "Rp 61 rb", roas: "2,8×", hook: 74 },
  { id: "kusam-video", name: "SerumVC_Kusam_Video_v1", angle: "A2", format: "video", ratio: "9:16", status: "draft", statusLabel: "Draf", statusTone: "info", ctr: "—", cpa: "—", roas: "—", hook: 70 },
  { id: "hemat-offer", name: "SerumVC_Hemat_Offer_v1", angle: "A3", format: "carousel", ratio: "1:1", status: "approved", statusLabel: "Disetujui", statusTone: "success", ctr: "1,4%", cpa: "Rp 57 rb", roas: "3,0×", hook: 68 },
  { id: "bukti-hook4", name: "SerumVC_Bukti_Hook4_v1", angle: "A1", format: "image", ratio: "4:5", status: "fatigued", statusLabel: "Jenuh", statusTone: "danger", ctr: "0,9%", cpa: "Rp 88 rb", roas: "1,9×", hook: 60 },
];

const ANGLE_LABEL: Record<Creative["angle"], string> = {
  A1: "Bukti bahan",
  A2: "Kusam siang",
  A3: "Hemat",
};

function FormatIcon({ format }: { format: Format }) {
  if (format === "video") return <Play className="size-6 text-muted" aria-hidden />;
  if (format === "carousel") return <GalleryHorizontal className="size-6 text-muted" aria-hidden />;
  return <ImageIcon className="size-6 text-muted" aria-hidden />;
}

const FORMAT_LABEL: Record<Format, string> = { image: "Gambar", video: "Video", carousel: "Carousel" };

export function CreativeLibraryView() {
  const [cards, setCards] = useState(INITIAL);
  const [angle, setAngle] = useState<"all" | Creative["angle"]>("all");
  const [status, setStatus] = useState<"all" | Creative["status"]>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter(
      (card) =>
        (angle === "all" || card.angle === angle) &&
        (status === "all" || card.status === status) &&
        (!q || card.name.toLowerCase().includes(q) || ANGLE_LABEL[card.angle].toLowerCase().includes(q)),
    );
  }, [cards, angle, status, query]);

  return (
    <>
      <PageHeader
        title="Creative"
        description="Pustaka creative per angle. Semua paket melalui pra-cek dan persetujuan sebelum dipakai. Data contoh."
      >
        <Button
          variant="primary"
          icon={Sparkles}
          onClick={() => notify("Paket creative baru dibuat dari angle terpilih.")}
        >
          Buat paket creative
        </Button>
      </PageHeader>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Images} title="Total creative" value="6" delta="3 angle" trend="flat" />
        <Stat icon={Sparkles} title="Disetujui" value="2" delta="siap dipakai" trend="up" />
        <Stat icon={Rocket} title="Dipakai" value="1" delta="di iklan aktif" trend="flat" />
        <Stat icon={TrendingDown} title="Jenuh" value="1" delta="perlu creative baru" trend="down" />
      </section>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter creative">
        {(["all", "A1", "A2", "A3"] as const).map((key) => (
          <Chip key={key} pressed={angle === key} onClick={() => setAngle(key)}>
            {key === "all" ? "Semua angle" : `${key} · ${ANGLE_LABEL[key]}`}
          </Chip>
        ))}
        <span className="text-xs text-muted">|</span>
        {(["all", "draft", "approved", "in_use", "fatigued"] as const).map((key) => (
          <Chip key={key} pressed={status === key} onClick={() => setStatus(key)}>
            {key === "all" ? "Semua status" : key === "draft" ? "Draf" : key === "approved" ? "Disetujui" : key === "in_use" ? "Dipakai" : "Jenuh"}
          </Chip>
        ))}
      </div>

      <div className="grid max-w-[320px] gap-0.5">
        <label className="text-xs font-medium" htmlFor="cr-search">
          Cari nama atau angle
        </label>
        <Input
          id="cr-search"
          type="search"
          placeholder="mis. bukti bahan"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <p className="m-0 text-xs text-muted">{visible.length} creative</p>

      {visible.length === 0 ? (
        <Panel>
          <Empty icon={Search} title="Tidak ada creative yang cocok" message="Longgarkan filter angle atau status." />
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((card) => (
            <article key={card.id} className="flex min-w-0 flex-col gap-2.5 rounded-card border border-border bg-surface p-3">
              <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-inner border border-border bg-[repeating-linear-gradient(135deg,var(--color-frame)_0_10px,var(--color-stripe)_10px_12px)]">
                <span className="absolute top-2 left-2 rounded-full bg-text/78 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.04em] uppercase text-white">
                  {FORMAT_LABEL[card.format]} {card.ratio}
                </span>
                <FormatIcon format={card.format} />
              </div>
              <div>
                <h3 className="truncate text-sm font-medium">{card.name}</h3>
                <p className="mt-0.5 text-xs text-muted">
                  {card.angle} · {ANGLE_LABEL[card.angle]}
                </p>
              </div>
              <Status label={card.statusLabel} tone={card.statusTone} />
              <dl className="flex flex-wrap gap-3 text-[11px] text-muted">
                {[
                  ["CTR", card.ctr],
                  ["CPA", card.cpa],
                  ["ROAS", card.roas],
                  ["Hook", String(card.hook)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="inline">{label} </dt>
                    <dd className="inline font-medium tabular-nums text-text">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap items-center gap-2">
                <Link className={btnClass("default")} href={`/creative/${card.id}`}>
                  Pratinjau
                </Link>
                {card.status === "fatigued" ? (
                  <Button variant="primary" onClick={() => notify("Angle baru disusun dari playbook pemenang.")}>
                    Angles baru
                  </Button>
                ) : card.status === "draft" ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setCards((list) =>
                        list.map((c) =>
                          c.id === card.id ? { ...c, status: "approved", statusLabel: "Disetujui", statusTone: "success" } : c,
                        ),
                      );
                      notify(`${card.name} disetujui dan masuk pustaka siap pakai.`);
                    }}
                  >
                    Setujui
                  </Button>
                ) : (
                  <Button
                    icon={CopyPlus}
                    onClick={() => notify("Variasi baru dibuat dari angle pemenang dan masuk antrean approval.")}
                  >
                    Minta variasi
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
