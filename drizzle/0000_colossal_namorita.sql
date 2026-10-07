CREATE TYPE "public"."action_mode" AS ENUM('manual_approved', 'auto');--> statement-breakpoint
CREATE TYPE "public"."action_status" AS ENUM('sent', 'confirmed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."ai_provider" AS ENUM('claude', 'jev', 'image', 'video');--> statement-breakpoint
CREATE TYPE "public"."analysis_kind" AS ENUM('daily_report', 'weekly_report', 'experiment_review', 'competitor_map', 'creative_brief');--> statement-breakpoint
CREATE TYPE "public"."anchor_type" AS ENUM('block', 'text_range', 'image_area', 'video_time', 'general');--> statement-breakpoint
CREATE TYPE "public"."angle_origin" AS ENUM('research', 'competitor_gap', 'winner_variation', 'manual');--> statement-breakpoint
CREATE TYPE "public"."angle_status" AS ENUM('idea', 'testing', 'winning', 'saturated', 'retired');--> statement-breakpoint
CREATE TYPE "public"."approval_kind" AS ENUM('product', 'audience', 'landing_page', 'creative_pack', 'launch', 'scale', 'pause', 'new_creative', 'experiment_winner');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected', 'revision', 'expired', 'executed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."asset_kind" AS ENUM('image', 'video', 'thumbnail');--> statement-breakpoint
CREATE TYPE "public"."asset_source" AS ENUM('ai_generated', 'uploaded');--> statement-breakpoint
CREATE TYPE "public"."audience_status" AS ENUM('draft', 'approved', 'retired');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'approve', 'reject', 'kill', 'resume');--> statement-breakpoint
CREATE TYPE "public"."brief_mode" AS ENUM('quick', 'full', 'free_text');--> statement-breakpoint
CREATE TYPE "public"."brief_status" AS ENUM('draft', 'submitted', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'awaiting_approval', 'ready', 'active', 'paused', 'rejected_by_meta', 'archived');--> statement-breakpoint
CREATE TYPE "public"."chat_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."claim_risk" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."comment_kind" AS ENUM('change', 'replace_text', 'question');--> statement-breakpoint
CREATE TYPE "public"."comment_status" AS ENUM('open', 'queued', 'in_revision', 'resolved', 'disputed', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."comment_subject" AS ENUM('landing_page', 'creative');--> statement-breakpoint
CREATE TYPE "public"."competitor_ad_format" AS ENUM('image', 'video', 'carousel', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."competitor_source" AS ENUM('manual', 'provider');--> statement-breakpoint
CREATE TYPE "public"."creative_format" AS ENUM('image', 'video', 'carousel');--> statement-breakpoint
CREATE TYPE "public"."creative_status" AS ENUM('draft', 'in_review', 'approved', 'in_use', 'fatigued', 'retired');--> statement-breakpoint
CREATE TYPE "public"."experiment_status" AS ENUM('planned', 'running', 'concluded', 'inconclusive', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."experiment_variable" AS ENUM('angle', 'visual', 'offer', 'audience', 'landing_page');--> statement-breakpoint
CREATE TYPE "public"."granularity" AS ENUM('hourly', 'daily');--> statement-breakpoint
CREATE TYPE "public"."insight_basis" AS ENUM('from_brief', 'from_research', 'ai_inference', 'user_added');--> statement-breakpoint
CREATE TYPE "public"."insight_kind" AS ENUM('strength', 'pain_point', 'objection');--> statement-breakpoint
CREATE TYPE "public"."insight_status" AS ENUM('draft', 'confirmed', 'rejected', 'needs_review');--> statement-breakpoint
CREATE TYPE "public"."intensity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('queued', 'running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."job_trigger" AS ENUM('cron', 'user', 'system');--> statement-breakpoint
CREATE TYPE "public"."judgment_answer_type" AS ENUM('choice', 'ordinal', 'boolean');--> statement-breakpoint
CREATE TYPE "public"."judgment_applies_to" AS ENUM('ad', 'creative', 'landing_page', 'competitor_ad', 'comment', 'product', 'product_insight');--> statement-breakpoint
CREATE TYPE "public"."landing_status" AS ENUM('draft', 'in_review', 'approved', 'deployed', 'retired');--> statement-breakpoint
CREATE TYPE "public"."product_kind" AS ENUM('online_physical', 'digital', 'offline_service', 'other');--> statement-breakpoint
CREATE TYPE "public"."product_origin" AS ENUM('research', 'manual_brief');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('candidate', 'selected', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."proof_status" AS ENUM('verified', 'needs_proof', 'unverifiable');--> statement-breakpoint
CREATE TYPE "public"."revision_status" AS ENUM('queued', 'running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."revision_subject" AS ENUM('landing_page', 'creative');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'admin');--> statement-breakpoint
CREATE TYPE "public"."rule_mode" AS ENUM('suggest_approve', 'auto');--> statement-breakpoint
CREATE TYPE "public"."skill_model_tier" AS ENUM('main', 'light');--> statement-breakpoint
CREATE TYPE "public"."skill_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."strength_type" AS ENUM('feature', 'benefit', 'emotional', 'differentiator');--> statement-breakpoint
CREATE TYPE "public"."upload_kind" AS ENUM('asset', 'landing_page', 'screenshot', 'document', 'export');--> statement-breakpoint
CREATE TABLE "action_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"approval_id" uuid,
	"action" varchar(80) NOT NULL,
	"target_type" varchar(60) NOT NULL,
	"target_id" uuid NOT NULL,
	"meta_object_id" varchar(120),
	"request" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"response" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"idempotency_key" varchar(200) NOT NULL,
	"mode" "action_mode" DEFAULT 'manual_approved' NOT NULL,
	"status" "action_status" DEFAULT 'sent' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "action_log_idempotencyKey_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "ad_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_id" uuid NOT NULL,
	"date" date NOT NULL,
	"granularity" "granularity" DEFAULT 'daily' NOT NULL,
	"hour" integer,
	"spend" bigint DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"reach" integer DEFAULT 0 NOT NULL,
	"link_clicks" integer DEFAULT 0 NOT NULL,
	"results" integer DEFAULT 0 NOT NULL,
	"result_value" bigint DEFAULT 0 NOT NULL,
	"frequency" numeric(8, 3),
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ad_insights_unique" UNIQUE("ad_id","date","granularity","hour")
);
--> statement-breakpoint
CREATE TABLE "ad_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"experiment_id" uuid,
	"meta_adset_id" varchar(120),
	"name" varchar(200) NOT NULL,
	"variable" text,
	"daily_budget" bigint DEFAULT 0 NOT NULL,
	"targeting" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"optimization_goal" varchar(120) DEFAULT '' NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"meta_status" varchar(60),
	"last_scaled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_set_id" uuid NOT NULL,
	"creative_id" uuid NOT NULL,
	"angle_id" uuid NOT NULL,
	"meta_ad_id" varchar(120),
	"name" varchar(200) NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"meta_status" varchar(60),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_skill_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"instructions_md" text DEFAULT '' NOT NULL,
	"examples" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"resources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"change_note" text DEFAULT '' NOT NULL,
	"test_result" jsonb,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(80) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"model_tier" "skill_model_tier" DEFAULT 'main' NOT NULL,
	"output_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "skill_status" DEFAULT 'draft' NOT NULL,
	"active_version_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_skills_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"provider" "ai_provider" NOT NULL,
	"purpose" varchar(80) NOT NULL,
	"model" varchar(80) NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_idr" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "analysis_kind" NOT NULL,
	"period_start" date,
	"period_end" date,
	"content_md" text NOT NULL,
	"facts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"hypotheses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"model" varchar(60) DEFAULT 'claude' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "angles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"audience_id" uuid,
	"name" varchar(120) NOT NULL,
	"code" varchar(16) NOT NULL,
	"description" text NOT NULL,
	"hook_examples" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"origin" "angle_origin" DEFAULT 'manual' NOT NULL,
	"status" "angle_status" DEFAULT 'idea' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "approval_kind" NOT NULL,
	"subject_type" varchar(60) NOT NULL,
	"subject_id" uuid NOT NULL,
	"title" varchar(220) NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"decision_note" text,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "audience_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"pains" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"objections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"language_notes" text,
	"targeting_suggestion" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "audience_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" "audit_action" NOT NULL,
	"entity_type" varchar(60) NOT NULL,
	"entity_id" uuid,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"meta_campaign_id" varchar(120),
	"name" varchar(200) NOT NULL,
	"objective" varchar(120) NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"meta_status" varchar(60),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "chat_role" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitor_ads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competitor_id" uuid NOT NULL,
	"external_ref" varchar(160),
	"snapshot_date" date NOT NULL,
	"first_seen_date" date,
	"last_seen_date" date,
	"primary_text" text DEFAULT '' NOT NULL,
	"headline" varchar(220),
	"cta" varchar(60),
	"destination_url" varchar(512),
	"format" "competitor_ad_format" DEFAULT 'unknown' NOT NULL,
	"variant_group" varchar(120),
	"days_running" integer DEFAULT 0 NOT NULL,
	"labels" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"upload_id" uuid
);
--> statement-breakpoint
CREATE TABLE "competitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid,
	"name" varchar(160) NOT NULL,
	"page_url" varchar(512),
	"ad_library_url" varchar(512),
	"source" "competitor_source" DEFAULT 'manual' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creative_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creative_id" uuid NOT NULL,
	"kind" "asset_kind" NOT NULL,
	"source" "asset_source" DEFAULT 'uploaded' NOT NULL,
	"upload_id" uuid,
	"aspect_ratio" varchar(12) DEFAULT '1:1' NOT NULL,
	"duration_sec" integer,
	"provider" varchar(80),
	"prompt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"angle_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"format" "creative_format" DEFAULT 'image' NOT NULL,
	"primary_text" text DEFAULT '' NOT NULL,
	"headline" varchar(200) DEFAULT '' NOT NULL,
	"description" varchar(300) DEFAULT '' NOT NULL,
	"cta" varchar(60) DEFAULT '' NOT NULL,
	"landing_page_id" uuid,
	"parent_creative_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"previous_id" uuid,
	"skill_version_id" uuid,
	"precheck" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "creative_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "experiment_arms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"experiment_id" uuid NOT NULL,
	"label" varchar(20) NOT NULL,
	"ad_set_id" uuid,
	"angle_id" uuid,
	"creative_id" uuid,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "experiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"variable" "experiment_variable" NOT NULL,
	"hypothesis" text NOT NULL,
	"primary_metric" varchar(40) DEFAULT 'cpa' NOT NULL,
	"min_data_rule" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"win_rule" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"total_budget" bigint DEFAULT 0 NOT NULL,
	"start_date" date,
	"end_date" date,
	"status" "experiment_status" DEFAULT 'planned' NOT NULL,
	"winner_arm_id" uuid,
	"conclusion" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_key" varchar(80) NOT NULL,
	"trigger" "job_trigger" DEFAULT 'system' NOT NULL,
	"skill_version_id" uuid,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"input" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"output" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "judgment_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(80) NOT NULL,
	"applies_to" "judgment_applies_to" NOT NULL,
	"prompt" text NOT NULL,
	"answer_type" "judgment_answer_type" NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"threshold" numeric(4, 3) DEFAULT '0.800' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "judgments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"subject_type" varchar(60) NOT NULL,
	"subject_id" uuid NOT NULL,
	"answer" varchar(80) NOT NULL,
	"probabilities" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"confidence" numeric(4, 3) NOT NULL,
	"forwarded" boolean DEFAULT false NOT NULL,
	"human_answer" varchar(80),
	"model" varchar(60) DEFAULT 'jev' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landing_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"angle_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"previous_id" uuid,
	"blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"insight_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"skill_version_id" uuid,
	"title" varchar(200) NOT NULL,
	"file_upload_id" uuid,
	"html" text,
	"size_kb" integer DEFAULT 0 NOT NULL,
	"live_url" varchar(512),
	"precheck" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "landing_status" DEFAULT 'draft' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "login_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "market_briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"demand_summary" text NOT NULL,
	"price_min" bigint,
	"price_max" bigint,
	"competitors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"gaps" text,
	"risks" text,
	"validation_plan" text,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content_md" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preview_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" "comment_subject" NOT NULL,
	"subject_id" uuid NOT NULL,
	"kind" "comment_kind" NOT NULL,
	"anchor_type" "anchor_type" NOT NULL,
	"anchor" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"anchor_snapshot" text,
	"body" text NOT NULL,
	"replacement_text" text,
	"status" "comment_status" DEFAULT 'open' NOT NULL,
	"revision_request_id" uuid,
	"agent_response" text,
	"resolved_in_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"mode" "brief_mode" DEFAULT 'quick' NOT NULL,
	"description" text NOT NULL,
	"price_info" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"specs" text,
	"owner_strengths" text,
	"target_buyer" text,
	"problems_solved" text,
	"differentiators" text,
	"proof" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"claim_limits" text,
	"offer_guarantee" text,
	"order_channel" text,
	"tone_notes" text,
	"raw_text" text,
	"clarifications" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "brief_status" DEFAULT 'draft' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"brief_id" uuid,
	"kind" "insight_kind" NOT NULL,
	"strength_type" "strength_type",
	"statement" text NOT NULL,
	"detail" text,
	"basis" "insight_basis" DEFAULT 'ai_inference' NOT NULL,
	"proof_status" "proof_status" DEFAULT 'needs_proof' NOT NULL,
	"claim_risk" "claim_risk" DEFAULT 'medium' NOT NULL,
	"intensity" "intensity",
	"audience_phrases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"linked_to" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"suggested_angle" text,
	"confidence" numeric(4, 3),
	"priority" integer DEFAULT 0 NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"status" "insight_status" DEFAULT 'draft' NOT NULL,
	"skill_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"kind" "product_kind" DEFAULT 'other' NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"origin" "product_origin" DEFAULT 'manual_brief' NOT NULL,
	"status" "product_status" DEFAULT 'candidate' NOT NULL,
	"score" numeric(4, 2),
	"confidence" numeric(4, 3),
	"selected_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "revision_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" "revision_subject" NOT NULL,
	"base_id" uuid NOT NULL,
	"result_id" uuid,
	"status" "revision_status" DEFAULT 'queued' NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"job_id" uuid,
	"skill_version_id" uuid,
	"error" text,
	"requested_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(60) NOT NULL,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"mode" "rule_mode" DEFAULT 'suggest_approve' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar(80) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_bindings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_key" varchar(80) NOT NULL,
	"step_key" varchar(80) NOT NULL,
	"skill_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_updates" (
	"update_id" bigint PRIMARY KEY NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "upload_kind" NOT NULL,
	"bucket" varchar(120) NOT NULL,
	"storage_path" varchar(512) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"size_bytes" integer DEFAULT 0 NOT NULL,
	"file_hash" varchar(128),
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_user_id" bigint,
	"telegram_chat_id" bigint,
	"name" varchar(120) NOT NULL,
	"role" "role" DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_telegramUserId_unique" UNIQUE("telegram_user_id")
);
--> statement-breakpoint
ALTER TABLE "action_log" ADD CONSTRAINT "action_log_approval_id_approvals_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."approvals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_insights" ADD CONSTRAINT "ad_insights_ad_id_ads_id_fk" FOREIGN KEY ("ad_id") REFERENCES "public"."ads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_sets" ADD CONSTRAINT "ad_sets_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_ad_set_id_ad_sets_id_fk" FOREIGN KEY ("ad_set_id") REFERENCES "public"."ad_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_creative_id_creatives_id_fk" FOREIGN KEY ("creative_id") REFERENCES "public"."creatives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_angle_id_angles_id_fk" FOREIGN KEY ("angle_id") REFERENCES "public"."angles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_skill_versions" ADD CONSTRAINT "agent_skill_versions_skill_id_agent_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."agent_skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_skill_versions" ADD CONSTRAINT "agent_skill_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_skills" ADD CONSTRAINT "agent_skills_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "angles" ADD CONSTRAINT "angles_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "angles" ADD CONSTRAINT "angles_audience_id_audience_profiles_id_fk" FOREIGN KEY ("audience_id") REFERENCES "public"."audience_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audience_profiles" ADD CONSTRAINT "audience_profiles_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_ads" ADD CONSTRAINT "competitor_ads_competitor_id_competitors_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."competitors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_ads" ADD CONSTRAINT "competitor_ads_upload_id_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_assets" ADD CONSTRAINT "creative_assets_creative_id_creatives_id_fk" FOREIGN KEY ("creative_id") REFERENCES "public"."creatives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_assets" ADD CONSTRAINT "creative_assets_upload_id_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatives" ADD CONSTRAINT "creatives_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatives" ADD CONSTRAINT "creatives_angle_id_angles_id_fk" FOREIGN KEY ("angle_id") REFERENCES "public"."angles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatives" ADD CONSTRAINT "creatives_landing_page_id_landing_pages_id_fk" FOREIGN KEY ("landing_page_id") REFERENCES "public"."landing_pages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_arms" ADD CONSTRAINT "experiment_arms_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_arms" ADD CONSTRAINT "experiment_arms_ad_set_id_ad_sets_id_fk" FOREIGN KEY ("ad_set_id") REFERENCES "public"."ad_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_arms" ADD CONSTRAINT "experiment_arms_angle_id_angles_id_fk" FOREIGN KEY ("angle_id") REFERENCES "public"."angles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_arms" ADD CONSTRAINT "experiment_arms_creative_id_creatives_id_fk" FOREIGN KEY ("creative_id") REFERENCES "public"."creatives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judgments" ADD CONSTRAINT "judgments_question_id_judgment_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."judgment_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_angle_id_angles_id_fk" FOREIGN KEY ("angle_id") REFERENCES "public"."angles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_file_upload_id_uploads_id_fk" FOREIGN KEY ("file_upload_id") REFERENCES "public"."uploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_links" ADD CONSTRAINT "login_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_briefs" ADD CONSTRAINT "market_briefs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preview_comments" ADD CONSTRAINT "preview_comments_revision_request_id_revision_requests_id_fk" FOREIGN KEY ("revision_request_id") REFERENCES "public"."revision_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preview_comments" ADD CONSTRAINT "preview_comments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_briefs" ADD CONSTRAINT "product_briefs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_briefs" ADD CONSTRAINT "product_briefs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_insights" ADD CONSTRAINT "product_insights_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_insights" ADD CONSTRAINT "product_insights_brief_id_product_briefs_id_fk" FOREIGN KEY ("brief_id") REFERENCES "public"."product_briefs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revision_requests" ADD CONSTRAINT "revision_requests_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revision_requests" ADD CONSTRAINT "revision_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_bindings" ADD CONSTRAINT "skill_bindings_skill_id_agent_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."agent_skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;