-- =============================================================================
-- 57_mcp_19k_cohort_and_services.sql
-- DigitalOcean MCP ~19k Account Cohort, Infrastructure Deployment & Service Attach
-- Window: Release through October 31, 2026 (< '2026-11-01')
-- Warehouse: PRODUCTION (Snowflake DigitalOcean)
--
-- Executed Reference Query IDs (2026-11-24):
--   * Daily MCP Spine & Hygiene: 01c89f63-0821-dd8d-001b-b50227cccd7f,
--       01c89f68-0821-dd8d-001b-b50227cd5fd3, 01c89f69-0821-dd8d-001b-b50227cdebf3
--   * Master Per-Account Feature & Service Vectors (all 19,314 raw / 19,068 clean):
--       01c89f6e-0821-dd8d-001b-b50227cea8d7, 01c89f72-0821-cfce-001b-b50227cf1d0f,
--       01c89f73-0821-cfce-001b-b50227cf5bc7, 01c89f74-0821-dd8d-001b-b50227d00923,
--       01c89f76-0821-cfce-001b-b50227d0533f, 01c89f76-0821-cfce-001b-b50227d05323,
--       01c89f7a-0821-dd8d-001b-b50227d106d3, 01c89f7f-0821-cfce-001b-b50227d22027
--   * MCP Endpoint Verb Breakdown: 01c89f54-0821-dd8d-001b-b50227cb7a1f
--   * 2-Day Raw EDGE_API_REQUESTS 2xx vs 4xx Calibration (2026-09-09 & 2026-10-14):
--       01c89f6a-0821-cfce-001b-b50227ce50e7
--   * Individual Service Gross USD by Cohort: 01c89f7f-0821-cfce-001b-b50227d22023
-- =============================================================================

-- -----------------------------------------------------------------------------
-- QUERY 1: Clean MCP Account Spine, Companion Interface Mix (Only MCP vs MCP +
-- Others), Lifecycle Cohorts (anchored to 2026-10-31), 4-Stage MCP Infra
-- Deployment Ladder, DO Billing Retention & Oct 2026 MoM NRR
-- -----------------------------------------------------------------------------
WITH core_accounts_dedup AS (
  SELECT *
  FROM PRODUCTION.CORE.ACCOUNTS
  QUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY _loaded_at DESC NULLS LAST) = 1
),
api_classified AS (
  SELECT
    r.account_id,
    r.request_date::DATE AS req_date,
    DATE_TRUNC('month', r.request_date)::DATE AS req_month,
    COALESCE(r.product, 'none') AS prod,
    COALESCE(r.num_requests, 0) AS n_req,
    COALESCE(r.num_post_requests, 0) + COALESCE(r.num_put_requests, 0) + COALESCE(r.num_patch_requests, 0) AS n_mut,
    COALESCE(r.num_delete_requests, 0) AS n_del,
    CASE
      WHEN r.product IN ('billing', 'my')
        OR r.user_agent IN ('SFDC-Callout', 'service', 'services', 'widget', 'USER_AGENT')
        OR r.user_agent ILIKE ANY ('mcp-e2e%', 'k8saasdev%', 'Edge-Tester%') THEN 'x_internal'
      WHEN r.user_agent ILIKE ANY (
        '%cloud-controller-manager%', 'cluster-autoscaler%', 'csi-digitalocean%',
        'doks-%', 'cert-manager%', 'ExternalDNS%', 'external-dns%', 'do-operator%'
      ) THEN 'k8s_controllers'
      WHEN r.product = 'registry'
        OR r.user_agent ILIKE ANY (
          'containerd%', 'docker%', 'go-containerregistry%', 'crane%', 'kaniko%',
          'skopeo%', 'cosign%', 'buildah%', 'trivy%', 'helm%', 'containers%'
        ) THEN 'container_registry'
      WHEN r.user_agent ILIKE 'do-remote-mcp%' THEN 'mcp_remote'
      WHEN r.user_agent ILIKE ANY ('mcp-digitalocean%', 'digitalocean-mcp%', 'do-mcp%') THEN 'mcp_local'
      WHEN r.user_agent ILIKE '%mcp%'
        AND NOT r.user_agent ILIKE ANY (
          '%probe%', '%bxss%', '%nslookup%', 'intigriti%',
          'vera-mcp-%', 'bbp-mcp-test%', 'cakewalk-mcp%'
        ) THEN 'mcp_3p'
      WHEN r.user_agent ILIKE 'doctl%' THEN 'c_doctl'
      WHEN r.user_agent ILIKE ANY ('terraform%', '%terraform-provider%') THEN 'c_terraform'
      WHEN r.user_agent ILIKE ANY ('pulumi%', 'ansible%', 'packer%', 'crossplane%', 'jclouds%') THEN 'c_iac_other'
      WHEN r.user_agent ILIKE '%pydo%' THEN 'c_pydo'
      WHEN r.user_agent ILIKE ANY ('godo%', '% godo%') THEN 'c_godo'
      WHEN r.user_agent ILIKE ANY ('%dots%', 'dropletkit%') THEN 'c_sdk_other_official'
      WHEN r.user_agent ILIKE ANY (
        'python-digitalocean%', 'digitalocean-php-api-client%',
        'digitalocean-api-dotnet%', 'passport-digitalocean%'
      ) THEN 'c_sdk_community'
      WHEN r.user_agent ILIKE ANY ('do-app-action%', '%github-actions%') THEN 'c_ci_actions'
      WHEN r.user_agent ILIKE ANY (
        'opencode%', 'claude%', 'codex%', 'cursor%', 'litellm%', 'hermes-agent%',
        '%langchain%', 'openai%', 'chatgpt%', 'windsurf%', 'aider%', 'cline%',
        'copilot%', 'devin%', 'gemini%', 'gradient%'
      ) OR (
        r.user_agent ILIKE '%agent%'
        AND NOT r.user_agent ILIKE ANY ('meta-externalagent%', 'mozilla%', 'github cli%')
      ) THEN 'c_ai_client_direct'
      WHEN r.user_agent ILIKE 'curl%' THEN 'c_curl'
      WHEN r.user_agent ILIKE ANY (
        'go-http-client%', 'python-httpx%', 'python-requests%', 'python-urllib%', 'python%',
        'axios%', 'node%', 'undici%', 'got%', 'bun%', 'deno%', 'guzzlehttp%', 'okhttp%',
        'apache-httpclient%', 'java%', 'ruby%', 'faraday%', 'symfony%', 'postmanruntime%',
        'aiohttp%', 'reqwest%', 'dart%'
      ) THEN 'c_raw_http'
      ELSE 'ignore'
    END AS iface_family
  FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY r
  WHERE r._deleted_at IS NULL
    AND r.request_date >= '2025-03-01'
    AND r.request_date < '2026-11-01'
),
clean_mcp_accounts AS (
  SELECT
    m.account_id,
    a.account_urn_type,
    a.created_at::DATE AS account_created_date,
    a.first_billable_month IS NOT NULL AS has_first_billable_month,
    MIN(m.req_date) AS first_mcp_date,
    MAX(m.req_date) AS last_mcp_date,
    COUNT(DISTINCT m.req_date) AS mcp_active_days,
    SUM(m.n_req) AS mcp_requests,
    MAX(IFF(m.iface_family = 'mcp_remote', 1, 0)) AS used_remote_mcp
  FROM api_classified m
  INNER JOIN core_accounts_dedup a ON a.id = m.account_id
  WHERE m.iface_family IN ('mcp_remote', 'mcp_local', 'mcp_3p')
    AND m.account_id NOT IN (0, 38082003, 6595347, 3057872, 31664295)
    AND NOT (COALESCE(a.email_address, '') ILIKE '%@digitalocean.com' OR COALESCE(a.is_free_employee, FALSE))
    AND NOT (COALESCE(a.is_test, FALSE) OR COALESCE(a.is_free, FALSE))
    AND NOT (COALESCE(a.is_abuse, FALSE) OR COALESCE(a.is_admin_locked, FALSE))
  GROUP BY 1, 2, 3, 4
),
companion_interfaces AS (
  SELECT
    c.account_id,
    MAX(IFF(a.iface_family LIKE 'c_%', 1, 0)) AS has_other_customer_iface
  FROM clean_mcp_accounts c
  LEFT JOIN api_classified a ON a.account_id = c.account_id
  GROUP BY 1
),
prod_rev_monthly AS (
  SELECT
    p.account_id,
    p.invoice_start_date::DATE AS rev_month,
    MAX(IFF(p.product IN ('Droplets', 'Droplet Backups', 'Droplet Snapshots'), 1, 0)) AS b_droplets,
    MAX(IFF(p.product = 'App Platform', 1, 0)) AS b_apps,
    MAX(IFF(p.product = 'Functions', 1, 0)) AS b_functions,
    MAX(IFF(p.product IN ('Kubernetes', 'Kubernetes Storage'), 1, 0)) AS b_doks,
    MAX(IFF(p.product IN ('PG', 'Advanced PG', 'MYSQL', 'Advanced MYSQL', 'Valkey', 'REDIS', 'MONGODB', 'OPENSEARCH', 'Vector', 'KAFKA'), 1, 0)) AS b_db,
    MAX(IFF(p.product = 'Spaces', 1, 0)) AS b_spaces,
    MAX(IFF(p.product IN ('Droplet Storage', 'Managed NFS'), 1, 0)) AS b_volumes,
    MAX(IFF(p.product = 'Container Registry', 1, 0)) AS b_docr,
    MAX(IFF(p.product IN ('Load Balancers', 'Reserved IPs', 'VPC', 'DDOS', 'Droplets', 'App Platform', 'Kubernetes'), 1, 0)) AS b_net_or_compute,
    MAX(IFF(p.product IN ('Serverless Inference', 'Dedicated Inference', 'Agent Platform', 'Knowledge Bases', 'Harness Runtime', 'MicroVms', 'Sandbox', 'Action Gateway'), 1, 0)) AS b_ai
  FROM PRODUCTION.MFD.MONTHLY_ACCOUNT_PRODUCT_REVENUE p
  INNER JOIN clean_mcp_accounts c ON c.account_id = p.account_id
  WHERE p._deleted_at IS NULL
    AND p.invoice_start_date >= '2025-03-01'
    AND p.invoice_start_date < '2026-11-01'
    AND p.gross_amount > 0
  GROUP BY 1, 2
),
mcp_deploy_ladder AS (
  SELECT
    e.account_id,
    MAX(IFF(
      e.n_mut > 0 AND e.prod IN (
        'droplets', '1-clicks', 'apps', 'functions', 'kubernetes', 'databases',
        'vector-databases', 'spaces', 'volumes', 'nfs', 'registries', 'firewalls',
        'domains', 'cdn', 'certificates', 'load_balancers', 'vpcs', 'reserved_ips',
        'vpc_peerings', 'reserved_ipv6', 'byoip_prefixes', 'gen-ai',
        'dedicated-inferences', 'agents', 'harness-runtime', 'microvms'
      ), 1, 0
    )) AS has_infra_write,
    MAX(IFF(
      (e.n_mut > 0 AND e.prod IN ('account', 'projects', 'tags', 'images', 'consent', 'signals', 'uptime', 'monitoring', 'insights'))
      OR e.n_del > 0, 1, 0
    )) AS has_non_infra_or_del,
    MAX(IFF(
      e.n_mut > 0 AND (
        (e.prod IN ('droplets', '1-clicks') AND (COALESCE(r0.b_droplets, 0) = 1 OR COALESCE(r1.b_droplets, 0) = 1))
        OR (e.prod = 'apps' AND (COALESCE(r0.b_apps, 0) = 1 OR COALESCE(r1.b_apps, 0) = 1))
        OR (e.prod = 'functions' AND (COALESCE(r0.b_functions, 0) = 1 OR COALESCE(r1.b_functions, 0) = 1))
        OR (e.prod = 'kubernetes' AND (COALESCE(r0.b_doks, 0) = 1 OR COALESCE(r1.b_doks, 0) = 1))
        OR (e.prod IN ('databases', 'vector-databases') AND (COALESCE(r0.b_db, 0) = 1 OR COALESCE(r1.b_db, 0) = 1))
        OR (e.prod = 'spaces' AND (COALESCE(r0.b_spaces, 0) = 1 OR COALESCE(r1.b_spaces, 0) = 1))
        OR (e.prod IN ('volumes', 'nfs') AND (COALESCE(r0.b_volumes, 0) = 1 OR COALESCE(r1.b_volumes, 0) = 1))
        OR (e.prod = 'registries' AND (COALESCE(r0.b_docr, 0) = 1 OR COALESCE(r1.b_docr, 0) = 1))
        OR (e.prod IN ('firewalls', 'domains', 'cdn', 'certificates', 'load_balancers', 'vpcs', 'reserved_ips', 'vpc_peerings')
            AND (COALESCE(r0.b_net_or_compute, 0) = 1 OR COALESCE(r1.b_net_or_compute, 0) = 1))
        OR (e.prod IN ('gen-ai', 'dedicated-inferences', 'agents', 'harness-runtime', 'microvms')
            AND (COALESCE(r0.b_ai, 0) = 1 OR COALESCE(r1.b_ai, 0) = 1))
      ), 1, 0
    )) AS is_verified_deployer
  FROM api_classified e
  INNER JOIN clean_mcp_accounts c ON c.account_id = e.account_id
  LEFT JOIN prod_rev_monthly r0 ON r0.account_id = e.account_id AND r0.rev_month = e.req_month
  LEFT JOIN prod_rev_monthly r1 ON r1.account_id = e.account_id AND r1.rev_month = DATEADD('month', 1, e.req_month)
  WHERE e.iface_family IN ('mcp_remote', 'mcp_local', 'mcp_3p')
  GROUP BY 1
),
rev_summary AS (
  SELECT
    account_id,
    MAX(IFF(total_gross > 0, 1, 0)) AS rev_ever_billed,
    MAX(IFF(invoice_start_date::DATE = '2026-10-01' AND total_gross > 0, 1, 0)) AS oct_billed,
    SUM(IFF(invoice_start_date::DATE = '2026-10-01', COALESCE(total_gross, 0), 0)) AS oct_gross_usd
  FROM (
    SELECT r.*
    FROM PRODUCTION.MFD.MONTHLY_ACCOUNT_REVENUE r
    INNER JOIN clean_mcp_accounts c ON c.account_id = r.account_id
    WHERE r._deleted_at IS NULL AND r.invoice_start_date < '2026-11-01'
    QUALIFY ROW_NUMBER() OVER (PARTITION BY r.account_id, r.invoice_start_date::DATE ORDER BY r._loaded_at DESC NULLS LAST) = 1
  )
  GROUP BY 1
)
SELECT
  IFF(ci.has_other_customer_iface = 1, '2. MCP + Others', '1. Only MCP') AS interface_cohort,
  CASE
    WHEN c.last_mcp_date < '2026-10-01' AND c.mcp_active_days <= 2 THEN '1. Just Tried (1-2d, pre-Oct)'
    WHEN c.last_mcp_date < '2026-10-01' THEN '2. Churned Away (3+d, $0 Oct MCP)'
    WHEN c.first_mcp_date < '2026-10-01' OR c.mcp_active_days >= 3 THEN '3. Stayed Back (Oct Active)'
    ELSE '4. Oct 2026 New Trial (1-2d)'
  END AS mcp_lifecycle_cohort,
  CASE
    WHEN dl.is_verified_deployer = 1 THEN 'Stage 4 — Verified MCP Infra Deployer'
    WHEN dl.has_infra_write = 1 THEN 'Stage 3 — Unbilled / Blocked MCP Infra Write'
    WHEN dl.has_non_infra_or_del = 1 THEN 'Stage 2 — SSH Key / Ops Config / Cleanup Only'
    ELSE 'Stage 1 — Read-Only Explorer (100% GET)'
  END AS deploy_stage,
  COUNT(*) AS accounts,
  SUM(IFF(COALESCE(rs.oct_billed, 0) = 1, 1, 0)) AS oct_paid_do_accounts,
  ROUND(SUM(COALESCE(rs.oct_gross_usd, 0)), 2) AS oct_2026_gross_usd
FROM clean_mcp_accounts c
INNER JOIN companion_interfaces ci ON ci.account_id = c.account_id
LEFT JOIN mcp_deploy_ladder dl ON dl.account_id = c.account_id
LEFT JOIN rev_summary rs ON rs.account_id = c.account_id
GROUP BY 1, 2, 3
ORDER BY 1, 2, 3;


-- -----------------------------------------------------------------------------
-- QUERY 2: 2-Day Raw EDGE_API_REQUESTS Calibration (2026-09-09 & 2026-10-14)
-- Separates POST /v2/droplets creation from /v2/droplets/{id}/actions Day-2 ops
-- and quantifies HTTP 2xx success vs 401/403 scope & 422 limit/validation errors
-- (Executed Query ID: 01c89f6a-0821-cfce-001b-b50227ce50e7)
-- -----------------------------------------------------------------------------
SELECT
  CASE
    WHEN user_agent ILIKE 'do-remote-mcp%' THEN 'Remote MCP'
    WHEN user_agent ILIKE ANY ('mcp-digitalocean%', 'digitalocean-mcp%', 'do-mcp%') THEN 'Local Official MCP'
    ELSE '3P MCP'
  END AS mcp_flavor,
  CASE
    WHEN uri ILIKE '/v2/droplets%/actions%' THEN 'droplets_day2_action'
    WHEN uri ILIKE '/v2/droplets%' AND method = 'POST' THEN 'droplets_create_post'
    WHEN uri ILIKE '/v2/apps%' AND method IN ('POST', 'PUT', 'PATCH') THEN 'apps_create_or_deploy'
    WHEN uri ILIKE '/v2/databases%' AND method IN ('POST', 'PUT', 'PATCH') THEN 'databases_create_or_update'
    WHEN uri ILIKE '/v2/kubernetes%' AND method IN ('POST', 'PUT', 'PATCH') THEN 'doks_create_or_update'
    WHEN uri ILIKE '/v2/account%' AND method IN ('POST', 'PUT', 'PATCH') THEN 'account_ssh_key_or_config'
    WHEN method IN ('POST', 'PUT', 'PATCH') THEN 'other_write'
    WHEN method = 'DELETE' THEN 'any_delete'
    ELSE 'read_get_head'
  END AS action_bucket,
  CASE
    WHEN status BETWEEN 200 AND 299 THEN '2xx_ok'
    WHEN status IN (401, 403) THEN '401_403_auth_scope'
    WHEN status = 422 THEN '422_limit_or_validation'
    WHEN status BETWEEN 400 AND 499 THEN '4xx_other'
    ELSE '5xx_or_other'
  END AS status_bucket,
  COUNT(*) AS requests,
  COUNT(DISTINCT account_id) AS accounts
FROM PRODUCTION.RAW.EDGE_API_REQUESTS
WHERE request_date IN ('2026-09-09', '2026-10-14')
  AND user_agent ILIKE '%mcp%'
  AND NOT user_agent ILIKE ANY (
    'mcp-e2e%', 'k8saasdev%', '%probe%', '%bxss%', '%nslookup%',
    'intigriti%', 'vera-mcp-%', 'bbp-mcp-test%', 'cakewalk-mcp%'
  )
GROUP BY 1, 2, 3
ORDER BY requests DESC;


-- -----------------------------------------------------------------------------
-- QUERY 3: Individual DO & Gradient AI Service Gross USD by Cohort & Infra Write
-- (Executed Query ID: 01c89f7f-0821-cfce-001b-b50227d22023)
-- -----------------------------------------------------------------------------
WITH clean_mcp_accts AS (
  SELECT DISTINCT r.account_id
  FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY r
  INNER JOIN (
    SELECT * FROM PRODUCTION.CORE.ACCOUNTS
    QUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY _loaded_at DESC NULLS LAST) = 1
  ) a ON a.id = r.account_id
  WHERE r._deleted_at IS NULL
    AND r.request_date < '2026-11-01'
    AND r.user_agent ILIKE '%mcp%'
    AND NOT r.user_agent ILIKE ANY (
      'mcp-e2e%', 'k8saasdev%', '%probe%', '%bxss%', '%nslookup%',
      'intigriti%', 'vera-mcp-%', 'bbp-mcp-test%', 'cakewalk-mcp%'
    )
    AND r.account_id NOT IN (0, 38082003, 6595347, 3057872, 31664295)
    AND NOT (COALESCE(a.email_address, '') ILIKE '%@digitalocean.com' OR COALESCE(a.is_free_employee, FALSE))
    AND NOT (COALESCE(a.is_test, FALSE) OR COALESCE(a.is_free, FALSE))
    AND NOT (COALESCE(a.is_abuse, FALSE) OR COALESCE(a.is_admin_locked, FALSE))
),
acct_flags AS (
  SELECT
    r.account_id,
    MAX(IFF(
      NOT (
        r.product IN ('billing', 'my', 'registry')
        OR r.user_agent IN ('SFDC-Callout', 'service', 'services', 'widget', 'USER_AGENT')
        OR r.user_agent ILIKE ANY (
          'mcp-e2e%', 'k8saasdev%', 'Edge-Tester%', '%cloud-controller-manager%',
          'cluster-autoscaler%', 'csi-digitalocean%', 'doks-%', 'cert-manager%',
          'ExternalDNS%', 'external-dns%', 'do-operator%', 'containerd%', 'docker%',
          'go-containerregistry%', 'crane%', 'kaniko%', 'skopeo%', 'cosign%',
          'buildah%', 'trivy%', 'helm%', 'containers%', '%mcp%'
        )
      )
      AND (
        r.user_agent ILIKE ANY (
          'doctl%', 'terraform%', '%terraform-provider%', 'pulumi%', 'ansible%',
          'packer%', 'crossplane%', 'jclouds%', '%pydo%', 'godo%', '% godo%',
          '%dots%', 'dropletkit%', 'python-digitalocean%', 'digitalocean-php-api-client%',
          'digitalocean-api-dotnet%', 'passport-digitalocean%', 'do-app-action%',
          '%github-actions%', 'opencode%', 'claude%', 'codex%', 'cursor%', 'litellm%',
          'hermes-agent%', '%langchain%', 'openai%', 'chatgpt%', 'windsurf%', 'aider%',
          'cline%', 'copilot%', 'devin%', 'gemini%', 'gradient%', 'curl%',
          'go-http-client%', 'python-httpx%', 'python-requests%', 'python-urllib%',
          'python%', 'axios%', 'node%', 'undici%', 'got%', 'bun%', 'deno%',
          'guzzlehttp%', 'okhttp%', 'apache-httpclient%', 'java%', 'ruby%',
          'faraday%', 'symfony%', 'postmanruntime%', 'aiohttp%', 'reqwest%', 'dart%'
        )
        OR (r.user_agent ILIKE '%agent%' AND NOT r.user_agent ILIKE ANY ('meta-externalagent%', 'mozilla%', 'github cli%'))
      ),
      1, 0
    )) AS has_other_iface,
    MAX(IFF(
      r.user_agent ILIKE '%mcp%'
      AND NOT r.user_agent ILIKE ANY (
        'mcp-e2e%', 'k8saasdev%', '%probe%', '%bxss%', '%nslookup%',
        'intigriti%', 'vera-mcp-%', 'bbp-mcp-test%', 'cakewalk-mcp%'
      )
      AND r.product IN (
        'droplets', '1-clicks', 'apps', 'functions', 'kubernetes', 'databases',
        'vector-databases', 'spaces', 'volumes', 'nfs', 'registries', 'firewalls',
        'domains', 'cdn', 'certificates', 'load_balancers', 'vpcs', 'reserved_ips',
        'vpc_peerings', 'reserved_ipv6', 'byoip_prefixes', 'gen-ai',
        'dedicated-inferences', 'agents', 'harness-runtime', 'microvms'
      )
      AND (COALESCE(r.num_post_requests, 0) + COALESCE(r.num_put_requests, 0) + COALESCE(r.num_patch_requests, 0)) > 0,
      1, 0
    )) AS has_mcp_infra_mut
  FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY r
  INNER JOIN clean_mcp_accts c ON c.account_id = r.account_id
  WHERE r._deleted_at IS NULL
    AND r.request_date >= '2025-03-01'
    AND r.request_date < '2026-11-01'
  GROUP BY 1
)
SELECT
  IFF(f.has_other_iface = 1, 'MCP + Others', 'Only MCP') AS row_group,
  IFF(f.has_mcp_infra_mut = 1, 'MCP Infra Mutator', 'Non-Infra / Read-Only') AS deploy_group,
  p.product,
  COUNT(DISTINCT p.account_id) AS billed_accts_era,
  COUNT(DISTINCT IFF(p.invoice_start_date::DATE = '2026-10-01', p.account_id, NULL)) AS billed_accts_oct26,
  ROUND(SUM(p.gross_amount), 2) AS gross_usd_era,
  ROUND(SUM(IFF(p.invoice_start_date::DATE = '2026-10-01', p.gross_amount, 0)), 2) AS gross_usd_oct26
FROM PRODUCTION.MFD.MONTHLY_ACCOUNT_PRODUCT_REVENUE p
INNER JOIN acct_flags f ON f.account_id = p.account_id
WHERE p._deleted_at IS NULL
  AND p.invoice_start_date >= '2025-03-01'
  AND p.invoice_start_date < '2026-11-01'
  AND p.gross_amount > 0
GROUP BY 1, 2, 3
ORDER BY gross_usd_oct26 DESC;
