-- Workstream 2: churn by surface (client family) and by token use vs console only.
-- Base churn by spend band, tenure, email type and student pack is in 01_base_tokens.sql (base_churn).
-- PRODUCT_API_REQUESTS_DAILY account counts are directional: its volume shifts month to month (see definitions.md).

-- @query surfaces
WITH {{block:acct}},
{{block:active_months}},
x AS (SELECT am.*, {{block:churn_flag}} ch FROM am),
api AS (
  SELECT r.account_id, DATE_TRUNC('month', r.request_date) m,
  {{block:ua_family_daily}} fam,
  SUM(r.num_requests) reqs, SUM(r.num_post_requests+r.num_put_requests+r.num_patch_requests+r.num_delete_requests) writes
  FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY r
  WHERE r.request_date >= '{{window_start}}' AND r.request_date < '{{month_end}}' AND r._deleted_at IS NULL
  GROUP BY 1,2,3
)
SELECT TO_CHAR(x.m,'YYYY-MM') month, api.fam surface, COUNT(*) accounts, SUM(api.reqs) reqs, SUM(api.writes) writes,
  IFF(MIN(x.m) = '{{month_start}}', NULL, SUM(x.ch)) churned, ROUND(SUM(x.g)) gross
FROM api JOIN x ON x.account_id=api.account_id AND x.m=api.m GROUP BY 1,2
ORDER BY 1,2

-- @query token_use
-- "Used a token" = any programmatic API call that month outside internal, Kubernetes controller, registry and browser traffic.
WITH {{block:acct}},
{{block:active_months}},
x AS (SELECT am.*, {{block:churn_flag}} ch, {{block:spend_band_g}} band FROM am),
api AS (
  SELECT r.account_id, DATE_TRUNC('month', r.request_date) m, {{block:ua_family_daily}} fam
  FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY r
  WHERE r.request_date >= '{{window_start}}' AND r.request_date < '{{month_end}}' AND r._deleted_at IS NULL
  GROUP BY 1,2,3
),
prog AS (SELECT account_id, m FROM api WHERE fam NOT IN ('x_internal','k8s_controllers','container_registry','browser') GROUP BY 1,2)
SELECT TO_CHAR(x.m,'YYYY-MM') month, IFF(GROUPING(x.band)=0,'token_use_by_band','token_use') dim,
  IFF(prog.account_id IS NULL,'console_only','used_token') || IFF(GROUPING(x.band)=0, '|' || x.band, '') val,
  COUNT(*) accounts, IFF(x.m = '{{month_start}}', NULL, SUM(x.ch)) churned, ROUND(SUM(x.g)) gross
FROM x LEFT JOIN prog ON prog.account_id=x.account_id AND prog.m=x.m
GROUP BY GROUPING SETS ((x.m, IFF(prog.account_id IS NULL,'console_only','used_token')), (x.m, IFF(prog.account_id IS NULL,'console_only','used_token'), x.band))
ORDER BY 1,2,3
