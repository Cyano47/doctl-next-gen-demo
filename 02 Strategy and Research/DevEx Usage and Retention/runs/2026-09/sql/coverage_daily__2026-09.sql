-- 06_mcp.sql @query coverage_daily sample day 2026-09-09
-- Daily-table accounts on the raw-log sample day, for the coverage check: divide by the same family's
-- accounts in libraries_sample (api host). Normal days run about 0.65-0.75; May and August 2026 ran about 0.4.
WITH acct AS (
  SELECT a.id account_id, a.created_at::date cd, COALESCE(a.is_free_email_domain,FALSE) free_email
  FROM PRODUCTION.CORE.ACCOUNTS a
  WHERE a.account_urn_type='team' AND NOT COALESCE(a.is_test,FALSE) AND NOT COALESCE(a.is_abuse,FALSE)
    AND NOT COALESCE(a.is_admin_locked,FALSE) AND NOT COALESCE(a.is_free,FALSE) AND NOT COALESCE(a.is_free_employee,FALSE)
    AND COALESCE(a.email_address,'') NOT ILIKE '%@digitalocean.com'
)
SELECT TO_CHAR(r.request_date,'YYYY-MM') month, r.request_date sample_day,
 CASE WHEN r.user_agent ILIKE 'do-remote-mcp%' THEN 'mcp_remote' WHEN r.user_agent ILIKE ANY ('mcp-digitalocean%','digitalocean-mcp%','do-mcp%') THEN 'mcp_local' WHEN r.user_agent ILIKE 'doctl%' THEN 'doctl' ELSE 'terraform' END family,
 COUNT(DISTINCT r.account_id) accounts, SUM(r.num_requests) reqs
FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY r JOIN acct USING (account_id)
WHERE r._deleted_at IS NULL AND r.request_date = '2026-09-09'
 AND r.product NOT IN ('billing','my','registry') AND NOT r.user_agent ILIKE 'mcp-e2e%'
 AND r.user_agent ILIKE ANY ('do-remote-mcp%','mcp-digitalocean%','digitalocean-mcp%','do-mcp%','doctl%','terraform%','%terraform-provider%')
GROUP BY 1,2,3 ORDER BY 3,1
