-- 04_agentic.sql @query agentic_adjacency for 2026-09
-- Run month only: which product groups agentic accounts buy, vs everyone else active that month.
WITH acct AS (
  SELECT a.id account_id, a.created_at::date cd, COALESCE(a.is_free_email_domain,FALSE) free_email
  FROM PRODUCTION.CORE.ACCOUNTS a
  WHERE a.account_urn_type='team' AND NOT COALESCE(a.is_test,FALSE) AND NOT COALESCE(a.is_abuse,FALSE)
    AND NOT COALESCE(a.is_admin_locked,FALSE) AND NOT COALESCE(a.is_free,FALSE) AND NOT COALESCE(a.is_free_employee,FALSE)
    AND COALESCE(a.email_address,'') NOT ILIKE '%@digitalocean.com'
),
s AS (SELECT sku, ANY_VALUE(product_name) pn FROM PRODUCTION.PRICING.SKU_DETAIL_CONSOLIDATED WHERE _deleted_at IS NULL GROUP BY 1),
it AS (
  SELECT n.account_id, CASE WHEN s.pn IS NULL THEN 'other_unmapped'
    WHEN s.pn ILIKE ANY ('%serverless inference%','%input tokens%','%output tokens%','%cache%tokens%') THEN 'inference_serverless'
    WHEN s.pn ILIKE '%dedicated inference%' THEN 'inference_dedicated'
    WHEN s.pn ILIKE ANY ('%agent%','%harness%','%action gateway%','%sandbox%','%knowledge base%','%indexing%') THEN 'agents'
    WHEN s.pn ILIKE ANY ('%nvidia%','%amd mi%','%h100%','%h200%','%b300%','%l40%','%rtx%','%gpu%','%a100%','%a6000%') THEN 'gpu'
    WHEN s.pn ILIKE ANY ('%load balancer%','%lbaas%','%bandwidth%','%reserved ip%','%floating ip%','%vpc%','%nat gateway%','%ddos%') THEN 'networking'
    WHEN s.pn ILIKE ANY ('kubernetes%','%doks%') THEN 'kubernetes'
    WHEN s.pn ILIKE ANY ('%container instance%','%app platform%','%static site%','%functions%') THEN 'app_platform_functions'
    WHEN s.pn ILIKE ANY ('pg%','%mysql%','%redis%','%valkey%','%mongo%','%kafka%','%opensearch%','%database%','%vector%') THEN 'databases'
    WHEN s.pn ILIKE ANY ('%volume%','%spaces%','%snapshot%','%backup%','%nfs%','%storage%','%registry%') THEN 'storage_registry'
    WHEN s.pn ILIKE '%droplet%' THEN 'droplets'
    ELSE 'other' END grp
  FROM PRODUCTION.MFD.INVOICE_ITEMS_NET n JOIN acct USING (account_id) LEFT JOIN s ON s.sku = n.sku
  WHERE n._deleted_at IS NULL AND n.invoice_start_date = '2026-09-01' AND n.gross_amount > 0
),
ag AS (
  SELECT DISTINCT account_id FROM PRODUCTION.TRANSFORMED_DATA.SERVERLESS_INFERENCE_GPU_NET_REVENUE WHERE date_stamp >= '2026-09-01' AND date_stamp < '2026-10-01' AND NOT COALESCE(is_excluded,FALSE)
  UNION SELECT DISTINCT account_id FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY WHERE request_date >= '2026-09-01' AND request_date < '2026-10-01'
    AND user_agent ILIKE ANY ('do-remote-mcp%','mcp-digitalocean%','digitalocean-mcp%','do-mcp%','opencode%','claude%','codex%','litellm%')
  UNION SELECT DISTINCT account_id FROM PRODUCTION.TRANSFORMED_DATA.GEN_AI_STARFISH_AGENTS WHERE created_at >= '2026-09-01' AND created_at < '2026-10-01'
),
act AS (SELECT DISTINCT account_id FROM it)
SELECT '2026-09' month, IFF(ag.account_id IS NULL,'non_agentic','agentic') cohort, it.grp product_group, COUNT(DISTINCT it.account_id) accounts,
  ANY_VALUE(c.n) cohort_size
FROM it LEFT JOIN ag USING (account_id)
JOIN (SELECT IFF(ag2.account_id IS NULL,'non_agentic','agentic') coh, COUNT(*) n FROM act LEFT JOIN ag ag2 USING (account_id) GROUP BY 1) c ON c.coh = IFF(ag.account_id IS NULL,'non_agentic','agentic')
GROUP BY 1,2,3 ORDER BY 2,4 DESC
