import { CandidatesView } from "@/components/riset/candidates-view";
import { getEnv } from "@/lib/env";
import { unstable_noStore } from "next/cache";

async function fetchCandidates() {
  unstable_noStore();
  const env = getEnv();
  const res = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/research`, {
    headers: { "content-type": "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return { items: [] };
  const data = await res.json();
  return data;
}

export const instant = false;

export default async function Page() {
  const { items } = await fetchCandidates();
  return <CandidatesView initialCandidates={items} />;
}
