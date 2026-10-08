-- 04_agentic.sql @query agentic for 2026-09
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
sig AS (
  SELECT r.account_id, DATE_TRUNC('month', r.date_stamp)::date m, 'serverless_inference' s,
    SUM(COALESCE(r.input_tokens,0)+COALESCE(r.output_tokens,0)+COALESCE(r.cache_read_tokens,0)+COALESCE(r.other_tokens,0)) vol, SUM(r.total_net_revenue) rev
  FROM PRODUCTION.TRANSFORMED_DATA.SERVERLESS_INFERENCE_GPU_NET_REVENUE r JOIN acct USING (account_id)
  WHERE r._deleted_at IS NULL AND NOT COALESCE(r.is_excluded,FALSE) AND r.date_stamp >= '2026-01-01' AND r.date_stamp < '2026-10-01' GROUP BY 1,2,3
  UNION ALL
  SELECT c.owner_id, DATE_TRUNC('month', c.date_stamp)::date, 'dedicated_inference', SUM(c.gpu_capacity_seconds)/3600, NULL
  FROM PRODUCTION.TRANSFORMED_DATA.DEDICATED_INFERENCE_DAILY_CAPACITY c JOIN acct ON acct.account_id = c.owner_id
  WHERE c._deleted_at IS NULL AND c.date_stamp >= '2026-01-01' AND c.date_stamp < '2026-10-01' GROUP BY 1,2,3
  UNION ALL
  SELECT ag.account_id, DATE_TRUNC('month', ag.created_at)::date, 'agents_created', COUNT(*), NULL
  FROM PRODUCTION.TRANSFORMED_DATA.GEN_AI_STARFISH_AGENTS ag JOIN acct USING (account_id)
  WHERE ag._deleted_at IS NULL AND ag.created_at >= '2026-01-01' AND ag.created_at < '2026-10-01' GROUP BY 1,2,3
  UNION ALL
  SELECT r.account_id, DATE_TRUNC('month', r.request_date)::date,
    CASE WHEN r.user_agent ILIKE 'do-remote-mcp%' THEN 'mcp_remote' WHEN r.user_agent ILIKE ANY ('mcp-digitalocean%','digitalocean-mcp%','do-mcp%') THEN 'mcp_local' ELSE 'agent_clients' END,
    SUM(r.num_requests), NULL
  FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY r JOIN acct USING (account_id)
  WHERE r._deleted_at IS NULL AND r.request_date >= '2026-01-01' AND r.request_date < '2026-10-01'
    AND (r.user_agent ILIKE ANY ('do-remote-mcp%','mcp-digitalocean%','digitalocean-mcp%','do-mcp%','opencode%','claude%','codex%','litellm%','hermes-agent%','%langchain%','openai%','chatgpt%')
         OR (r.user_agent ILIKE '%agent%' AND NOT r.user_agent ILIKE ANY ('meta-externalagent%','mozilla%','github cli%')))
    AND NOT r.user_agent ILIKE 'mcp-e2e%'
  GROUP BY 1,2,3
),
anyag AS (SELECT account_id, m, 'any_agentic_ex_gpu' s, NULL vol, NULL rev FROM sig GROUP BY 1,2),
all_sig AS (SELECT * FROM sig UNION ALL SELECT * FROM anyag)
SELECT TO_CHAR(s.m,'YYYY-MM') month, s.s signal, COUNT(DISTINCT s.account_id) accounts, COUNT(DISTINCT x.account_id) active_accounts,
  IFF(MIN(s.m) = '2026-09-01', NULL, SUM(IFF(x.ch=1,1,0))) churned, ROUND(SUM(x.g)) acct_total_gross, ROUND(SUM(s.vol)) volume, ROUND(SUM(s.rev)) signal_net_revenue
FROM all_sig s LEFT JOIN x ON x.account_id = s.account_id AND x.m = s.m
GROUP BY 1,2 ORDER BY 1,2
