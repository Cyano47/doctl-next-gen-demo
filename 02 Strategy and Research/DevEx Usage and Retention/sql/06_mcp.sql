-- Workstream 6: MCP remote vs local, from the daily table. Remote = do-remote-mcp%; local = the stdio server UAs.
-- new_accounts = first month seen in the window, so it is blank for the window's first month.
-- mcp-e2e% is DigitalOcean's own end-to-end test traffic.

-- @query mcp
WITH {{block:acct}},
r AS (
  SELECT r.account_id, DATE_TRUNC('month', r.request_date)::date m, IFF(r.user_agent ILIKE 'do-remote-mcp%','mcp_remote','mcp_local') t, r.product,
    r.num_requests n, r.num_post_requests+r.num_put_requests+r.num_patch_requests+r.num_delete_requests w
  FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY r JOIN acct USING (account_id)
  WHERE r._deleted_at IS NULL AND r.request_date >= '{{window_start}}' AND r.request_date < '{{month_end}}'
    AND r.user_agent ILIKE ANY ('do-remote-mcp%','mcp-digitalocean%','digitalocean-mcp%','do-mcp%') AND NOT r.user_agent ILIKE 'mcp-e2e%'
),
am AS (SELECT account_id, t, m, SUM(n) n, SUM(w) w FROM r GROUP BY 1,2,3),
x AS (SELECT am.*, LAG(m) OVER (PARTITION BY account_id, t ORDER BY m) prv, MIN(m) OVER (PARTITION BY account_id, t) first_m FROM am),
both_ AS (SELECT m, account_id FROM am GROUP BY 1,2 HAVING COUNT(DISTINCT t) = 2),
summary AS (
  SELECT TO_CHAR(m,'YYYY-MM') month, 'mcp_type' dim, t val, COUNT(*) accounts, SUM(n) reqs, SUM(w) writes,
    IFF(MIN(m) = '{{window_start}}', NULL, COUNT_IF(first_m = m)) new_accounts,
    IFF(MIN(m) = '{{window_start}}', NULL, COUNT_IF(prv = DATEADD('month',-1,m))) retained_from_prev
  FROM x GROUP BY 1,2,3
  UNION ALL SELECT TO_CHAR(m,'YYYY-MM'), 'mcp_type', 'both_same_month', COUNT(*), NULL, NULL, NULL, NULL FROM both_ GROUP BY 1
),
prod AS (
  SELECT TO_CHAR(m,'YYYY-MM') month, 'mcp_product' dim, t || '|' || COALESCE(product,'none') val, COUNT(DISTINCT account_id) accounts, SUM(n) reqs, SUM(w) writes, NULL new_accounts, NULL retained_from_prev
  FROM r GROUP BY 1,2,3 QUALIFY ROW_NUMBER() OVER (PARTITION BY month, SPLIT_PART(val,'|',1) ORDER BY accounts DESC) <= 6
)
SELECT * FROM summary UNION ALL SELECT * FROM prod ORDER BY 1,2,3

-- @query coverage_daily per_sample_day
-- Daily-table accounts on the raw-log sample day, for the coverage check: divide by the same family's
-- accounts in libraries_sample (api host). Normal days run about 0.65-0.75; May and August 2026 ran about 0.4.
WITH {{block:acct}}
SELECT TO_CHAR(r.request_date,'YYYY-MM') month, r.request_date sample_day,
 CASE WHEN r.user_agent ILIKE 'do-remote-mcp%' THEN 'mcp_remote' WHEN r.user_agent ILIKE ANY ('mcp-digitalocean%','digitalocean-mcp%','do-mcp%') THEN 'mcp_local' WHEN r.user_agent ILIKE 'doctl%' THEN 'doctl' ELSE 'terraform' END family,
 COUNT(DISTINCT r.account_id) accounts, SUM(r.num_requests) reqs
FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY r JOIN acct USING (account_id)
WHERE r._deleted_at IS NULL AND r.request_date = '{{sample_day}}'
 AND r.product NOT IN ('billing','my','registry') AND NOT r.user_agent ILIKE 'mcp-e2e%'
 AND r.user_agent ILIKE ANY ('do-remote-mcp%','mcp-digitalocean%','digitalocean-mcp%','do-mcp%','doctl%','terraform%','%terraform-provider%')
GROUP BY 1,2,3 ORDER BY 3,1
