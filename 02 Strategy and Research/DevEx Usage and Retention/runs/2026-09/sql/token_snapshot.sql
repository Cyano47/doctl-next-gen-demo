-- 01_base_tokens.sql @query token_snapshot for 2026-09
-- LAST_USED_AT is a current snapshot, so this is only valid for the run month, run soon after month end.
-- Agent endpoint keys (model access to agents) are rebuilt for the whole window from created_at.
WITH acct AS (
  SELECT a.id account_id, a.created_at::date cd, COALESCE(a.is_free_email_domain,FALSE) free_email
  FROM PRODUCTION.CORE.ACCOUNTS a
  WHERE a.account_urn_type='team' AND NOT COALESCE(a.is_test,FALSE) AND NOT COALESCE(a.is_abuse,FALSE)
    AND NOT COALESCE(a.is_admin_locked,FALSE) AND NOT COALESCE(a.is_free,FALSE) AND NOT COALESCE(a.is_free_employee,FALSE)
    AND COALESCE(a.email_address,'') NOT ILIKE '%@digitalocean.com'
),
tok AS (
  SELECT t.account_id, t.last_used_at,
    IFF(t.expires_in IS NULL, NULL, DATEADD('second', t.expires_in, t.created_at)) exp_at, t.revoked_at, t.created_at
  FROM PRODUCTION.TRANSFORMED_DATA.OAUTH_ACCESS_TOKENS t JOIN acct USING (account_id)
  WHERE t._deleted_at IS NULL AND ((t.application_id = 1 AND t.expires_in IN (2592000,5184000,7776000,31536000)) OR t.application_id IN (109918,30327))
),
valid AS (SELECT * FROM tok WHERE created_at < '2026-10-01' AND (revoked_at IS NULL OR revoked_at >= '2026-10-01') AND (exp_at IS NULL OR exp_at >= '2026-10-01'))
SELECT '2026-09' month, 'token_snapshot' dim, 'valid_at_month_end' val, COUNT(*) tokens, COUNT(DISTINCT account_id) accounts FROM valid
UNION ALL SELECT '2026-09','token_snapshot','valid_used_in_month', COUNT(*), COUNT(DISTINCT account_id) FROM valid WHERE last_used_at >= '2026-09-01' AND last_used_at < '2026-10-01'
UNION ALL SELECT '2026-09','token_snapshot','valid_used_since_month_start', COUNT(*), COUNT(DISTINCT account_id) FROM valid WHERE last_used_at >= '2026-09-01'
UNION ALL SELECT '2026-09','token_snapshot','valid_never_used', COUNT(*), COUNT(DISTINCT account_id) FROM valid WHERE last_used_at IS NULL
UNION ALL SELECT '2026-09','token_snapshot','valid_idle_90d_plus', COUNT(*), COUNT(DISTINCT account_id) FROM valid WHERE last_used_at < '2026-07-01'
UNION ALL
SELECT TO_CHAR(DATE_TRUNC('month',k.created_at),'YYYY-MM'), 'agent_endpoint_keys', 'created', COUNT(*), COUNT(DISTINCT ag.account_id)
FROM PRODUCTION.TRANSFORMED_DATA.GEN_AI_AGENT_API_KEYS k JOIN PRODUCTION.TRANSFORMED_DATA.GEN_AI_STARFISH_AGENTS ag ON ag.id = k.agent_id JOIN acct ON acct.account_id = ag.account_id
WHERE k._deleted_at IS NULL AND k.created_at >= '2026-01-01' AND k.created_at < '2026-10-01' GROUP BY 1
ORDER BY 1,2,3
