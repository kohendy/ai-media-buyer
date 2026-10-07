-- View baca-saja (angka turunan dihitung dari data mentah, bukan disimpan).
-- Idempoten: dipakai ulang setiap migrasi.

DROP VIEW IF EXISTS v_ad_performance;
DROP VIEW IF EXISTS v_angle_performance;
DROP VIEW IF EXISTS v_creative_fatigue;
DROP VIEW IF EXISTS v_experiment_status;
DROP VIEW IF EXISTS v_spend_pacing;
DROP VIEW IF EXISTS v_competitor_angle_mix;
DROP VIEW IF EXISTS v_approval_queue;
DROP VIEW IF EXISTS v_judgment_accuracy;

CREATE VIEW v_ad_performance AS
SELECT
  a.id AS ad_id,
  a.name AS ad_name,
  a.angle_id,
  s.id AS ad_set_id,
  s.name AS ad_set_name,
  c.id AS campaign_id,
  c.name AS campaign_name,
  COALESCE(SUM(i.spend), 0)::bigint AS spend,
  COALESCE(SUM(i.impressions), 0)::bigint AS impressions,
  COALESCE(SUM(i.link_clicks), 0)::bigint AS link_clicks,
  COALESCE(SUM(i.results), 0)::bigint AS results,
  COALESCE(SUM(i.result_value), 0)::bigint AS result_value,
  CASE WHEN SUM(i.impressions) > 0 THEN SUM(i.link_clicks)::numeric / SUM(i.impressions) * 100 END AS ctr,
  CASE WHEN SUM(i.impressions) > 0 THEN SUM(i.spend)::numeric / SUM(i.impressions) * 1000 END AS cpm,
  CASE WHEN SUM(i.results) > 0 THEN SUM(i.spend)::numeric / SUM(i.results) END AS cpa,
  CASE WHEN SUM(i.spend) > 0 THEN SUM(i.result_value)::numeric / SUM(i.spend) END AS roas,
  MAX(i.frequency) AS frequency
FROM ads a
JOIN ad_sets s ON s.id = a.ad_set_id
JOIN campaigns c ON c.id = s.campaign_id
LEFT JOIN ad_insights i ON i.ad_id = a.id
GROUP BY a.id, a.name, a.angle_id, s.id, s.name, c.id, c.name;

CREATE VIEW v_angle_performance AS
SELECT
  g.id AS angle_id,
  g.code,
  g.name AS angle_name,
  COALESCE(SUM(i.spend), 0)::bigint AS spend,
  COALESCE(SUM(i.results), 0)::bigint AS results,
  COALESCE(SUM(i.result_value), 0)::bigint AS result_value,
  CASE WHEN SUM(i.results) > 0 THEN SUM(i.spend)::numeric / SUM(i.results) END AS cpa,
  CASE WHEN SUM(i.spend) > 0 THEN SUM(i.result_value)::numeric / SUM(i.spend) END AS roas
FROM angles g
LEFT JOIN creatives cr ON cr.angle_id = g.id
LEFT JOIN ads a ON a.creative_id = cr.id
LEFT JOIN ad_insights i ON i.ad_id = a.id
GROUP BY g.id, g.code, g.name;

CREATE VIEW v_creative_fatigue AS
SELECT
  cr.id AS creative_id,
  cr.name,
  cr.status,
  MAX(i.frequency) AS frequency,
  CASE WHEN SUM(i.impressions) > 0 THEN SUM(i.link_clicks)::numeric / SUM(i.impressions) * 100 END AS ctr,
  (SELECT j.answer FROM judgments j
     WHERE j.subject_type = 'creative' AND j.subject_id = cr.id
     ORDER BY j.created_at DESC LIMIT 1) AS last_judgment,
  (SELECT j.confidence FROM judgments j
     WHERE j.subject_type = 'creative' AND j.subject_id = cr.id
     ORDER BY j.created_at DESC LIMIT 1) AS last_judgment_confidence
FROM creatives cr
LEFT JOIN ads a ON a.creative_id = cr.id
LEFT JOIN ad_insights i ON i.ad_id = a.id
GROUP BY cr.id, cr.name, cr.status;

CREATE VIEW v_experiment_status AS
SELECT
  e.id AS experiment_id,
  e.name,
  e.status,
  e.variable,
  e.primary_metric,
  e.min_data_rule,
  e.win_rule,
  arm.id AS arm_id,
  arm.label,
  COALESCE(stats.results, 0)::bigint AS results,
  stats.spend,
  CASE WHEN COALESCE(stats.results, 0) > 0 THEN stats.spend::numeric / stats.results END AS cpa,
  CASE WHEN COALESCE(stats.spend, 0) > 0 THEN stats.result_value::numeric / stats.spend END AS roas,
  (e.min_data_rule ->> 'min_results')::numeric AS min_results,
  (COALESCE(stats.results, 0) >= COALESCE((e.min_data_rule ->> 'min_results')::numeric, 0)) AS meets_min_data
FROM experiments e
LEFT JOIN experiment_arms arm ON arm.experiment_id = e.id
LEFT JOIN LATERAL (
  SELECT SUM(i.spend) AS spend, SUM(i.results) AS results, SUM(i.result_value) AS result_value
  FROM ad_insights i
  JOIN ads a ON a.id = i.ad_id
  WHERE a.ad_set_id = arm.ad_set_id
) stats ON TRUE;

CREATE VIEW v_spend_pacing AS
SELECT
  CURRENT_DATE AS date,
  COALESCE((SELECT SUM(spend) FROM ad_insights WHERE date = CURRENT_DATE), 0)::bigint AS spend_today,
  COALESCE((SELECT (value #>> '{}')::numeric FROM settings WHERE key = 'daily_spend_cap'), 0) AS daily_cap,
  COALESCE((SELECT (value #>> '{}')::numeric FROM settings WHERE key = 'target_cpa'), 0) AS target_cpa
;

CREATE VIEW v_competitor_angle_mix AS
SELECT
  comp.id AS competitor_id,
  comp.name AS competitor_name,
  DATE_TRUNC('week', ca.snapshot_date)::date AS week,
  ca.labels ->> 'angle' AS angle,
  ca.labels ->> 'hook_type' AS hook_type,
  ca.labels ->> 'offer' AS offer,
  COUNT(*)::bigint AS ads
FROM competitors comp
JOIN competitor_ads ca ON ca.competitor_id = comp.id
GROUP BY comp.id, comp.name, week, ca.labels ->> 'angle', ca.labels ->> 'hook_type', ca.labels ->> 'offer';

CREATE VIEW v_approval_queue AS
SELECT
  a.id,
  a.kind,
  a.title,
  a.summary,
  a.status,
  a.requested_at,
  a.expires_at,
  EXTRACT(EPOCH FROM (NOW() - a.requested_at)) / 3600 AS age_hours,
  (a.expires_at IS NOT NULL AND a.expires_at < NOW()) AS is_expired
FROM approvals a
WHERE a.status = 'pending';

CREATE VIEW v_judgment_accuracy AS
SELECT
  q.id AS question_id,
  q.key,
  q.prompt,
  COUNT(j.id)::bigint AS total,
  COUNT(j.human_answer)::bigint AS evaluated,
  AVG(CASE WHEN j.human_answer IS NOT NULL AND j.human_answer = j.answer THEN 1 ELSE 0 END)
    FILTER (WHERE j.human_answer IS NOT NULL) AS accuracy,
  AVG(j.confidence) AS avg_confidence,
  COUNT(*) FILTER (WHERE j.forwarded)::bigint AS forwarded_count
FROM judgment_questions q
LEFT JOIN judgments j ON j.question_id = q.id
GROUP BY q.id, q.key, q.prompt;
