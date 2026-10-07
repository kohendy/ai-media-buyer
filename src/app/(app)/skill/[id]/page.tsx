import { SkillEditorView } from "@/components/skill/skill-editor-view";

export function generateStaticParams() {
  return [
    { id: "market_researcher" },
    { id: "product_analyst" },
    { id: "audience_analyst" },
    { id: "landing_page_builder" },
    { id: "ad_copywriter" },
    { id: "creative_director" },
    { id: "ads_analyst" },
    { id: "competitor_analyst" },
    { id: "creative_reviser" },
  ];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SkillEditorView skillId={id} />;
}
