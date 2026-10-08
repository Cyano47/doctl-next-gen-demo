-- 05_libraries.sql @query library_products for 2026-09
-- Run month only, daily table: top 6 products (by accounts) each library touches.
WITH acct AS (
  SELECT a.id account_id, a.created_at::date cd, COALESCE(a.is_free_email_domain,FALSE) free_email
  FROM PRODUCTION.CORE.ACCOUNTS a
  WHERE a.account_urn_type='team' AND NOT COALESCE(a.is_test,FALSE) AND NOT COALESCE(a.is_abuse,FALSE)
    AND NOT COALESCE(a.is_admin_locked,FALSE) AND NOT COALESCE(a.is_free,FALSE) AND NOT COALESCE(a.is_free_employee,FALSE)
    AND COALESCE(a.email_address,'') NOT ILIKE '%@digitalocean.com'
),
r AS (
  SELECT r.account_id, r.product, r.num_requests n, r.num_post_requests+r.num_put_requests+r.num_patch_requests+r.num_delete_requests w,
  CASE
   WHEN r.product IN ('billing','my') OR r.user_agent IN ('SFDC-Callout','service','services','widget','USER_AGENT') OR r.user_agent ILIKE ANY ('mcp-e2e%','k8saasdev%') THEN 'x_internal'
   WHEN r.user_agent ILIKE ANY ('%cloud-controller-manager%','cluster-autoscaler%','csi-digitalocean%','doks-%','cert-manager%','ExternalDNS%','external-dns%','do-operator%') THEN 'k8s_controllers'
   WHEN r.product = 'registry' OR r.user_agent ILIKE ANY ('containerd%','docker%','go-containerregistry%','crane%','kaniko%','skopeo%','cosign%','buildah%','trivy%','helm%','containers%') THEN 'container_registry'
   WHEN r.user_agent ILIKE 'do-remote-mcp%' THEN 'mcp_remote'
   WHEN r.user_agent ILIKE ANY ('mcp-digitalocean%','digitalocean-mcp%','do-mcp%') THEN 'mcp_local'
   WHEN r.user_agent ILIKE '%mcp%' THEN 'mcp_third_party'
   WHEN r.user_agent ILIKE ANY ('opencode%','claude%','codex%','litellm%','hermes-agent%','%langchain%','openai%','chatgpt%') OR (r.user_agent ILIKE '%agent%' AND NOT r.user_agent ILIKE ANY ('meta-externalagent%','mozilla%','github cli%')) THEN 'agent_clients'
   WHEN r.user_agent ILIKE 'doctl%' THEN 'doctl'
   WHEN r.user_agent ILIKE ANY ('terraform%','%terraform-provider%') THEN 'terraform'
   WHEN r.user_agent ILIKE ANY ('pulumi%','ansible%','packer%','crossplane%','jclouds%') THEN 'iac_other'
   WHEN r.user_agent ILIKE '%pydo%' THEN 'sdk_pydo'
   WHEN r.user_agent ILIKE ANY ('godo%','% godo') THEN 'sdk_godo'
   WHEN r.user_agent ILIKE ANY ('%dots%','dropletkit%') THEN 'sdk_other_official'
   WHEN r.user_agent ILIKE ANY ('python-digitalocean%','digitalocean-php-api-client%','digitalocean-api-dotnet%','passport-digitalocean%') THEN 'community_libs'
   WHEN r.user_agent ILIKE ANY ('do-app-action%','%github-actions%') THEN 'ci_actions'
   WHEN r.user_agent ILIKE 'curl%' THEN 'curl'
   WHEN r.user_agent ILIKE ANY ('go-http-client%','python-httpx%','python-requests%','python-urllib%','python%','axios%','node%','undici%','got%','bun%','deno%','guzzlehttp%','okhttp%','apache-httpclient%','java%','ruby%','faraday%','symfony%','postmanruntime%','aiohttp%','reqwest%','dart%') THEN 'raw_http'
   WHEN r.user_agent ILIKE 'mozilla%' THEN 'browser'
   WHEN COALESCE(r.user_agent,'')='' THEN 'unknown_ua'
   ELSE 'third_party_and_other' END fam
  FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY r JOIN acct USING (account_id)
  WHERE r._deleted_at IS NULL AND r.request_date >= '2026-09-01' AND r.request_date < '2026-10-01'
),
g AS (SELECT fam, product, COUNT(DISTINCT account_id) accounts, SUM(n) reqs, SUM(w) writes FROM r WHERE fam IN ('doctl','terraform','sdk_pydo','sdk_godo','sdk_other_official','community_libs','curl','raw_http','mcp_remote','mcp_local','agent_clients','iac_other','ci_actions') GROUP BY 1,2)
SELECT '2026-09' month, fam family, product, accounts, reqs, writes FROM g QUALIFY ROW_NUMBER() OVER (PARTITION BY fam ORDER BY accounts DESC) <= 6 ORDER BY 2, 4 DESC
