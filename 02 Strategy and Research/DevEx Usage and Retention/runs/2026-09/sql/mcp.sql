-- 06_mcp.sql @query mcp for 2026-09
WITH acct AS (
  SELECT a.id account_id, a.created_at::date cd, COALESCE(a.is_free_email_domain,FALSE) free_email
  FROM PRODUCTION.CORE.ACCOUNTS a
  WHERE a.account_urn_type='team' AND NOT COALESCE(a.is_test,FALSE) AND NOT COALESCE(a.is_abuse,FALSE)
    AND NOT COALESCE(a.is_admin_locked,FALSE) AND NOT COALESCE(a.is_free,FALSE) AND NOT COALESCE(a.is_free_employee,FALSE)
    AND COALESCE(a.email_address,'') NOT ILIKE '%@digitalocean.com'
),
r AS (
  SELECT r.account_id, DATE_TRUNC('month', r.request_date)::date m, IFF(r.user_agent ILIKE 'do-remote-mcp%','mcp_remote','mcp_local') t, r.product,
    r.num_requests n, r.num_post_requests+r.num_put_requests+r.num_patch_requests+r.num_delete_requests w
  FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY r JOIN acct USING (account_id)
  WHERE r._deleted_at IS NULL AND r.request_date >= '2026-01-01' AND r.request_date < '2026-10-01'
    AND r.user_agent ILIKE ANY ('do-remote-mcp%','mcp-digitalocean%','digitalocean-mcp%','do-mcp%') AND NOT r.user_agent ILIKE 'mcp-e2e%'
),
am AS (SELECT account_id, t, m, SUM(n) n, SUM(w) w FROM r GROUP BY 1,2,3),
x AS (SELECT am.*, LAG(m) OVER (PARTITION BY account_id, t ORDER BY m) prv, MIN(m) OVER (PARTITION BY account_id, t) first_m FROM am),
both_ AS (SELECT m, account_id FROM am GROUP BY 1,2 HAVING COUNT(DISTINCT t) = 2),
summary AS (
  SELECT TO_CHAR(m,'YYYY-MM') month, 'mcp_type' dim, t val, COUNT(*) accounts, SUM(n) reqs, SUM(w) writes,
    IFF(MIN(m) = '2026-01-01', NULL, COUNT_IF(first_m = m)) new_accounts,
    IFF(MIN(m) = '2026-01-01', NULL, COUNT_IF(prv = DATEADD('month',-1,m))) retained_from_prev
  FROM x GROUP BY 1,2,3
  UNION ALL SELECT TO_CHAR(m,'YYYY-MM'), 'mcp_type', 'both_same_month', COUNT(*), NULL, NULL, NULL, NULL FROM both_ GROUP BY 1
),
prod AS (
  SELECT TO_CHAR(m,'YYYY-MM') month, 'mcp_product' dim, t || '|' || COALESCE(product,'none') val, COUNT(DISTINCT account_id) accounts, SUM(n) reqs, SUM(w) writes, NULL new_accounts, NULL retained_from_prev
  FROM r GROUP BY 1,2,3 QUALIFY ROW_NUMBER() OVER (PARTITION BY month, SPLIT_PART(val,'|',1) ORDER BY accounts DESC) <= 6
)
SELECT * FROM summary UNION ALL SELECT * FROM prod ORDER BY 1,2,3
