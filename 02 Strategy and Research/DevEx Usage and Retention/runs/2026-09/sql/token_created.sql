-- 01_base_tokens.sql @query token_created for 2026-09
-- Personal-token proxy: tokens created per month by expiry bucket, accounts holding a valid token at month end.
WITH acct AS (
  SELECT a.id account_id, a.created_at::date cd, COALESCE(a.is_free_email_domain,FALSE) free_email
  FROM PRODUCTION.CORE.ACCOUNTS a
  WHERE a.account_urn_type='team' AND NOT COALESCE(a.is_test,FALSE) AND NOT COALESCE(a.is_abuse,FALSE)
    AND NOT COALESCE(a.is_admin_locked,FALSE) AND NOT COALESCE(a.is_free,FALSE) AND NOT COALESCE(a.is_free_employee,FALSE)
    AND COALESCE(a.email_address,'') NOT ILIKE '%@digitalocean.com'
),
am AS (
  SELECT n.account_id, n.invoice_start_date m FROM PRODUCTION.MFD.INVOICE_ITEMS_NET n JOIN acct USING (account_id)
  WHERE n._deleted_at IS NULL AND n.invoice_start_date BETWEEN '2026-01-01' AND '2026-09-01'
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
  WHERE t._deleted_at IS NULL AND ((t.application_id = 1 AND t.expires_in IN (2592000,5184000,7776000,31536000)) OR t.application_id IN (109918,30327))
),
mo AS (SELECT DATEADD('month', SEQ4(), '2026-01-01'::date) m FROM TABLE(GENERATOR(ROWCOUNT => 9))),
created AS (
  SELECT DATE_TRUNC('month', created_at)::date m, bucket, COUNT(*) tokens, COUNT(DISTINCT account_id) accts
  FROM tok WHERE created_at >= '2026-01-01' AND created_at < '2026-10-01' GROUP BY GROUPING SETS ((1,2),(1))
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
