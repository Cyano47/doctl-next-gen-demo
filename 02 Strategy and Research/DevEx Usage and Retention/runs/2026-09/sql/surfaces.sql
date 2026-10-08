-- 02_churn.sql @query surfaces for 2026-09
WITH acct AS (
  SELECT a.id account_id, a.created_at::date cd, COALESCE(a.is_free_email_domain,FALSE) free_email
  FROM PRODUCTION.CORE.ACCOUNTS a
  WHERE a.account_urn_type='team' AND NOT COALESCE(a.is_test,FALSE) AND NOT COALESCE(a.is_abuse,FALSE)
    AND NOT COALESCE(a.is_admin_locked,FALSE) AND NOT COALESCE(a.is_free,FALSE) AND NOT COALESCE(a.is_free_employee,FALSE)
    AND COALESCE(a.email_address,'') NOT ILIKE '%@digitalocean.com'
),
am AS (
  SELECT n.account_id, n.invoice_start_date m, SUM(n.gross_amount) g, SUM(n.net_amount) net
  FROM PRODUCTION.MFD.INVOICE_ITEMS_NET n JOIN acct USING (account_id)
  WHERE n._deleted_at IS NULL AND n.invoice_start_date BETWEEN '2026-01-01' AND '2026-09-01'
  GROUP BY 1,2 HAVING SUM(n.gross_amount) > 0
),
x AS (SELECT am.*, IFF(LEAD(m) OVER (PARTITION BY account_id ORDER BY m) IS NULL OR LEAD(m) OVER (PARTITION BY account_id ORDER BY m) > DATEADD('month',3,m),1,0) ch FROM am),
api AS (
  SELECT r.account_id, DATE_TRUNC('month', r.request_date) m,
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
   ELSE 'third_party_and_other' END fam,
  SUM(r.num_requests) reqs, SUM(r.num_post_requests+r.num_put_requests+r.num_patch_requests+r.num_delete_requests) writes
  FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY r
  WHERE r.request_date >= '2026-01-01' AND r.request_date < '2026-10-01' AND r._deleted_at IS NULL
  GROUP BY 1,2,3
)
SELECT TO_CHAR(x.m,'YYYY-MM') month, api.fam surface, COUNT(*) accounts, SUM(api.reqs) reqs, SUM(api.writes) writes,
  IFF(MIN(x.m) = '2026-09-01', NULL, SUM(x.ch)) churned, ROUND(SUM(x.g)) gross
FROM api JOIN x ON x.account_id=api.account_id AND x.m=api.m GROUP BY 1,2
ORDER BY 1,2
