import { CandidatesView } from "@/components/riset/candidates-view";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listResearchCandidates } from "@/lib/research-queries";

export const instant = false;

export default async function Page() {
  // A5: Verifikasi sesi untuk halaman dashboard
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const items = await listResearchCandidates();
  return <CandidatesView initialCandidates={items} />;
}