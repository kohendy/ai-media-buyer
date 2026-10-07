import "./env-load";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, rawSql } from "./index";
import {
  actionLog,
  adInsights,
  adSets,
  ads,
  agentSkillVersions,
  agentSkills,
  aiUsage,
  analyses,
  angles,
  approvals,
  audienceProfiles,
  auditLog,
  campaigns,
  competitors,
  competitorAds,
  creativeAssets,
  creatives,
  experimentArms,
  experiments,
  jobs,
  judgmentQuestions,
  landingPages,
  loginLinks,
  marketBriefs,
  previewComments,
  productBriefs,
  productInsights,
  products,
  revisionRequests,
  rules,
  settings,
  skillBindings,
  uploads,
  users,
} from "./schema";

const TODAY = "2026-10-07";

function daysAgo(n: number) {
  const d = new Date(`${TODAY}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

async function reset() {
  await rawSql.unsafe(`
    TRUNCATE TABLE
      preview_comments, revision_requests, skill_bindings, agent_skill_versions, agent_skills,
      audit_log, ai_usage, chat_messages, telegram_updates, jobs, action_log, approvals, analyses,
      judgments, judgment_questions, competitor_ads, competitors, experiment_arms, experiments,
      ad_insights, ads, ad_sets, campaigns, creative_assets, creatives, landing_pages, uploads,
      angles, audience_profiles, market_briefs, product_insights, product_briefs, products,
      login_links, rules, settings, users
    RESTART IDENTITY CASCADE;
  `);
}

async function main() {
  await reset();

  /* ---------------- Pengguna & pengaturan ---------------- */
  const [owner, admin] = await db
    .insert(users)
    .values([
      { telegramUserId: 1001, telegramChatId: 1001, name: "Pemilik", role: "owner" },
      { telegramUserId: 1002, telegramChatId: 1002, name: "Rani", role: "admin" },
    ])
    .returning();

  const productRows = await db
    .insert(products)
    .values([
      { name: "Serum Vitamin C", slug: "serum-vitamin-c", kind: "online_physical", origin: "research", status: "selected", score: "4.20", confidence: "0.880", selectedAt: new Date(), createdBy: owner.id, context: { margin_min_pct: 55, modal_idr: 15_000_000, lokasi: "Nasional" } },
      { name: "Blender Portable 4-in-1", slug: "blender-portable", kind: "online_physical", origin: "research", status: "candidate", score: "3.60", confidence: "0.810", createdBy: owner.id },
      { name: "Kue Kering Premium", slug: "kue-kering-premium", kind: "offline_service", origin: "research", status: "candidate", score: "3.60", confidence: "0.760", createdBy: owner.id },
      { name: "Alat Rumah Multifungsi", slug: "alat-rumah-multifungsi", kind: "online_physical", origin: "research", status: "candidate", score: "3.20", confidence: "0.690", createdBy: owner.id },
    ])
    .returning();

  const serum = productRows[0];

  await db.insert(settings).values([
    { key: "kill_switch_active", value: false, updatedBy: owner.id },
    { key: "target_cpa", value: 60_000, updatedBy: owner.id },
    { key: "target_roas", value: 3.0, updatedBy: owner.id },
    { key: "daily_spend_cap", value: 2_000_000, updatedBy: owner.id },
    { key: "active_product_id", value: serum.id, updatedBy: owner.id },
    { key: "operating_mode", value: "suggest_approve", updatedBy: owner.id },
    { key: "ai_daily_cap", value: 800, updatedBy: owner.id },
    { key: "ai_monthly_cap_idr", value: 1_500_000, updatedBy: owner.id },
  ]);

  await db.insert(rules).values([
    { key: "hard_caps", params: { maxDailyBudgetPerAd: 500_000, maxDailySpendTotal: 2_000_000, maxStepPct: 20, minGapHours: 48 }, updatedBy: owner.id },
    { key: "scale", params: { cpaDaysBelowTarget: 4, maxStepPct: 20, minResults: 30, minGapHours: 48 }, updatedBy: owner.id },
    { key: "pause", params: { cpaMultiplier: 1.5, spendWithoutResultMultiplier: 2 }, updatedBy: owner.id },
    { key: "fatigue", params: { frequencyThreshold: 3.0, ctrDropPct: 15 }, updatedBy: owner.id },
    { key: "new_creative", params: { triggers: ["fatigue", "high_cpa", "ab_winner", "weekly_batch"], weeklyBatchDay: "monday" }, updatedBy: owner.id },
  ]);

  await db.insert(judgmentQuestions).values([
    { key: "product_demand", appliesTo: "product", prompt: "Seberapa besar permintaan pasar?", answerType: "ordinal", options: ["rendah", "sedang", "tinggi"], threshold: "0.800" },
    { key: "product_competition", appliesTo: "product", prompt: "Seberapa ramai persaingan?", answerType: "ordinal", options: ["rendah", "sedang", "tinggi"], threshold: "0.800" },
    { key: "product_margin", appliesTo: "product", prompt: "Bagaimana marginnya?", answerType: "ordinal", options: ["rendah", "sedang", "tinggi"], threshold: "0.800" },
    { key: "product_ads_ease", appliesTo: "product", prompt: "Mudah diiklankan?", answerType: "ordinal", options: ["rendah", "sedang", "tinggi"], threshold: "0.800" },
    { key: "product_owner_fit", appliesTo: "product", prompt: "Cocok dengan kemampuan pemilik?", answerType: "ordinal", options: ["rendah", "sedang", "tinggi"], threshold: "0.800" },
    { key: "insight_brief_support", appliesTo: "product_insight", prompt: "Apakah insight didukung brief?", answerType: "choice", options: ["ya", "sebagian", "tidak"], threshold: "0.800" },
    { key: "insight_claim_risk", appliesTo: "product_insight", prompt: "Risiko klaim?", answerType: "choice", options: ["rendah", "sedang", "tinggi"], threshold: "0.800" },
    { key: "insight_strength", appliesTo: "product_insight", prompt: "Kekuatan sebagai alasan membeli?", answerType: "choice", options: ["rendah", "sedang", "tinggi"], threshold: "0.800" },
    { key: "creative_fatigue", appliesTo: "creative", prompt: "Apakah creative jenuh?", answerType: "boolean", options: ["ya", "tidak"], threshold: "0.800" },
    { key: "creative_claim_risk", appliesTo: "creative", prompt: "Risiko klaim copy?", answerType: "choice", options: ["rendah", "sedang", "tinggi"], threshold: "0.800" },
    { key: "competitor_angle", appliesTo: "competitor_ad", prompt: "Angle utama iklan kompetitor?", answerType: "choice", options: ["bukti", "harga", "emosi", "sebelum-sesudah"], threshold: "0.800" },
    { key: "comment_sentiment", appliesTo: "comment", prompt: "Sentimen komentar?", answerType: "choice", options: ["positif", "netral", "negatif"], threshold: "0.800" },
  ]);

  /* ---------------- Skill agent ---------------- */
  const skillDefs = [
    ["market_researcher", "Riset Pasar", "main", 4],
    ["product_analyst", "Analisa Insight Produk", "main", 3],
    ["audience_analyst", "Riset Audiens", "main", 2],
    ["landing_page_builder", "Pembuat Landing Page", "main", 5],
    ["ad_copywriter", "Penulis Copy Iklan", "main", 4],
    ["creative_director", "Arahan Visual & Video", "main", 2],
    ["ads_analyst", "Analis Iklan", "main", 3],
    ["competitor_analyst", "Analis Kompetitor", "light", 1],
    ["creative_reviser", "Revisi dari Komentar", "main", 2],
  ] as const;

  const skills = await db
    .insert(agentSkills)
    .values(
      skillDefs.map(([key, name, tier, version]) => ({
        key,
        name,
        description: `Skill ${name} v${version}`,
        modelTier: tier,
        status: version === 1 ? ("draft" as const) : ("active" as const),
        outputSchema: { type: "object" },
        createdBy: owner.id,
      })),
    )
    .returning();

  for (const skill of skills) {
    const def = skillDefs.find(([key]) => key === skill.key)!;
    const versions = await db
      .insert(agentSkillVersions)
      .values(
        Array.from({ length: def[3] }, (_, index) => ({
          skillId: skill.id,
          version: index + 1,
          instructionsMd: `Kamu adalah ${skill.name}. Ikuti aturan kejujuran: jangan mengarang fakta.`,
          examples: { good: "Contoh keluaran baik", bad: "Contoh keluaran buruk" },
          resources: [],
          changeNote: index === 0 ? "Templat awal" : `Perbaikan v${index + 1}`,
          createdBy: owner.id,
        })),
      )
      .returning();
    const active = versions[versions.length - 1];
    await db.update(agentSkills).set({ activeVersionId: active.id }).where(eq(agentSkills.id, skill.id));
  }

  await db.insert(skillBindings).values([
    { workflowKey: "research", stepKey: "market_brief", skillId: skills[0].id },
    { workflowKey: "insight", stepKey: "product_analysis", skillId: skills[1].id },
    { workflowKey: "audience", stepKey: "persona", skillId: skills[2].id },
    { workflowKey: "landing_page", stepKey: "build_html", skillId: skills[3].id },
    { workflowKey: "creative_pack", stepKey: "copywriting", skillId: skills[4].id },
    { workflowKey: "creative_pack", stepKey: "visual_direction", skillId: skills[5].id },
    { workflowKey: "daily_report", stepKey: "analysis", skillId: skills[6].id },
    { workflowKey: "competitor", stepKey: "market_map", skillId: skills[7].id },
    { workflowKey: "revision", stepKey: "apply_comments", skillId: skills[8].id },
  ]);

  /* ---------------- Brief, insight, market brief ---------------- */
  const [brief] = await db
    .insert(productBriefs)
    .values({
      productId: serum.id,
      version: 1,
      mode: "quick",
      description: "Serum vitamin C 15% dengan tekstur ringan untuk kulit berminyak.",
      priceInfo: { price_idr: 129_000, variant: "30 ml" },
      ownerStrengths: "Kandungan terbuka, tekstur ringan, kemasan praktis.",
      targetBuyer: "Perempuan 20–35 tahun, kulit berminyak.",
      problemsSolved: "Kulit cepat kusam dan produk terasa lengket.",
      proof: { testimonial: 1, label_kemasan: 1 },
      offerGuarantee: "Garansi 30 hari.",
      orderChannel: "WhatsApp",
      toneNotes: "Ramah dan santai.",
      status: "submitted",
      createdBy: owner.id,
      clarifications: [
        { question: "Apakah ada hasil uji lab atau sertifikasi?", answer: null },
        { question: "Satu botol cukup untuk berapa lama?", answer: "Sekitar satu bulan, pemakaian dua kali sehari." },
      ],
    })
    .returning();

  await db.insert(productInsights).values([
    { productId: serum.id, briefId: brief.id, kind: "strength", strengthType: "feature", statement: "Kandungan vitamin C stabil 15% per pemakaian", detail: "Jenis: fitur · Bukti: ada", basis: "from_brief", proofStatus: "verified", claimRisk: "low", priority: 1, confidence: "0.910", status: "confirmed" },
    { productId: serum.id, briefId: brief.id, kind: "strength", strengthType: "benefit", statement: "Tekstur ringan dan tidak lengket", detail: "Jenis: manfaat · Bukti: foto tekstur", basis: "from_brief", proofStatus: "verified", claimRisk: "low", priority: 2, confidence: "0.880", status: "confirmed" },
    { productId: serum.id, briefId: brief.id, kind: "strength", strengthType: "feature", statement: "Kemasan 30 ml praktis", detail: "Jenis: fitur", basis: "from_brief", proofStatus: "verified", claimRisk: "low", priority: 3, confidence: "0.860", status: "confirmed" },
    { productId: serum.id, briefId: brief.id, kind: "strength", strengthType: "differentiator", statement: "Harga lebih rendah daripada kompetitor sejenis", detail: "Perlu data harga pembanding.", basis: "ai_inference", proofStatus: "needs_proof", claimRisk: "medium", priority: 4, confidence: "0.640", status: "draft" },
    { productId: serum.id, briefId: brief.id, kind: "pain_point", intensity: "high", statement: "Kulit berminyak cepat kusam di tengah hari", detail: 'Frasa audiens: "berapa lama tahan?"', basis: "ai_inference", proofStatus: "needs_proof", claimRisk: "medium", priority: 1, confidence: "0.720", status: "confirmed", audiencePhrases: ["berapa lama tahan?", "jam 3 sudah kusam"] },
    { productId: serum.id, briefId: brief.id, kind: "pain_point", intensity: "high", statement: "Takut produk tidak cocok dan memicu breakout", detail: "Klaim kesehatan.", basis: "from_brief", proofStatus: "needs_proof", claimRisk: "high", priority: 2, confidence: "0.780", status: "needs_review" },
    { productId: serum.id, briefId: brief.id, kind: "objection", intensity: "medium", statement: "Bingung memilih di antara banyak merek", detail: 'Frasa audiens: "bedanya apa?"', basis: "ai_inference", proofStatus: "needs_proof", claimRisk: "low", priority: 3, confidence: "0.700", status: "draft" },
  ]);

  await db.insert(marketBriefs).values({
    productId: serum.id,
    version: 1,
    demandSummary: "Permintaan stabil dan berulang; ulasan menyebut tekstur ringan.",
    priceMin: 89_000,
    priceMax: 159_000,
    competitors: [
      { brand: "Glowlab", angle: "Bukti dermatolog", offer: "Bundling 2 botol", days_running: 84 },
      { brand: "Skin+", angle: "Harga termurah", offer: "Gratis ongkir", days_running: 41 },
      { brand: "Dermaclear", angle: "Sebelum–sesudah", offer: "Garansi 30 hari", days_running: 27 },
      { brand: "Naturé", angle: "Bahan alami", offer: "Cashback", days_running: 19 },
    ],
    gaps: "Bukti bahan dan testimoni kulit berminyak masih kosong.",
    risks: "Klaim kesehatan berisiko ditolak Meta.",
    validationPlan: "Tes budget Rp 500.000 selama 3 hari.",
    sources: [
      { name: "Tren pencarian kategori skincare", date: "2026-10-05" },
      { name: "Penjual teratas marketplace", date: "2026-10-05" },
      { name: "Snapshot iklan kompetitor", date: "2026-10-04" },
    ],
    contentMd: "# Market Brief — Serum Vitamin C",
  });

  /* ---------------- Audiens & angle ---------------- */
  const audiences = await db
    .insert(audienceProfiles)
    .values([
      { productId: serum.id, name: "Rani · 27", description: "Staf kantor di Jakarta, kulit berminyak.", pains: ["Wajah cepat kusam", "Terasa lengket"], objections: ["Takut memicu jerawat"], languageNotes: 'gerah, kusam, berat, nyaman', targetingSuggestion: { lokasi: "Jabodetabek", usia: "20–35" }, status: "approved" },
      { productId: serum.id, name: "Dewi · 31", description: "Ibu bekerja, aktif di luar ruangan.", pains: ["Sulit cari produk yang jelas kandungannya"], objections: ["Ragu tanpa bukti sertifikasi"], languageNotes: "aman, isi, jelas", targetingSuggestion: { lokasi: "Kota besar", usia: "25–40" }, status: "approved" },
      { productId: serum.id, name: "Mahasiswa · 21", description: "Budget terbatas, banyak mencari review.", pains: ["Takut salah beli"], objections: ["Harga", "Pengiriman"], languageNotes: "worth it, murce", targetingSuggestion: { lokasi: "Nasional", usia: "18–24" }, status: "draft" },
    ])
    .returning();

  const angleRows = await db
    .insert(angles)
    .values([
      { productId: serum.id, audienceId: audiences[0].id, name: "Bukti bahan", code: "A1", description: "Menjelaskan kandungan dengan visual produk asli.", hookExamples: ['"Kulit berminyak bukan berarti harus kusam."'], origin: "competitor_gap", status: "winning" },
      { productId: serum.id, audienceId: audiences[0].id, name: "Kusam siang", code: "A2", description: "Menyoroti kulit cepat kusam.", hookExamples: ['"Jam 3 sore, wajahmu masih segar?"'], origin: "research", status: "testing" },
      { productId: serum.id, audienceId: audiences[2].id, name: "Hemat", code: "A3", description: "Menekankan nilai dan garansi.", hookExamples: ['"Satu botol cukup sebulan."'], origin: "manual", status: "testing" },
      { productId: serum.id, audienceId: audiences[1].id, name: "Rutinitas pagi", code: "A4", description: "Cara pakai pagi hari.", hookExamples: ['"Dua tetes sebelum beraktivitas."'], origin: "manual", status: "idea" },
    ])
    .returning();

  const [a1] = angleRows;

  /* ---------------- Berkas ---------------- */
  const bucketName = process.env.S3_BUCKET ?? "aimb-media";
  const [uploadHtml, uploadImg] = await db
    .insert(uploads)
    .values([
      { kind: "landing_page", bucket: bucketName, storagePath: "landing/contoh-garansi-30-hari.html", mimeType: "text/html; charset=utf-8", sizeBytes: 0, createdBy: owner.id },
      { kind: "asset", bucket: bucketName, storagePath: "creative/contoh-hook1.png", mimeType: "image/png", sizeBytes: 0, createdBy: owner.id },
    ])
    .returning();

  /* ---------------- Landing page ---------------- */
  const landingRows = await db
    .insert(landingPages)
    .values([
      { productId: serum.id, angleId: a1.id, version: 1, title: "Bukti bahan (live)", insightIds: [], sizeKb: 86, status: "deployed", precheck: { message_match: 0.9, risky_claims: [] }, blocks: [{ id: "headline", type: "hero" }], createdBy: owner.id },
      { productId: serum.id, angleId: angleRows[1].id, version: 2, title: "Kusam siang hari", insightIds: [], sizeKb: 79, status: "draft", precheck: { message_match: 0.81 }, createdBy: owner.id },
      { productId: serum.id, angleId: a1.id, version: 3, title: "Garansi 30 hari", insightIds: [], sizeKb: 84, status: "approved", precheck: { message_match: 0.92, risky_claims: [] }, fileUploadId: uploadHtml.id, createdBy: owner.id },
      { productId: serum.id, angleId: angleRows[2].id, version: 1, title: "Hemat sebulan", insightIds: [], sizeKb: 72, status: "draft", precheck: { message_match: 0.74 }, createdBy: owner.id },
    ])
    .returning();

  const garansi = landingRows[2];

  /* ---------------- Creative ---------------- */
  const creativeValues: (typeof creatives.$inferInsert)[] = [
    { productId: serum.id, angleId: a1.id, name: "SerumVC_Bukti_Hook1_v1", format: "image", primaryText: "Kulit berminyak bukan berarti harus kusam.", headline: "Kulit segar sampai sore", description: "Serum vitamin C 15%, tekstur ringan.", cta: "Pesan sekarang", landingPageId: garansi.id, status: "approved", precheck: { claim_risk: "low", hook_score: 82 } },
    { productId: serum.id, angleId: a1.id, name: "SerumVC_Bukti_Video_v1", format: "video", primaryText: "Vitamin C 15% dengan tekstur ringan.", headline: "Kulit segar sampai sore", description: "Dipakai pagi dan malam.", cta: "Pesan sekarang", landingPageId: garansi.id, status: "in_use", precheck: { claim_risk: "low", hook_score: 85 } },
    { productId: serum.id, angleId: angleRows[1].id, name: "SerumVC_Kusam_Hook3_v1", format: "image", primaryText: "Jam 3 sore, wajahmu masih segar?", headline: "Tahan kusam seharian", description: "Tekstur ringan tanpa rasa lengket.", cta: "Coba sekarang", status: "draft", precheck: { claim_risk: "medium", hook_score: 74 } },
    { productId: serum.id, angleId: angleRows[1].id, name: "SerumVC_Kusam_Video_v1", format: "video", primaryText: "Wajah kusam di tengah hari?", headline: "Segar lebih lama", description: "Cepat menyerap.", cta: "Coba sekarang", status: "draft", precheck: { claim_risk: "medium", hook_score: 70 } },
    { productId: serum.id, angleId: angleRows[2].id, name: "SerumVC_Hemat_Offer_v1", format: "carousel", primaryText: "Satu botol cukup sebulan.", headline: "Hemat, tanpa isi ulang", description: "Garansi 30 hari.", cta: "Pesan sekarang", status: "approved", precheck: { claim_risk: "low", hook_score: 68 } },
    { productId: serum.id, angleId: a1.id, name: "SerumVC_Bukti_Hook4_v1", format: "image", primaryText: "Kandungan kami tulis terbuka.", headline: "Vitamin C 15%", description: "Bahan dijelaskan terbuka.", cta: "Pesan sekarang", status: "fatigued", precheck: { claim_risk: "low", hook_score: 60 } },
  ];

  const creativeRows = await db.insert(creatives).values(creativeValues).returning();

  await db.insert(creativeAssets).values([
    { creativeId: creativeRows[0].id, kind: "image", source: "uploaded", uploadId: uploadImg.id, aspectRatio: "4:5" },
    { creativeId: creativeRows[1].id, kind: "video", source: "ai_generated", aspectRatio: "9:16", durationSec: 15, provider: "contoh-provider", prompt: "Latar bersih, produk asli" },
    { creativeId: creativeRows[4].id, kind: "image", source: "uploaded", aspectRatio: "1:1" },
  ]);

  /* ---------------- Kampanye, ad set, iklan, data ---------------- */
  const [campaign] = await db
    .insert(campaigns)
    .values({ productId: serum.id, name: "Serum Vitamin C — Konversi", objective: "Konversi pembelian", status: "active", metaStatus: "ACTIVE", metaCampaignId: "sim_campaign_1" })
    .returning();

  const adSetRows = await db
    .insert(adSets)
    .values([
      { campaignId: campaign.id, name: "Uji Bukti Sosial-A", variable: "Angle · bukti bahan", dailyBudget: 180_000, optimizationGoal: "offsite_conversion", status: "active", metaStatus: "ACTIVE", metaAdsetId: "sim_adset_1" },
      { campaignId: campaign.id, name: "Uji Bukti Sosial-B", variable: "Angle · bukti bahan", dailyBudget: 150_000, optimizationGoal: "offsite_conversion", status: "active", metaStatus: "ACTIVE", metaAdsetId: "sim_adset_2" },
      { campaignId: campaign.id, name: "Uji Kusam Siang-A", variable: "Angle · kusam siang", dailyBudget: 120_000, optimizationGoal: "offsite_conversion", status: "paused", metaStatus: "PAUSED", metaAdsetId: "sim_adset_3" },
      { campaignId: campaign.id, name: "Uji Penawaran-A", variable: "Penawaran · gratis ongkir", dailyBudget: 96_000, optimizationGoal: "offsite_conversion", status: "active", metaStatus: "ACTIVE", metaAdsetId: "sim_adset_4" },
    ])
    .returning();

  const adRows = await db
    .insert(ads)
    .values(
      adSetRows.flatMap((set, index) => [
        {
          adSetId: set.id,
          creativeId: creativeRows[index].id,
          angleId: creativeRows[index].angleId,
          name: `${set.name}-Ad1`,
          status: set.status,
          metaStatus: set.metaStatus,
          metaAdId: `sim_ad_${index}_1`,
        },
      ]),
    )
    .returning();

  const insertStats: (typeof adInsights.$inferInsert)[] = [];
  adRows.forEach((ad, adIndex) => {
    const spendBase = [2_300_000, 2_100_000, 1_500_000, 900_000][adIndex] ?? 1_000_000;
    const resultsBase = [32, 26, 12, 5][adIndex] ?? 10;
    for (let day = 0; day < 7; day += 1) {
      const factor = 1 - day * 0.05;
      const spend = Math.round((spendBase / 7) * factor);
      const results = Math.max(1, Math.round((resultsBase / 7) * factor));
      insertStats.push({
        adId: ad.id,
        date: daysAgo(6 - day),
        granularity: "daily",
        spend,
        impressions: Math.round(spend * 18),
        reach: Math.round(spend * 12),
        linkClicks: Math.round(spend / 120),
        results,
        resultValue: results * 175_000,
        frequency: (2.1 + day * 0.2).toFixed(3),
      });
    }
  });
  await db.insert(adInsights).values(insertStats);

  /* ---------------- Eksperimen ---------------- */
  const experimentRows = await db
    .insert(experiments)
    .values([
      { productId: serum.id, name: "Angle: bukti sosial vs masalah-solusi", variable: "angle", hypothesis: "Angle bukti sosial menurunkan CPA", primaryMetric: "cpa", minDataRule: { min_results: 30 }, winRule: { metric: "cpa", lower_is_better: true, min_diff_pct: 15 }, totalBudget: 1_200_000, startDate: daysAgo(6), status: "running" },
      { productId: serum.id, name: "Visual: foto asli vs latar AI", variable: "visual", hypothesis: "Foto asli menaikkan CTR", primaryMetric: "ctr", minDataRule: { min_results: 30 }, winRule: { metric: "ctr", min_diff_pct: 15 }, totalBudget: 1_000_000, startDate: daysAgo(14), endDate: daysAgo(2), status: "concluded" },
      { productId: serum.id, name: "Penawaran: gratis ongkir vs bundling", variable: "offer", hypothesis: "Bundling menaikkan ROAS", primaryMetric: "roas", minDataRule: { min_results: 30 }, winRule: { metric: "roas", min_diff_pct: 15 }, totalBudget: 1_200_000, status: "planned" },
    ])
    .returning();

  await db.insert(experimentArms).values([
    { experimentId: experimentRows[0].id, label: "A", adSetId: adSetRows[0].id, angleId: a1.id, creativeId: creativeRows[0].id, note: "Masalah–solusi" },
    { experimentId: experimentRows[0].id, label: "B", adSetId: adSetRows[1].id, angleId: a1.id, creativeId: creativeRows[1].id, note: "Bukti sosial" },
    { experimentId: experimentRows[1].id, label: "A", adSetId: adSetRows[0].id, creativeId: creativeRows[0].id, note: "Foto asli" },
    { experimentId: experimentRows[1].id, label: "B", adSetId: adSetRows[1].id, creativeId: creativeRows[1].id, note: "Latar AI" },
  ]);

  /* ---------------- Kompetitor ---------------- */
  const competitorRows = await db
    .insert(competitors)
    .values([
      { productId: serum.id, name: "Glowlab", source: "manual" },
      { productId: serum.id, name: "Skin+", source: "manual" },
      { productId: serum.id, name: "Dermaclear", source: "manual" },
      { productId: serum.id, name: "Naturé", source: "provider" },
    ])
    .returning();

  await db.insert(competitorAds).values([
    { competitorId: competitorRows[0].id, snapshotDate: TODAY, firstSeenDate: daysAgo(84), lastSeenDate: TODAY, primaryText: "Dijamin dokter.", headline: "Bukti dermatolog", cta: "Belanja", format: "video", daysRunning: 84, labels: { angle: "bukti", hook_type: "otoritas", offer: "bundling", funnel: "pertimbangan" } },
    { competitorId: competitorRows[1].id, snapshotDate: TODAY, firstSeenDate: daysAgo(41), lastSeenDate: TODAY, primaryText: "Paling murah.", headline: "Harga termurah", cta: "Belanja", format: "image", daysRunning: 41, labels: { angle: "harga", hook_type: "harga", offer: "gratis_ongkir", funnel: "bawah" } },
    { competitorId: competitorRows[2].id, snapshotDate: TODAY, firstSeenDate: daysAgo(27), lastSeenDate: TODAY, primaryText: "Hasil 7 hari.", headline: "Sebelum–sesudah", cta: "Belanja", format: "carousel", daysRunning: 27, labels: { angle: "sebelum-sesudah", hook_type: "hasil", offer: "garansi", funnel: "tengah" } },
    { competitorId: competitorRows[3].id, snapshotDate: TODAY, firstSeenDate: daysAgo(19), lastSeenDate: TODAY, primaryText: "100% alami.", headline: "Bahan alami", cta: "Belanja", format: "image", daysRunning: 19, labels: { angle: "emosi", hook_type: "alami", offer: "cashback", funnel: "atas" } },
  ]);

  /* ---------------- Analisa, approval, aksi, pekerjaan ---------------- */
  await db.insert(analyses).values([
    { kind: "daily_report", periodStart: TODAY, periodEnd: TODAY, contentMd: "Belanja turun 4,2%, hasil naik 6,4%.", facts: ["CPA Rp 53.725", "Angle bukti bahan menyumbang 46% hasil"], hypotheses: ["Message match landing page memperbaiki hasil"], recommendations: ["Uji varian baru untuk angle hemat"] },
    { kind: "competitor_map", periodStart: daysAgo(7), periodEnd: TODAY, contentMd: "Angle sebelum–sesudah jenuh; bukti bahan masih kosong.", facts: ["4 kompetitor dipantau"], hypotheses: ["Celah bukti bahan masih terbuka"], recommendations: ["Buat brief angle bukti bahan"] },
  ]);

  await db.insert(approvals).values([
    { kind: "scale", subjectType: "ad_sets", subjectId: adSetRows[1].id, title: 'Naikkan budget ad set "Uji Bukti Sosial-B"', summary: "Rp 150.000 → Rp 180.000 (+20%)", reasons: ["CPA di bawah target 4 hari berturut-turut", "38 hasil (minimum 30) · tracking sehat", "Batas keras lolos"], payload: { current_daily_budget: 150_000, proposed_daily_budget: 180_000, change_pct: 20, idempotency_key: `scale:${adSetRows[1].id}:${TODAY}`, mode: "suggest_approve" }, expiresAt: new Date(Date.now() + 46 * 3_600_000) },
    { kind: "pause", subjectType: "ad_sets", subjectId: adSetRows[3].id, title: 'Jeda ad set "Uji Penawaran-A"', summary: "CPA Rp 96.400 (di atas 1,5× target) dengan data cukup", reasons: ["CPA melewati ambang 1,5× target", "Belanja Rp 480.000 tanpa hasil"] },
    { kind: "landing_page", subjectType: "landing_pages", subjectId: garansi.id, title: 'Landing page "Garansi 30 hari"', summary: "Angle bukti bahan · pra-cek lulus · kecocokan pesan 92%", reasons: ["4 insight terkonfirmasi", "Ukuran 84 KB"] },
    { kind: "creative_pack", subjectType: "creatives", subjectId: creativeRows[4].id, title: 'Paket creative "Angle Bukti Sosial"', summary: "3 varian copy dan 4 visual", reasons: ["Risiko klaim rendah", "Skor hook 82"] },
    { kind: "product", subjectType: "products", subjectId: serum.id, title: 'Pilih produk "Serum Vitamin C"', summary: "Skor kandidat 4,2/5", reasons: ["Permintaan tinggi, margin 62%"] },
    { kind: "audience", subjectType: "audience_profiles", subjectId: audiences[0].id, title: "Profil audiens dan bank hook", summary: "3 persona · 12 hook awal · 4 angle", reasons: ["Bahasa audiens sudah diringkas"] },
  ]);

  await db.insert(actionLog).values([
    { action: "set_budget", targetType: "ad_sets", targetId: adSetRows[1].id, metaObjectId: "sim_adset_2", request: { daily_budget: 180_000 }, response: { ok: true }, idempotencyKey: `scale:${adSetRows[1].id}:2026-10-07`, mode: "manual_approved", status: "confirmed" },
    { action: "pause_ad", targetType: "ad_sets", targetId: adSetRows[3].id, metaObjectId: "sim_adset_4", request: { status: "PAUSED" }, response: { ok: true }, idempotencyKey: `pause:${adSetRows[3].id}:2026-10-07`, mode: "manual_approved", status: "confirmed" },
    { action: "create_ad", targetType: "campaigns", targetId: campaign.id, metaObjectId: "sim_campaign_1", request: { status: "PAUSED" }, response: { status: "PAUSED" }, idempotencyKey: `create:${campaign.id}:2026-10-07`, mode: "manual_approved", status: "sent" },
    { action: "set_budget", targetType: "ad_sets", targetId: adSetRows[2].id, request: { daily_budget: 130_000 }, response: { error: "kill_switch_active" }, idempotencyKey: `scale:${adSetRows[2].id}:2026-10-06`, mode: "auto", status: "failed" },
  ]);

  await db.insert(jobs).values([
    { workflowKey: "daily_loop", trigger: "cron", status: "succeeded", input: {}, output: {}, startedAt: new Date(), finishedAt: new Date() },
    { workflowKey: "creative_pack", trigger: "user", status: "succeeded", input: {}, output: {} },
    { workflowKey: "weekly_report", trigger: "cron", status: "succeeded", input: {}, output: {} },
    { workflowKey: "sync_insights", trigger: "cron", status: "failed", input: {}, error: "Rate limit Meta; diulang dengan backoff.", output: {} },
  ]);

  await db.insert(aiUsage).values([
    { userId: owner.id, provider: "claude", purpose: "market_brief", model: "claude-sonnet", inputTokens: 3_200, outputTokens: 1_100, costIdr: 42_000 },
    { userId: owner.id, provider: "jev", purpose: "judge", model: "jev", inputTokens: 480, outputTokens: 60, costIdr: 3_500 },
    { userId: owner.id, provider: "image", purpose: "creative_visual", model: "image-provider", costIdr: 25_000 },
  ]);

  await db.insert(auditLog).values([
    { userId: owner.id, action: "approve", entityType: "approvals", entityId: null, before: { status: "pending" }, after: { status: "approved" } },
    { userId: admin.id, action: "update", entityType: "product_insights", entityId: null, before: { proof_status: "needs_proof" }, after: { proof_status: "verified" } },
    { userId: owner.id, action: "update", entityType: "rules", entityId: null, before: { threshold: 1.4 }, after: { threshold: 1.5 } },
    { userId: null, action: "kill", entityType: "settings", entityId: null, before: { kill_switch_active: false }, after: { kill_switch_active: true } },
  ]);

  const [revision] = await db
    .insert(revisionRequests)
    .values({ subjectType: "landing_page", baseId: garansi.id, status: "succeeded", commentCount: 1, requestedBy: owner.id })
    .returning();

  await db.insert(previewComments).values({
    subjectType: "landing_page",
    subjectId: garansi.id,
    kind: "change",
    anchorType: "block",
    anchor: { blockId: "headline" },
    anchorSnapshot: "Kulit berminyak bukan berarti harus kusam",
    body: "Judul kurang menonjolkan garansi",
    status: "resolved",
    revisionRequestId: revision.id,
    agentResponse: "Dilakukan pada versi 4.",
    createdBy: owner.id,
  });

  /* ---------------- Tautan masuk contoh ---------------- */
  const token = randomBytes(32).toString("base64url");
  await db.insert(loginLinks).values({
    userId: owner.id,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + 30 * 60_000),
  });

  console.log("Seed selesai.");
  console.log(`Tautan masuk contoh (berlaku 30 menit):`);
  console.log(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/link?token=${token}`);
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await rawSql.end({ timeout: 5 });
  });
