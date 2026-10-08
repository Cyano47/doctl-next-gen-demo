-- Workstream 3: revenue scales and what is being bought.
-- Gross and net are invoice-item amounts, not GAAP revenue. Product mix by spend band is run-month only.

-- @query revenue_products
WITH {{block:acct}},
s AS (SELECT sku, ANY_VALUE(product_name) pn FROM PRODUCTION.PRICING.SKU_DETAIL_CONSOLIDATED WHERE _deleted_at IS NULL GROUP BY 1),
it AS (
  SELECT n.account_id, n.invoice_start_date m, n.gross_amount g, n.net_amount net,
  {{block:product_group}} grp
  FROM PRODUCTION.MFD.INVOICE_ITEMS_NET n JOIN acct USING (account_id) LEFT JOIN s ON s.sku = n.sku
  WHERE n._deleted_at IS NULL AND n.invoice_start_date BETWEEN '{{window_start}}' AND '{{month_start}}'
),
tot AS (SELECT account_id, m, SUM(g) tg FROM it GROUP BY 1,2 HAVING SUM(g) > 0)
SELECT TO_CHAR(it.m,'YYYY-MM') month, 'product_group' dim, it.grp val, COUNT(DISTINCT IFF(it.g>0, it.account_id, NULL)) accounts, ROUND(SUM(it.g)) gross, ROUND(SUM(it.net)) net
FROM it JOIN tot ON tot.account_id=it.account_id AND tot.m=it.m GROUP BY 1,2,3
UNION ALL
SELECT TO_CHAR(it.m,'YYYY-MM'), 'product_group_by_band', it.grp || '|' || CASE WHEN tot.tg < 10 THEN 'a_lt10' WHEN tot.tg < 50 THEN 'b_10_50' WHEN tot.tg < 500 THEN 'c_50_500' WHEN tot.tg < 5000 THEN 'd_500_5k' ELSE 'e_5k_plus' END,
  COUNT(DISTINCT IFF(it.g>0, it.account_id, NULL)), ROUND(SUM(it.g)), ROUND(SUM(it.net))
FROM it JOIN tot ON tot.account_id=it.account_id AND tot.m=it.m WHERE it.m = '{{month_start}}' GROUP BY 1,2,3
ORDER BY 1,2,3
