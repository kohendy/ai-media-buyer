import { InsightView } from "@/components/produk/insight-view";

export function generateStaticParams() {
  return [{ id: "serum-vitamin-c" }];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InsightView productId={id} />;
}
