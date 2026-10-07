import { LandingDetailView } from "@/components/landing/landing-detail-view";

export function generateStaticParams() {
  return [
    { id: "garansi-30-hari" },
    { id: "kusam-siang-hari" },
    { id: "bukti-bahan-live" },
    { id: "hemat-sebulan" },
    { id: "mahasiswa-hemat" },
    { id: "garansi-30-hari-v2" },
  ];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LandingDetailView id={id} />;
}
