import { titleize } from "@/lib/slug";
import {
  Brain,
  CheckCheck,
  FileCode2,
  FileText,
  FlaskConical,
  Images,
  LayoutDashboard,
  Lightbulb,
  Megaphone,
  Radar,
  ScrollText,
  Settings2,
  SlidersHorizontal,
  Telescope,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  /** Cocokkan juga untuk sub-route (mis. /produk/<id>). */
  matchPrefix?: string;
  /** Kecualikan sub-route tertentu dari pencocokan. */
  notPrefix?: string;
};

export type NavGroup = { caption: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    caption: "Alur Kerja",
    items: [
      { label: "Ringkasan", href: "/", icon: LayoutDashboard },
      { label: "Riset Produk", href: "/riset", icon: Telescope, matchPrefix: "/riset" },
      {
        label: "Insight Produk",
        href: "/produk/serum-vitamin-c",
        icon: Lightbulb,
        matchPrefix: "/produk",
        notPrefix: "/produk/baru",
      },
      { label: "Audiens", href: "/audiens", icon: UsersRound },
      { label: "Kompetitor", href: "/kompetitor", icon: Radar },
      { label: "Landing Page", href: "/landing-page", icon: FileCode2, matchPrefix: "/landing-page" },
      { label: "Creative", href: "/creative", icon: Images, matchPrefix: "/creative" },
    ],
  },
  {
    caption: "Operasi Iklan",
    items: [
      { label: "Kampanye", href: "/kampanye", icon: Megaphone },
      { label: "Eksperimen", href: "/eksperimen", icon: FlaskConical },
      { label: "Approval", href: "/approval", icon: CheckCheck, badge: 5 },
      { label: "Laporan", href: "/laporan", icon: FileText },
    ],
  },
  {
    caption: "Sistem",
    items: [
      { label: "Aturan & Batas", href: "/aturan", icon: SlidersHorizontal },
      { label: "Skill Agent", href: "/skill", icon: Brain, matchPrefix: "/skill" },
      { label: "Pengaturan", href: "/pengaturan", icon: Settings2 },
      { label: "Log Audit", href: "/log", icon: ScrollText },
    ],
  },
];

export function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/") return pathname === "/";
  if (item.notPrefix && pathname.startsWith(item.notPrefix)) return false;
  if (item.matchPrefix) {
    return pathname === item.matchPrefix || pathname.startsWith(item.matchPrefix + "/");
  }
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

const TITLE_OVERRIDES: Record<string, string> = {
  "/produk/baru": "Brief Produk Baru",
};

export function navLabelFor(pathname: string): string {
  let best: NavItem | null = null;
  let bestScore = -1;
  for (const group of navGroups) {
    for (const item of group.items) {
      if (!isNavActive(pathname, item)) continue;
      const score = item.href === "/" ? 1 : item.href.length;
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
    }
  }
  if (best) return best.label;
  const override = TITLE_OVERRIDES[pathname];
  if (override) return override;
  const segment = pathname.split("/").filter(Boolean).pop();
  return segment ? titleize(segment) : "Ringkasan";
}
