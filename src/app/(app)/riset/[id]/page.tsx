import { MarketBriefView } from "@/components/riset/market-brief-view";

export function generateStaticParams() {
  return [
    { id: "serum-vitamin-c" },
    { id: "blender-portable" },
    { id: "kue-kering-premium" },
    { id: "alat-rumah-multifungsi" },
  ];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MarketBriefView productId={id} />;
}
