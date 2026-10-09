import { MarketBriefView } from "@/components/riset/market-brief-view";
import { getCurrentUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { getMarketBriefDetail } from "@/lib/research-queries";

export const instant = false;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  // A5: Verifikasi sesi untuk halaman dashboard
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const data = await getMarketBriefDetail(id);

  if (!data) {
    notFound();
  }

  return <MarketBriefView productId={id} data={data} />;
}