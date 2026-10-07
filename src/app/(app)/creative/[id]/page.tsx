import { CreativeDetailView } from "@/components/creative/creative-detail-view";

export function generateStaticParams() {
  return [
    { id: "bukti-hook1" },
    { id: "bukti-video" },
    { id: "kusam-hook3" },
    { id: "kusam-video" },
    { id: "hemat-offer" },
    { id: "bukti-hook4" },
  ];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CreativeDetailView id={id} />;
}
