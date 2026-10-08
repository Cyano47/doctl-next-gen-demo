-- Workstream 1: who the active accounts are, and personal token adoption.
-- Placeholders: see scripts/render_sql.py. Each "-- @query <name>" saves to runs/<month>/data/<name>.csv.

-- @query base_churn
-- Active base, revenue, new-or-returning and 3-month churn per month, with cuts.
-- The invoice window starts one month early so new_or_returning is correct in the first month.
WITH {{block:acct}},
gh AS (SELECT DISTINCT account_id FROM PRODUCTION.TRANSFORMED_DATA.PROMOS_GITHUB_STUDENT_PACK_USAGES WHERE _deleted_at IS NULL),
am AS (
  SELECT n.account_id, n.invoice_start_date m, SUM(n.gross_amount) g, SUM(n.net_amount) net
  FROM PRODUCTION.MFD.INVOICE_ITEMS_NET n JOIN acct USING (account_id)
  WHERE n._deleted_at IS NULL AND n.invoice_start_date BETWEEN '{{prev_window_start}}' AND '{{month_start}}'
  GROUP BY 1,2 HAVING SUM(n.gross_amount) > 0
),
x AS (
  SELECT am.*,
    {{block:spend_band_g}} band,
    CASE WHEN DATE_TRUNC('month',acct.cd)=m THEN 'a_new' WHEN DATEDIFF('month',acct.cd,m) < 6 THEN 'b_lt6mo' WHEN DATEDIFF('month',acct.cd,m) < 24 THEN 'c_6_24mo' ELSE 'd_24mo_plus' END tenure,
    IFF(acct.free_email,'free','business') email, IFF(gh.account_id IS NULL,'no','yes') student,
    LEAD(m) OVER (PARTITION BY am.account_id ORDER BY m) nxt,
    LAG(m) OVER (PARTITION BY am.account_id ORDER BY m) prv
  FROM am JOIN acct USING (account_id) LEFT JOIN gh ON gh.account_id = am.account_id
)
SELECT TO_CHAR(m,'YYYY-MM') month,
  CASE WHEN GROUPING(band)=0 THEN 'spend_band' WHEN GROUPING(tenure)=0 THEN 'tenure' WHEN GROUPING(email)=0 THEN 'email_type' WHEN GROUPING(student)=0 THEN 'student_pack' ELSE 'all' END dim,
  COALESCE(band,tenure,email,student,'all') val,
  COUNT(*) active, ROUND(SUM(g)) gross, ROUND(SUM(net)) net,
  COUNT_IF(prv IS NULL OR prv < DATEADD('month',-1,m)) new_or_returning,
  IFF(m = '{{month_start}}', NULL, COUNT_IF(nxt IS NULL OR nxt > DATEADD('month',3,m))) churned,
  IFF(m = '{{month_start}}', NULL, COUNT_IF(nxt > DATEADD('month',3,m))) churned_later_returned
FROM x WHERE m >= '{{window_start}}'
GROUP BY GROUPING SETS ((m),(m,band),(m,tenure),(m,email),(m,student))
ORDER BY 1,2,3

-- @query token_created
-- Personal-token proxy: tokens created per month by expiry bucket, accounts holding a valid token at month end.
WITH {{block:acct}},
am AS (
  SELECT n.account_id, n.invoice_start_date m FROM PRODUCTION.MFD.INVOICE_ITEMS_NET n JOIN acct USING (account_id)
  WHERE n._deleted_at IS NULL AND n.invoice_start_date BETWEEN '{{window_start}}' AND '{{month_start}}'
  GROUP BY 1,2 HAVING SUM(n.gross_amount) > 0
),
tok AS (
  SELECT t.account_id, t.created_at, t.revoked_at,
    IFF(t.expires_in IS NULL, NULL, DATEADD('second', t.expires_in, t.created_at)) exp_at,
    CASE WHEN t.application_id = 109918 THEN 'no_expiry_rbac_app109918'
         WHEN t.application_id = 30327 THEN 'no_expiry_readwrite_app30327'
         WHEN t.expires_in = 2592000 THEN 'exp_30d' WHEN t.expires_in = 5184000 THEN 'exp_60d'
         WHEN t.expires_in = 7776000 THEN 'exp_90d' ELSE 'exp_1y' END bucket
  FROM PRODUCTION.TRANSFORMED_DATA.OAUTH_ACCESS_TOKENS t JOIN acct USING (account_id)
  WHERE t._deleted_at IS NULL AND {{block:pat_filter}}
),
mo AS (SELECT DATEADD('month', SEQ4(), '{{window_start}}'::date) m FROM TABLE(GENERATOR(ROWCOUNT => {{n_months}}))),
created AS (
  SELECT DATE_TRUNC('month', created_at)::date m, bucket, COUNT(*) tokens, COUNT(DISTINCT account_id) accts
  FROM tok WHERE created_at >= '{{window_start}}' AND created_at < '{{month_end}}' GROUP BY GROUPING SETS ((1,2),(1))
),
created_active AS (
  SELECT am.m, COUNT(DISTINCT am.account_id) accts_active_created
  FROM am JOIN tok ON tok.account_id=am.account_id AND DATE_TRUNC('month',tok.created_at)=am.m GROUP BY 1
),
held AS (
  SELECT mo.m, COUNT(DISTINCT tok.account_id) accts_holding
  FROM mo JOIN tok ON tok.created_at < DATEADD('month',1,mo.m)
    AND (tok.revoked_at IS NULL OR tok.revoked_at >= DATEADD('month',1,mo.m))
    AND (tok.exp_at IS NULL OR tok.exp_at >= DATEADD('month',1,mo.m))
  GROUP BY 1
),
held_active AS (
  SELECT am.m, COUNT(DISTINCT am.account_id) active_holding FROM am JOIN tok ON tok.account_id=am.account_id
    AND tok.created_at < DATEADD('month',1,am.m)
    AND (tok.revoked_at IS NULL OR tok.revoked_at >= DATEADD('month',1,am.m))
    AND (tok.exp_at IS NULL OR tok.exp_at >= DATEADD('month',1,am.m))
  GROUP BY 1
)
SELECT TO_CHAR(c.m,'YYYY-MM') month, COALESCE(c.bucket,'any_pat_proxy') bucket, c.tokens, c.accts accts_created,
  IFF(c.bucket IS NULL, ca.accts_active_created, NULL) active_accts_created,
  IFF(c.bucket IS NULL, h.accts_holding, NULL) accts_holding_valid,
  IFF(c.bucket IS NULL, ha.active_holding, NULL) active_accts_holding_valid
FROM created c LEFT JOIN created_active ca ON ca.m=c.m LEFT JOIN held h ON h.m=c.m LEFT JOIN held_active ha ON ha.m=c.m
ORDER BY 1,2

-- @query token_snapshot
-- LAST_USED_AT is a current snapshot, so this is only valid for the run month, run soon after month end.
-- Agent endpoint keys (model access to agents) are rebuilt for the whole window from created_at.
WITH {{block:acct}},
tok AS (
  SELECT t.account_id, t.last_used_at,
    IFF(t.expires_in IS NULL, NULL, DATEADD('second', t.expires_in, t.created_at)) exp_at, t.revoked_at, t.created_at
  FROM PRODUCTION.TRANSFORMED_DATA.OAUTH_ACCESS_TOKENS t JOIN acct USING (account_id)
  WHERE t._deleted_at IS NULL AND {{block:pat_filter}}
),
valid AS (SELECT * FROM tok WHERE created_at < '{{month_end}}' AND (revoked_at IS NULL OR revoked_at >= '{{month_end}}') AND (exp_at IS NULL OR exp_at >= '{{month_end}}'))
SELECT '{{month_label}}' month, 'token_snapshot' dim, 'valid_at_month_end' val, COUNT(*) tokens, COUNT(DISTINCT account_id) accounts FROM valid
UNION ALL SELECT '{{month_label}}','token_snapshot','valid_used_in_month', COUNT(*), COUNT(DISTINCT account_id) FROM valid WHERE last_used_at >= '{{month_start}}' AND last_used_at < '{{month_end}}'
UNION ALL SELECT '{{month_label}}','token_snapshot','valid_used_since_month_start', COUNT(*), COUNT(DISTINCT account_id) FROM valid WHERE last_used_at >= '{{month_start}}'
UNION ALL SELECT '{{month_label}}','token_snapshot','valid_never_used', COUNT(*), COUNT(DISTINCT account_id) FROM valid WHERE last_used_at IS NULL
UNION ALL SELECT '{{month_label}}','token_snapshot','valid_idle_90d_plus', COUNT(*), COUNT(DISTINCT account_id) FROM valid WHERE last_used_at < '{{idle_cutoff}}'
UNION ALL
SELECT TO_CHAR(DATE_TRUNC('month',k.created_at),'YYYY-MM'), 'agent_endpoint_keys', 'created', COUNT(*), COUNT(DISTINCT ag.account_id)
FROM PRODUCTION.TRANSFORMED_DATA.GEN_AI_AGENT_API_KEYS k JOIN PRODUCTION.TRANSFORMED_DATA.GEN_AI_STARFISH_AGENTS ag ON ag.id = k.agent_id JOIN acct ON acct.account_id = ag.account_id
WHERE k._deleted_at IS NULL AND k.created_at >= '{{window_start}}' AND k.created_at < '{{month_end}}' GROUP BY 1
ORDER BY 1,2,3
