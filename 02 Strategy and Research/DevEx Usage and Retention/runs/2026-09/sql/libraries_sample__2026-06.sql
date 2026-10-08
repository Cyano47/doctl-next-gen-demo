-- 05_libraries.sql @query libraries_sample sample day 2026-06-10
WITH acct AS (
  SELECT a.id account_id, a.created_at::date cd, COALESCE(a.is_free_email_domain,FALSE) free_email
  FROM PRODUCTION.CORE.ACCOUNTS a
  WHERE a.account_urn_type='team' AND NOT COALESCE(a.is_test,FALSE) AND NOT COALESCE(a.is_abuse,FALSE)
    AND NOT COALESCE(a.is_admin_locked,FALSE) AND NOT COALESCE(a.is_free,FALSE) AND NOT COALESCE(a.is_free_employee,FALSE)
    AND COALESCE(a.email_address,'') NOT ILIKE '%@digitalocean.com'
),
e AS (
  SELECT r.account_id, r.user_id, r.request_method, IFF(r.host ILIKE 'api.digitalocean.com%','api','inference') host_grp, LOWER(r.user_agent) ua, SPLIT_PART(r.path,'/',3) product, COUNT(*) n
  FROM PRODUCTION.TRANSFORMED_DATA.EDGE_API_REQUESTS r
  WHERE r.request_timestamp >= '2026-06-10' AND r.request_timestamp < '2026-06-11'
    AND (r.host ILIKE 'api.digitalocean.com%' OR r.host ILIKE '%do-ai.run%' OR r.host ILIKE '%inference%')
  GROUP BY 1,2,3,4,5,6
)
SELECT '2026-06' month, '2026-06-10' sample_day, host_grp, CASE
   WHEN product IN ('billing','my') OR ua IN ('sfdc-callout','service','services','widget','user_agent') OR ua ILIKE ANY ('mcp-e2e%','k8saasdev%') THEN 'x_internal'
   WHEN ua ILIKE ANY ('%cloud-controller-manager%','cluster-autoscaler%','csi-digitalocean%','doks-%','cert-manager%','externaldns%','external-dns%','do-operator%') THEN 'k8s_controllers'
   WHEN product = 'registry' OR ua ILIKE ANY ('containerd%','docker%','go-containerregistry%','crane%','kaniko%','skopeo%','cosign%','buildah%','trivy%','helm%','containers%') THEN 'container_registry'
   WHEN ua ILIKE 'do-remote-mcp%' THEN 'mcp_remote'
   WHEN ua ILIKE ANY ('mcp-digitalocean%','digitalocean-mcp%','do-mcp%') THEN 'mcp_local'
   WHEN ua ILIKE '%mcp%' THEN 'mcp_third_party'
   WHEN ua ILIKE ANY ('opencode%','claude%','codex%','litellm%','hermes-agent%','%langchain%','openai%','chatgpt%') OR (ua ILIKE '%agent%' AND NOT ua ILIKE ANY ('meta-externalagent%','mozilla%','github cli%')) THEN 'agent_clients'
   WHEN ua ILIKE 'doctl%' THEN 'doctl'
   WHEN ua ILIKE ANY ('terraform%','%terraform-provider%') THEN 'terraform'
   WHEN ua ILIKE ANY ('pulumi%','ansible%','packer%','crossplane%','jclouds%') THEN 'iac_other'
   WHEN ua ILIKE '%pydo%' THEN 'sdk_pydo'
   WHEN ua ILIKE ANY ('godo%','% godo%') THEN 'sdk_godo'
   WHEN ua ILIKE ANY ('%dots%','dropletkit%') THEN 'sdk_other_official'
   WHEN ua ILIKE ANY ('python-digitalocean%','digitalocean-php-api-client%','digitalocean-api-dotnet%','passport-digitalocean%') THEN 'community_libs'
   WHEN ua ILIKE ANY ('do-app-action%','%github-actions%') THEN 'ci_actions'
   WHEN ua ILIKE 'curl%' THEN 'curl'
   WHEN ua ILIKE ANY ('go-http-client%','python-httpx%','python-requests%','python-urllib%','python%','axios%','node%','undici%','got%','bun%','deno%','guzzlehttp%','okhttp%','apache-httpclient%','java%','ruby%','faraday%','symfony%','postmanruntime%','aiohttp%','reqwest%','dart%') THEN 'raw_http'
   WHEN ua ILIKE 'mozilla%' THEN 'browser'
   WHEN COALESCE(ua,'')='' THEN 'unknown_ua'
   ELSE 'third_party_and_other' END family,
  SUM(n) reqs, SUM(IFF(request_method IN ('POST','PUT','PATCH','DELETE'), n, 0)) writes, COUNT(DISTINCT e.account_id) accounts, COUNT(DISTINCT user_id) users
FROM e JOIN acct ON acct.account_id = e.account_id GROUP BY 1,2,3,4 ORDER BY 3,5 DESC
