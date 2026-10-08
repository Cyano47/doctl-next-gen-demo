-- Workstream 5: client library evolution.
-- libraries_sample reads the raw log for ONE sample day (second Wednesday of the month). About 376M rows a day:
-- one day per query fits the 5-minute XS timeout, three days do not. render_sql.py writes one file per sample day;
-- concatenate the results into libraries_sample.csv. A new run only needs the new month's day.

-- @query libraries_sample per_sample_day
WITH {{block:acct}},
e AS (
  SELECT r.account_id, r.user_id, r.request_method, IFF(r.host ILIKE 'api.digitalocean.com%','api','inference') host_grp, LOWER(r.user_agent) ua, SPLIT_PART(r.path,'/',3) product, COUNT(*) n
  FROM PRODUCTION.TRANSFORMED_DATA.EDGE_API_REQUESTS r
  WHERE r.request_timestamp >= '{{sample_day}}' AND r.request_timestamp < '{{sample_next}}'
    AND (r.host ILIKE 'api.digitalocean.com%' OR r.host ILIKE '%do-ai.run%' OR r.host ILIKE '%inference%')
  GROUP BY 1,2,3,4,5,6
)
SELECT '{{sample_month}}' month, '{{sample_day}}' sample_day, host_grp, {{block:ua_family_edge}} family,
  SUM(n) reqs, SUM(IFF(request_method IN ('POST','PUT','PATCH','DELETE'), n, 0)) writes, COUNT(DISTINCT e.account_id) accounts, COUNT(DISTINCT user_id) users
FROM e JOIN acct ON acct.account_id = e.account_id GROUP BY 1,2,3,4 ORDER BY 3,5 DESC

-- @query library_products
-- Run month only, daily table: top 6 products (by accounts) each library touches.
WITH {{block:acct}},
r AS (
  SELECT r.account_id, r.product, r.num_requests n, r.num_post_requests+r.num_put_requests+r.num_patch_requests+r.num_delete_requests w,
  {{block:ua_family_daily}} fam
  FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY r JOIN acct USING (account_id)
  WHERE r._deleted_at IS NULL AND r.request_date >= '{{month_start}}' AND r.request_date < '{{month_end}}'
),
g AS (SELECT fam, product, COUNT(DISTINCT account_id) accounts, SUM(n) reqs, SUM(w) writes FROM r WHERE fam IN ('doctl','terraform','sdk_pydo','sdk_godo','sdk_other_official','community_libs','curl','raw_http','mcp_remote','mcp_local','agent_clients','iac_other','ci_actions') GROUP BY 1,2)
SELECT '{{month_label}}' month, fam family, product, accounts, reqs, writes FROM g QUALIFY ROW_NUMBER() OVER (PARTITION BY fam ORDER BY accounts DESC) <= 6 ORDER BY 2, 4 DESC
