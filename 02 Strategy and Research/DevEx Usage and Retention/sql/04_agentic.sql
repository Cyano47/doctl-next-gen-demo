-- Workstream 4: agentic usage. GPU Droplets are reported in revenue_products, not here.
-- SERVERLESS_INFERENCE_GPU_NET_REVENUE has rows only from April 2026.

-- @query agentic
WITH {{block:acct}},
{{block:active_months}},
x AS (SELECT am.*, {{block:churn_flag}} ch FROM am),
sig AS (
  SELECT r.account_id, DATE_TRUNC('month', r.date_stamp)::date m, 'serverless_inference' s,
    SUM(COALESCE(r.input_tokens,0)+COALESCE(r.output_tokens,0)+COALESCE(r.cache_read_tokens,0)+COALESCE(r.other_tokens,0)) vol, SUM(r.total_net_revenue) rev
  FROM PRODUCTION.TRANSFORMED_DATA.SERVERLESS_INFERENCE_GPU_NET_REVENUE r JOIN acct USING (account_id)
  WHERE r._deleted_at IS NULL AND NOT COALESCE(r.is_excluded,FALSE) AND r.date_stamp >= '{{window_start}}' AND r.date_stamp < '{{month_end}}' GROUP BY 1,2,3
  UNION ALL
  SELECT c.owner_id, DATE_TRUNC('month', c.date_stamp)::date, 'dedicated_inference', SUM(c.gpu_capacity_seconds)/3600, NULL
  FROM PRODUCTION.TRANSFORMED_DATA.DEDICATED_INFERENCE_DAILY_CAPACITY c JOIN acct ON acct.account_id = c.owner_id
  WHERE c._deleted_at IS NULL AND c.date_stamp >= '{{window_start}}' AND c.date_stamp < '{{month_end}}' GROUP BY 1,2,3
  UNION ALL
  SELECT ag.account_id, DATE_TRUNC('month', ag.created_at)::date, 'agents_created', COUNT(*), NULL
  FROM PRODUCTION.TRANSFORMED_DATA.GEN_AI_STARFISH_AGENTS ag JOIN acct USING (account_id)
  WHERE ag._deleted_at IS NULL AND ag.created_at >= '{{window_start}}' AND ag.created_at < '{{month_end}}' GROUP BY 1,2,3
  UNION ALL
  SELECT r.account_id, DATE_TRUNC('month', r.request_date)::date,
    CASE WHEN r.user_agent ILIKE 'do-remote-mcp%' THEN 'mcp_remote' WHEN r.user_agent ILIKE ANY ('mcp-digitalocean%','digitalocean-mcp%','do-mcp%') THEN 'mcp_local' ELSE 'agent_clients' END,
    SUM(r.num_requests), NULL
  FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY r JOIN acct USING (account_id)
  WHERE r._deleted_at IS NULL AND r.request_date >= '{{window_start}}' AND r.request_date < '{{month_end}}'
    AND (r.user_agent ILIKE ANY ('do-remote-mcp%','mcp-digitalocean%','digitalocean-mcp%','do-mcp%','opencode%','claude%','codex%','litellm%','hermes-agent%','%langchain%','openai%','chatgpt%')
         OR (r.user_agent ILIKE '%agent%' AND NOT r.user_agent ILIKE ANY ('meta-externalagent%','mozilla%','github cli%')))
    AND NOT r.user_agent ILIKE 'mcp-e2e%'
  GROUP BY 1,2,3
),
anyag AS (SELECT account_id, m, 'any_agentic_ex_gpu' s, NULL vol, NULL rev FROM sig GROUP BY 1,2),
all_sig AS (SELECT * FROM sig UNION ALL SELECT * FROM anyag)
SELECT TO_CHAR(s.m,'YYYY-MM') month, s.s signal, COUNT(DISTINCT s.account_id) accounts, COUNT(DISTINCT x.account_id) active_accounts,
  IFF(MIN(s.m) = '{{month_start}}', NULL, SUM(IFF(x.ch=1,1,0))) churned, ROUND(SUM(x.g)) acct_total_gross, ROUND(SUM(s.vol)) volume, ROUND(SUM(s.rev)) signal_net_revenue
FROM all_sig s LEFT JOIN x ON x.account_id = s.account_id AND x.m = s.m
GROUP BY 1,2 ORDER BY 1,2

-- @query agentic_adjacency
-- Run month only: which product groups agentic accounts buy, vs everyone else active that month.
WITH {{block:acct}},
s AS (SELECT sku, ANY_VALUE(product_name) pn FROM PRODUCTION.PRICING.SKU_DETAIL_CONSOLIDATED WHERE _deleted_at IS NULL GROUP BY 1),
it AS (
  SELECT n.account_id, {{block:product_group}} grp
  FROM PRODUCTION.MFD.INVOICE_ITEMS_NET n JOIN acct USING (account_id) LEFT JOIN s ON s.sku = n.sku
  WHERE n._deleted_at IS NULL AND n.invoice_start_date = '{{month_start}}' AND n.gross_amount > 0
),
ag AS (
  SELECT DISTINCT account_id FROM PRODUCTION.TRANSFORMED_DATA.SERVERLESS_INFERENCE_GPU_NET_REVENUE WHERE date_stamp >= '{{month_start}}' AND date_stamp < '{{month_end}}' AND NOT COALESCE(is_excluded,FALSE)
  UNION SELECT DISTINCT account_id FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY WHERE request_date >= '{{month_start}}' AND request_date < '{{month_end}}'
    AND user_agent ILIKE ANY ('do-remote-mcp%','mcp-digitalocean%','digitalocean-mcp%','do-mcp%','opencode%','claude%','codex%','litellm%')
  UNION SELECT DISTINCT account_id FROM PRODUCTION.TRANSFORMED_DATA.GEN_AI_STARFISH_AGENTS WHERE created_at >= '{{month_start}}' AND created_at < '{{month_end}}'
),
act AS (SELECT DISTINCT account_id FROM it)
SELECT '{{month_label}}' month, IFF(ag.account_id IS NULL,'non_agentic','agentic') cohort, it.grp product_group, COUNT(DISTINCT it.account_id) accounts,
  ANY_VALUE(c.n) cohort_size
FROM it LEFT JOIN ag USING (account_id)
JOIN (SELECT IFF(ag2.account_id IS NULL,'non_agentic','agentic') coh, COUNT(*) n FROM act LEFT JOIN ag ag2 USING (account_id) GROUP BY 1) c ON c.coh = IFF(ag.account_id IS NULL,'non_agentic','agentic')
GROUP BY 1,2,3 ORDER BY 2,4 DESC
