-- 03_revenue.sql @query revenue_products for 2026-09
WITH acct AS (
  SELECT a.id account_id, a.created_at::date cd, COALESCE(a.is_free_email_domain,FALSE) free_email
  FROM PRODUCTION.CORE.ACCOUNTS a
  WHERE a.account_urn_type='team' AND NOT COALESCE(a.is_test,FALSE) AND NOT COALESCE(a.is_abuse,FALSE)
    AND NOT COALESCE(a.is_admin_locked,FALSE) AND NOT COALESCE(a.is_free,FALSE) AND NOT COALESCE(a.is_free_employee,FALSE)
    AND COALESCE(a.email_address,'') NOT ILIKE '%@digitalocean.com'
),
s AS (SELECT sku, ANY_VALUE(product_name) pn FROM PRODUCTION.PRICING.SKU_DETAIL_CONSOLIDATED WHERE _deleted_at IS NULL GROUP BY 1),
it AS (
  SELECT n.account_id, n.invoice_start_date m, n.gross_amount g, n.net_amount net,
  CASE WHEN s.pn IS NULL THEN 'other_unmapped'
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
  WHERE n._deleted_at IS NULL AND n.invoice_start_date BETWEEN '2026-01-01' AND '2026-09-01'
),
tot AS (SELECT account_id, m, SUM(g) tg FROM it GROUP BY 1,2 HAVING SUM(g) > 0)
SELECT TO_CHAR(it.m,'YYYY-MM') month, 'product_group' dim, it.grp val, COUNT(DISTINCT IFF(it.g>0, it.account_id, NULL)) accounts, ROUND(SUM(it.g)) gross, ROUND(SUM(it.net)) net
FROM it JOIN tot ON tot.account_id=it.account_id AND tot.m=it.m GROUP BY 1,2,3
UNION ALL
SELECT TO_CHAR(it.m,'YYYY-MM'), 'product_group_by_band', it.grp || '|' || CASE WHEN tot.tg < 10 THEN 'a_lt10' WHEN tot.tg < 50 THEN 'b_10_50' WHEN tot.tg < 500 THEN 'c_50_500' WHEN tot.tg < 5000 THEN 'd_500_5k' ELSE 'e_5k_plus' END,
  COUNT(DISTINCT IFF(it.g>0, it.account_id, NULL)), ROUND(SUM(it.g)), ROUND(SUM(it.net))
FROM it JOIN tot ON tot.account_id=it.account_id AND tot.m=it.m WHERE it.m = '2026-09-01' GROUP BY 1,2,3
ORDER BY 1,2,3
