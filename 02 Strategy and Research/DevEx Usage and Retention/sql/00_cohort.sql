-- Shared blocks, pulled into the other files by scripts/render_sql.py as {{block:<name>}}.
-- Definitions: definitions.md (v1). Change a block here and every query picks it up.

-- @block acct
-- Clean accounts, all-time flags. Suspended, hold and deleted accounts are kept on purpose:
-- they are the churners this analysis counts.
acct AS (
  SELECT a.id account_id, a.created_at::date cd, COALESCE(a.is_free_email_domain,FALSE) free_email
  FROM PRODUCTION.CORE.ACCOUNTS a
  WHERE a.account_urn_type='team' AND NOT COALESCE(a.is_test,FALSE) AND NOT COALESCE(a.is_abuse,FALSE)
    AND NOT COALESCE(a.is_admin_locked,FALSE) AND NOT COALESCE(a.is_free,FALSE) AND NOT COALESCE(a.is_free_employee,FALSE)
    AND COALESCE(a.email_address,'') NOT ILIKE '%@digitalocean.com'
)
-- @end

-- @block active_months
-- One row per account per active month (gross billable usage > 0). Needs the acct block first.
am AS (
  SELECT n.account_id, n.invoice_start_date m, SUM(n.gross_amount) g, SUM(n.net_amount) net
  FROM PRODUCTION.MFD.INVOICE_ITEMS_NET n JOIN acct USING (account_id)
  WHERE n._deleted_at IS NULL AND n.invoice_start_date BETWEEN '{{window_start}}' AND '{{month_start}}'
  GROUP BY 1,2 HAVING SUM(n.gross_amount) > 0
)
-- @end

-- @block churn_flag
-- 1 when the account has no billable month in M+1..M+3 (or none yet observed: provisional for the last 3 months).
IFF(LEAD(m) OVER (PARTITION BY account_id ORDER BY m) IS NULL OR LEAD(m) OVER (PARTITION BY account_id ORDER BY m) > DATEADD('month',3,m),1,0)
-- @end

-- @block spend_band_g
CASE WHEN g < 10 THEN 'a_lt10' WHEN g < 50 THEN 'b_10_50' WHEN g < 500 THEN 'c_50_500' WHEN g < 5000 THEN 'd_500_5k' ELSE 'e_5k_plus' END
-- @end

-- @block pat_filter
-- Personal access token proxy. OAUTH_ACCESS_TOKENS has no token-type column; app 1 is mostly session tokens.
((t.application_id = 1 AND t.expires_in IN (2592000,5184000,7776000,31536000)) OR t.application_id IN (109918,30327))
-- @end

-- @block product_group
-- SKU product name to product group, first match wins. Needs s.pn from PRICING.SKU_DETAIL_CONSOLIDATED.
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
    ELSE 'other' END
-- @end

-- @block ua_family_daily
-- Client family for PRODUCT_API_REQUESTS_DAILY rows aliased r. Order matters: first match wins.
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
   ELSE 'third_party_and_other' END
-- @end

-- @block ua_family_edge
-- Same families for EDGE_API_REQUESTS, on lower-cased ua and product = first path segment after /v2/.
-- The raw log carries the full user agent, so godo matches anywhere after a space ('% godo%').
CASE
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
   ELSE 'third_party_and_other' END
-- @end
