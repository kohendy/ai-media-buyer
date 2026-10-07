import {
  bigint,
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Enum                                                                */
/* ------------------------------------------------------------------ */

export const roleEnum = pgEnum("role", ["owner", "admin"]);
export const productKindEnum = pgEnum("product_kind", ["online_physical", "digital", "offline_service", "other"]);
export const productOriginEnum = pgEnum("product_origin", ["research", "manual_brief"]);
export const productStatusEnum = pgEnum("product_status", ["candidate", "selected", "rejected", "archived"]);
export const briefModeEnum = pgEnum("brief_mode", ["quick", "full", "free_text"]);
export const briefStatusEnum = pgEnum("brief_status", ["draft", "submitted", "superseded"]);
export const insightKindEnum = pgEnum("insight_kind", ["strength", "pain_point", "objection"]);
export const strengthTypeEnum = pgEnum("strength_type", ["feature", "benefit", "emotional", "differentiator"]);
export const insightBasisEnum = pgEnum("insight_basis", ["from_brief", "from_research", "ai_inference", "user_added"]);
export const proofStatusEnum = pgEnum("proof_status", ["verified", "needs_proof", "unverifiable"]);
export const claimRiskEnum = pgEnum("claim_risk", ["low", "medium", "high"]);
export const intensityEnum = pgEnum("intensity", ["low", "medium", "high"]);
export const insightStatusEnum = pgEnum("insight_status", ["draft", "confirmed", "rejected", "needs_review"]);
export const audienceStatusEnum = pgEnum("audience_status", ["draft", "approved", "retired"]);
export const angleOriginEnum = pgEnum("angle_origin", ["research", "competitor_gap", "winner_variation", "manual"]);
export const angleStatusEnum = pgEnum("angle_status", ["idea", "testing", "winning", "saturated", "retired"]);
export const landingStatusEnum = pgEnum("landing_status", ["draft", "in_review", "approved", "deployed", "retired"]);
export const creativeFormatEnum = pgEnum("creative_format", ["image", "video", "carousel"]);
export const creativeStatusEnum = pgEnum("creative_status", ["draft", "in_review", "approved", "in_use", "fatigued", "retired"]);
export const assetKindEnum = pgEnum("asset_kind", ["image", "video", "thumbnail"]);
export const assetSourceEnum = pgEnum("asset_source", ["ai_generated", "uploaded"]);
export const campaignStatusEnum = pgEnum("campaign_status", [
  "draft",
  "awaiting_approval",
  "ready",
  "active",
  "paused",
  "rejected_by_meta",
  "archived",
]);
export const granularityEnum = pgEnum("granularity", ["hourly", "daily"]);
export const experimentVariableEnum = pgEnum("experiment_variable", ["angle", "visual", "offer", "audience", "landing_page"]);
export const experimentStatusEnum = pgEnum("experiment_status", ["planned", "running", "concluded", "inconclusive", "cancelled"]);
export const competitorSourceEnum = pgEnum("competitor_source", ["manual", "provider"]);
export const competitorAdFormatEnum = pgEnum("competitor_ad_format", ["image", "video", "carousel", "unknown"]);
export const judgmentAnswerTypeEnum = pgEnum("judgment_answer_type", ["choice", "ordinal", "boolean"]);
export const judgmentAppliesToEnum = pgEnum("judgment_applies_to", [
  "ad",
  "creative",
  "landing_page",
  "competitor_ad",
  "comment",
  "product",
  "product_insight",
]);
export const analysisKindEnum = pgEnum("analysis_kind", [
  "daily_report",
  "weekly_report",
  "experiment_review",
  "competitor_map",
  "creative_brief",
]);
export const ruleModeEnum = pgEnum("rule_mode", ["suggest_approve", "auto"]);
export const approvalKindEnum = pgEnum("approval_kind", [
  "product",
  "audience",
  "landing_page",
  "creative_pack",
  "launch",
  "scale",
  "pause",
  "new_creative",
  "experiment_winner",
]);
export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "revision",
  "expired",
  "executed",
  "failed",
]);
export const actionModeEnum = pgEnum("action_mode", ["manual_approved", "auto"]);
export const actionStatusEnum = pgEnum("action_status", ["sent", "confirmed", "failed"]);
export const jobTriggerEnum = pgEnum("job_trigger", ["cron", "user", "system"]);
export const jobStatusEnum = pgEnum("job_status", ["queued", "running", "succeeded", "failed"]);
export const uploadKindEnum = pgEnum("upload_kind", ["asset", "landing_page", "screenshot", "document", "export"]);
export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);
export const aiProviderEnum = pgEnum("ai_provider", ["claude", "jev", "image", "video"]);
export const auditActionEnum = pgEnum("audit_action", ["create", "update", "delete", "approve", "reject", "kill", "resume"]);
export const commentSubjectEnum = pgEnum("comment_subject", ["landing_page", "creative"]);
export const commentKindEnum = pgEnum("comment_kind", ["change", "replace_text", "question"]);
export const anchorTypeEnum = pgEnum("anchor_type", ["block", "text_range", "image_area", "video_time", "general"]);
export const commentStatusEnum = pgEnum("comment_status", [
  "open",
  "queued",
  "in_revision",
  "resolved",
  "disputed",
  "dismissed",
]);
export const revisionSubjectEnum = pgEnum("revision_subject", ["landing_page", "creative"]);
export const revisionStatusEnum = pgEnum("revision_status", ["queued", "running", "succeeded", "failed"]);
export const skillModelTierEnum = pgEnum("skill_model_tier", ["main", "light"]);
export const skillStatusEnum = pgEnum("skill_status", ["draft", "active", "archived"]);

/* ------------------------------------------------------------------ */
/* Pengguna & akses                                                    */
/* ------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  telegramUserId: bigint({ mode: "number" }).unique(),
  telegramChatId: bigint({ mode: "number" }),
  name: varchar({ length: 120 }).notNull(),
  role: roleEnum().notNull().default("admin"),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const loginLinks = pgTable("login_links", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => users.id),
  tokenHash: varchar({ length: 128 }).notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  usedAt: timestamp({ withTimezone: true }),
});

/* ------------------------------------------------------------------ */
/* Tahap 1 — produk & insight                                          */
/* ------------------------------------------------------------------ */

export const products = pgTable("products", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 200 }).notNull(),
  slug: varchar({ length: 200 }).notNull().unique(),
  kind: productKindEnum().notNull().default("other"),
  context: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  origin: productOriginEnum().notNull().default("manual_brief"),
  status: productStatusEnum().notNull().default("candidate"),
  score: numeric({ precision: 4, scale: 2 }),
  confidence: numeric({ precision: 4, scale: 3 }),
  selectedAt: timestamp({ withTimezone: true }),
  createdBy: uuid().references(() => users.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp({ withTimezone: true }),
});

export const productBriefs = pgTable("product_briefs", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid().notNull().references(() => products.id),
  version: integer().notNull().default(1),
  mode: briefModeEnum().notNull().default("quick"),
  description: text().notNull(),
  priceInfo: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  specs: text(),
  ownerStrengths: text(),
  targetBuyer: text(),
  problemsSolved: text(),
  differentiators: text(),
  proof: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  claimLimits: text(),
  offerGuarantee: text(),
  orderChannel: text(),
  toneNotes: text(),
  rawText: text(),
  clarifications: jsonb().$type<Array<Record<string, unknown>>>().notNull().default([]),
  status: briefStatusEnum().notNull().default("draft"),
  createdBy: uuid().references(() => users.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const productInsights = pgTable("product_insights", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid().notNull().references(() => products.id),
  briefId: uuid().references(() => productBriefs.id),
  kind: insightKindEnum().notNull(),
  strengthType: strengthTypeEnum(),
  statement: text().notNull(),
  detail: text(),
  basis: insightBasisEnum().notNull().default("ai_inference"),
  proofStatus: proofStatusEnum().notNull().default("needs_proof"),
  claimRisk: claimRiskEnum().notNull().default("medium"),
  intensity: intensityEnum(),
  audiencePhrases: jsonb().$type<string[]>().notNull().default([]),
  linkedTo: jsonb().$type<string[]>().notNull().default([]),
  suggestedAngle: text(),
  confidence: numeric({ precision: 4, scale: 3 }),
  priority: integer().notNull().default(0),
  pinned: boolean().notNull().default(false),
  status: insightStatusEnum().notNull().default("draft"),
  skillVersionId: uuid(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const marketBriefs = pgTable("market_briefs", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid().notNull().references(() => products.id),
  version: integer().notNull().default(1),
  demandSummary: text().notNull(),
  priceMin: bigint({ mode: "number" }),
  priceMax: bigint({ mode: "number" }),
  competitors: jsonb().$type<Array<Record<string, unknown>>>().notNull().default([]),
  gaps: text(),
  risks: text(),
  validationPlan: text(),
  sources: jsonb().$type<Array<Record<string, unknown>>>().notNull().default([]),
  contentMd: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Tahap 2 — audiens & angle                                           */
/* ------------------------------------------------------------------ */

export const audienceProfiles = pgTable("audience_profiles", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid().notNull().references(() => products.id),
  name: varchar({ length: 120 }).notNull(),
  description: text().notNull(),
  pains: jsonb().$type<string[]>().notNull().default([]),
  objections: jsonb().$type<string[]>().notNull().default([]),
  languageNotes: text(),
  targetingSuggestion: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  status: audienceStatusEnum().notNull().default("draft"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const angles = pgTable("angles", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid().notNull().references(() => products.id),
  audienceId: uuid().references(() => audienceProfiles.id),
  name: varchar({ length: 120 }).notNull(),
  code: varchar({ length: 16 }).notNull(),
  description: text().notNull(),
  hookExamples: jsonb().$type<string[]>().notNull().default([]),
  origin: angleOriginEnum().notNull().default("manual"),
  status: angleStatusEnum().notNull().default("idea"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Berkas                                                              */
/* ------------------------------------------------------------------ */

export const uploads = pgTable("uploads", {
  id: uuid().primaryKey().defaultRandom(),
  kind: uploadKindEnum().notNull(),
  bucket: varchar({ length: 120 }).notNull(),
  storagePath: varchar({ length: 512 }).notNull(),
  mimeType: varchar({ length: 120 }).notNull(),
  sizeBytes: integer().notNull().default(0),
  fileHash: varchar({ length: 128 }),
  createdBy: uuid().references(() => users.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Tahap 3 — landing page                                              */
/* ------------------------------------------------------------------ */

export const landingPages = pgTable("landing_pages", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid().notNull().references(() => products.id),
  angleId: uuid().notNull().references(() => angles.id),
  version: integer().notNull().default(1),
  previousId: uuid(),
  blocks: jsonb().$type<Array<Record<string, unknown>>>().notNull().default([]),
  insightIds: jsonb().$type<string[]>().notNull().default([]),
  skillVersionId: uuid(),
  title: varchar({ length: 200 }).notNull(),
  fileUploadId: uuid().references(() => uploads.id),
  html: text(),
  sizeKb: integer().notNull().default(0),
  liveUrl: varchar({ length: 512 }),
  precheck: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  status: landingStatusEnum().notNull().default("draft"),
  createdBy: uuid().references(() => users.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp({ withTimezone: true }),
});

/* ------------------------------------------------------------------ */
/* Tahap 4 — creative                                                  */
/* ------------------------------------------------------------------ */

export const creatives = pgTable("creatives", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid().notNull().references(() => products.id),
  angleId: uuid().notNull().references(() => angles.id),
  name: varchar({ length: 200 }).notNull(),
  format: creativeFormatEnum().notNull().default("image"),
  primaryText: text().notNull().default(""),
  headline: varchar({ length: 200 }).notNull().default(""),
  description: varchar({ length: 300 }).notNull().default(""),
  cta: varchar({ length: 60 }).notNull().default(""),
  landingPageId: uuid().references(() => landingPages.id),
  parentCreativeId: uuid(),
  version: integer().notNull().default(1),
  previousId: uuid(),
  skillVersionId: uuid(),
  precheck: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  status: creativeStatusEnum().notNull().default("draft"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp({ withTimezone: true }),
});

export const creativeAssets = pgTable("creative_assets", {
  id: uuid().primaryKey().defaultRandom(),
  creativeId: uuid().notNull().references(() => creatives.id),
  kind: assetKindEnum().notNull(),
  source: assetSourceEnum().notNull().default("uploaded"),
  uploadId: uuid().references(() => uploads.id),
  aspectRatio: varchar({ length: 12 }).notNull().default("1:1"),
  durationSec: integer(),
  provider: varchar({ length: 80 }),
  prompt: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Tahap 5 — kampanye, ad set, iklan, data performa                    */
/* ------------------------------------------------------------------ */

export const campaigns = pgTable("campaigns", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid().notNull().references(() => products.id),
  metaCampaignId: varchar({ length: 120 }),
  name: varchar({ length: 200 }).notNull(),
  objective: varchar({ length: 120 }).notNull(),
  status: campaignStatusEnum().notNull().default("draft"),
  metaStatus: varchar({ length: 60 }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const adSets = pgTable("ad_sets", {
  id: uuid().primaryKey().defaultRandom(),
  campaignId: uuid().notNull().references(() => campaigns.id),
  experimentId: uuid(),
  metaAdsetId: varchar({ length: 120 }),
  name: varchar({ length: 200 }).notNull(),
  variable: text(),
  dailyBudget: bigint({ mode: "number" }).notNull().default(0),
  targeting: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  optimizationGoal: varchar({ length: 120 }).notNull().default(""),
  status: campaignStatusEnum().notNull().default("draft"),
  metaStatus: varchar({ length: 60 }),
  lastScaledAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const ads = pgTable("ads", {
  id: uuid().primaryKey().defaultRandom(),
  adSetId: uuid().notNull().references(() => adSets.id),
  creativeId: uuid().notNull().references(() => creatives.id),
  angleId: uuid().notNull().references(() => angles.id),
  metaAdId: varchar({ length: 120 }),
  name: varchar({ length: 200 }).notNull(),
  status: campaignStatusEnum().notNull().default("draft"),
  metaStatus: varchar({ length: 60 }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const adInsights = pgTable(
  "ad_insights",
  {
    id: uuid().primaryKey().defaultRandom(),
    adId: uuid().notNull().references(() => ads.id),
    date: date({ mode: "string" }).notNull(),
    granularity: granularityEnum().notNull().default("daily"),
    hour: integer(),
    spend: bigint({ mode: "number" }).notNull().default(0),
    impressions: integer().notNull().default(0),
    reach: integer().notNull().default(0),
    linkClicks: integer().notNull().default(0),
    results: integer().notNull().default(0),
    resultValue: bigint({ mode: "number" }).notNull().default(0),
    frequency: numeric({ precision: 8, scale: 3 }),
    fetchedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("ad_insights_unique").on(table.adId, table.date, table.granularity, table.hour)],
);

/* ------------------------------------------------------------------ */
/* Eksperimen                                                          */
/* ------------------------------------------------------------------ */

export const experiments = pgTable("experiments", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid().notNull().references(() => products.id),
  name: varchar({ length: 200 }).notNull(),
  variable: experimentVariableEnum().notNull(),
  hypothesis: text().notNull(),
  primaryMetric: varchar({ length: 40 }).notNull().default("cpa"),
  minDataRule: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  winRule: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  totalBudget: bigint({ mode: "number" }).notNull().default(0),
  startDate: date({ mode: "string" }),
  endDate: date({ mode: "string" }),
  status: experimentStatusEnum().notNull().default("planned"),
  winnerArmId: uuid(),
  conclusion: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const experimentArms = pgTable("experiment_arms", {
  id: uuid().primaryKey().defaultRandom(),
  experimentId: uuid().notNull().references(() => experiments.id),
  label: varchar({ length: 20 }).notNull(),
  adSetId: uuid().references(() => adSets.id),
  angleId: uuid().references(() => angles.id),
  creativeId: uuid().references(() => creatives.id),
  note: text(),
});

/* ------------------------------------------------------------------ */
/* Kompetitor                                                          */
/* ------------------------------------------------------------------ */

export const competitors = pgTable("competitors", {
  id: uuid().primaryKey().defaultRandom(),
  productId: uuid().references(() => products.id),
  name: varchar({ length: 160 }).notNull(),
  pageUrl: varchar({ length: 512 }),
  adLibraryUrl: varchar({ length: 512 }),
  source: competitorSourceEnum().notNull().default("manual"),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const competitorAds = pgTable("competitor_ads", {
  id: uuid().primaryKey().defaultRandom(),
  competitorId: uuid().notNull().references(() => competitors.id),
  externalRef: varchar({ length: 160 }),
  snapshotDate: date({ mode: "string" }).notNull(),
  firstSeenDate: date({ mode: "string" }),
  lastSeenDate: date({ mode: "string" }),
  primaryText: text().notNull().default(""),
  headline: varchar({ length: 220 }),
  cta: varchar({ length: 60 }),
  destinationUrl: varchar({ length: 512 }),
  format: competitorAdFormatEnum().notNull().default("unknown"),
  variantGroup: varchar({ length: 120 }),
  daysRunning: integer().notNull().default(0),
  labels: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  uploadId: uuid().references(() => uploads.id),
});

/* ------------------------------------------------------------------ */
/* Jev — pertanyaan & penilaian                                        */
/* ------------------------------------------------------------------ */

export const judgmentQuestions = pgTable("judgment_questions", {
  id: uuid().primaryKey().defaultRandom(),
  key: varchar({ length: 80 }).notNull(),
  appliesTo: judgmentAppliesToEnum().notNull(),
  prompt: text().notNull(),
  answerType: judgmentAnswerTypeEnum().notNull(),
  options: jsonb().$type<string[]>().notNull().default([]),
  threshold: numeric({ precision: 4, scale: 3 }).notNull().default("0.800"),
  version: integer().notNull().default(1),
  isActive: boolean().notNull().default(true),
});

export const judgments = pgTable("judgments", {
  id: uuid().primaryKey().defaultRandom(),
  questionId: uuid().notNull().references(() => judgmentQuestions.id),
  subjectType: varchar({ length: 60 }).notNull(),
  subjectId: uuid().notNull(),
  answer: varchar({ length: 80 }).notNull(),
  probabilities: jsonb().$type<Record<string, number>>().notNull().default({}),
  confidence: numeric({ precision: 4, scale: 3 }).notNull(),
  forwarded: boolean().notNull().default(false),
  humanAnswer: varchar({ length: 80 }),
  model: varchar({ length: 60 }).notNull().default("jev"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Analisa, aturan, approval, aksi, pekerjaan                          */
/* ------------------------------------------------------------------ */

export const analyses = pgTable("analyses", {
  id: uuid().primaryKey().defaultRandom(),
  kind: analysisKindEnum().notNull(),
  periodStart: date({ mode: "string" }),
  periodEnd: date({ mode: "string" }),
  contentMd: text().notNull(),
  facts: jsonb().$type<string[]>().notNull().default([]),
  hypotheses: jsonb().$type<string[]>().notNull().default([]),
  recommendations: jsonb().$type<string[]>().notNull().default([]),
  model: varchar({ length: 60 }).notNull().default("claude"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const rules = pgTable("rules", {
  id: uuid().primaryKey().defaultRandom(),
  key: varchar({ length: 60 }).notNull(),
  params: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  mode: ruleModeEnum().notNull().default("suggest_approve"),
  isActive: boolean().notNull().default(true),
  version: integer().notNull().default(1),
  updatedBy: uuid().references(() => users.id),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const approvals = pgTable("approvals", {
  id: uuid().primaryKey().defaultRandom(),
  kind: approvalKindEnum().notNull(),
  subjectType: varchar({ length: 60 }).notNull(),
  subjectId: uuid().notNull(),
  title: varchar({ length: 220 }).notNull(),
  summary: text().notNull().default(""),
  reasons: jsonb().$type<string[]>().notNull().default([]),
  payload: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  status: approvalStatusEnum().notNull().default("pending"),
  requestedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp({ withTimezone: true }),
  decidedBy: uuid().references(() => users.id),
  decidedAt: timestamp({ withTimezone: true }),
  decisionNote: text(),
  error: text(),
});

export const actionLog = pgTable("action_log", {
  id: uuid().primaryKey().defaultRandom(),
  approvalId: uuid().references(() => approvals.id),
  action: varchar({ length: 80 }).notNull(),
  targetType: varchar({ length: 60 }).notNull(),
  targetId: uuid().notNull(),
  metaObjectId: varchar({ length: 120 }),
  request: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  response: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  idempotencyKey: varchar({ length: 200 }).notNull().unique(),
  mode: actionModeEnum().notNull().default("manual_approved"),
  status: actionStatusEnum().notNull().default("sent"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: uuid().primaryKey().defaultRandom(),
  workflowKey: varchar({ length: 80 }).notNull(),
  trigger: jobTriggerEnum().notNull().default("system"),
  skillVersionId: uuid(),
  status: jobStatusEnum().notNull().default("queued"),
  input: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  output: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  error: text(),
  startedAt: timestamp({ withTimezone: true }),
  finishedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Bot, AI usage, pengaturan, audit                                    */
/* ------------------------------------------------------------------ */

export const chatMessages = pgTable("chat_messages", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().notNull().references(() => users.id),
  role: chatRoleEnum().notNull(),
  content: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const telegramUpdates = pgTable("telegram_updates", {
  updateId: bigint({ mode: "number" }).primaryKey(),
  receivedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const aiUsage = pgTable("ai_usage", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().references(() => users.id),
  provider: aiProviderEnum().notNull(),
  purpose: varchar({ length: 80 }).notNull(),
  model: varchar({ length: 80 }).notNull(),
  inputTokens: integer().notNull().default(0),
  outputTokens: integer().notNull().default(0),
  costIdr: bigint({ mode: "number" }).notNull().default(0),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: varchar({ length: 80 }).primaryKey(),
  value: jsonb().$type<unknown>().notNull(),
  updatedBy: uuid().references(() => users.id),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid().references(() => users.id),
  action: auditActionEnum().notNull(),
  entityType: varchar({ length: 60 }).notNull(),
  entityId: uuid(),
  before: jsonb().$type<Record<string, unknown> | null>(),
  after: jsonb().$type<Record<string, unknown> | null>(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Preview & revisi                                                    */
/* ------------------------------------------------------------------ */

export const revisionRequests = pgTable("revision_requests", {
  id: uuid().primaryKey().defaultRandom(),
  subjectType: revisionSubjectEnum().notNull(),
  baseId: uuid().notNull(),
  resultId: uuid(),
  status: revisionStatusEnum().notNull().default("queued"),
  commentCount: integer().notNull().default(0),
  jobId: uuid().references(() => jobs.id),
  skillVersionId: uuid(),
  error: text(),
  requestedBy: uuid().references(() => users.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const previewComments = pgTable("preview_comments", {
  id: uuid().primaryKey().defaultRandom(),
  subjectType: commentSubjectEnum().notNull(),
  subjectId: uuid().notNull(),
  kind: commentKindEnum().notNull(),
  anchorType: anchorTypeEnum().notNull(),
  anchor: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  anchorSnapshot: text(),
  body: text().notNull(),
  replacementText: text(),
  status: commentStatusEnum().notNull().default("open"),
  revisionRequestId: uuid().references(() => revisionRequests.id),
  agentResponse: text(),
  resolvedInId: uuid(),
  createdBy: uuid().references(() => users.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Skill agent                                                         */
/* ------------------------------------------------------------------ */

export const agentSkills = pgTable("agent_skills", {
  id: uuid().primaryKey().defaultRandom(),
  key: varchar({ length: 80 }).notNull().unique(),
  name: varchar({ length: 160 }).notNull(),
  description: text().notNull().default(""),
  modelTier: skillModelTierEnum().notNull().default("main"),
  outputSchema: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  status: skillStatusEnum().notNull().default("draft"),
  activeVersionId: uuid(),
  createdBy: uuid().references(() => users.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const agentSkillVersions = pgTable("agent_skill_versions", {
  id: uuid().primaryKey().defaultRandom(),
  skillId: uuid().notNull().references(() => agentSkills.id),
  version: integer().notNull().default(1),
  instructionsMd: text().notNull().default(""),
  examples: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  resources: jsonb().$type<string[]>().notNull().default([]),
  changeNote: text().notNull().default(""),
  testResult: jsonb().$type<Record<string, unknown>>(),
  createdBy: uuid().references(() => users.id),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const skillBindings = pgTable("skill_bindings", {
  id: uuid().primaryKey().defaultRandom(),
  workflowKey: varchar({ length: 80 }).notNull(),
  stepKey: varchar({ length: 80 }).notNull(),
  skillId: uuid().notNull().references(() => agentSkills.id),
  isActive: boolean().notNull().default(true),
});

export type User = typeof users.$inferSelect;
export type Approval = typeof approvals.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductInsight = typeof productInsights.$inferSelect;
export type AgentSkill = typeof agentSkills.$inferSelect;
export type AgentSkillVersion = typeof agentSkillVersions.$inferSelect;
export type PreviewComment = typeof previewComments.$inferSelect;
export type RevisionRequest = typeof revisionRequests.$inferSelect;
export type Rule = typeof rules.$inferSelect;
