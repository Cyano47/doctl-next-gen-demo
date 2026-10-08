-- 01_base_tokens.sql @query base_churn for 2026-09
-- Active base, revenue, new-or-returning and 3-month churn per month, with cuts.
-- The invoice window starts one month early so new_or_returning is correct in the first month.
WITH acct AS (
  SELECT a.id account_id, a.created_at::date cd, COALESCE(a.is_free_email_domain,FALSE) free_email
  FROM PRODUCTION.CORE.ACCOUNTS a
  WHERE a.account_urn_type='team' AND NOT COALESCE(a.is_test,FALSE) AND NOT COALESCE(a.is_abuse,FALSE)
    AND NOT COALESCE(a.is_admin_locked,FALSE) AND NOT COALESCE(a.is_free,FALSE) AND NOT COALESCE(a.is_free_employee,FALSE)
    AND COALESCE(a.email_address,'') NOT ILIKE '%@digitalocean.com'
),
gh AS (SELECT DISTINCT account_id FROM PRODUCTION.TRANSFORMED_DATA.PROMOS_GITHUB_STUDENT_PACK_USAGES WHERE _deleted_at IS NULL),
am AS (
  SELECT n.account_id, n.invoice_start_date m, SUM(n.gross_amount) g, SUM(n.net_amount) net
  FROM PRODUCTION.MFD.INVOICE_ITEMS_NET n JOIN acct USING (account_id)
  WHERE n._deleted_at IS NULL AND n.invoice_start_date BETWEEN '2025-12-01' AND '2026-09-01'
  GROUP BY 1,2 HAVING SUM(n.gross_amount) > 0
),
x AS (
  SELECT am.*,
    CASE WHEN g < 10 THEN 'a_lt10' WHEN g < 50 THEN 'b_10_50' WHEN g < 500 THEN 'c_50_500' WHEN g < 5000 THEN 'd_500_5k' ELSE 'e_5k_plus' END band,
    CASE WHEN DATE_TRUNC('month',acct.cd)=m THEN 'a_new' WHEN DATEDIFF('month',acct.cd,m) < 6 THEN 'b_lt6mo' WHEN DATEDIFF('month',acct.cd,m) < 24 THEN 'c_6_24mo' ELSE 'd_24mo_plus' END tenure,
    IFF(acct.free_email,'free','business') email, IFF(gh.account_id IS NULL,'no','yes') student,
    LEAD(m) OVER (PARTITION BY am.account_id ORDER BY m) nxt,
    LAG(m) OVER (PARTITION BY am.account_id ORDER BY m) prv
  FROM am JOIN acct USING (account_id) LEFT JOIN gh ON gh.account_id = am.account_id
)
SELECT TO_CHAR(m,'YYYY-MM') month,
  CASE WHEN GROUPING(band)=0 THEN 'spend_band' WHEN GROUPING(tenure)=0 THEN 'tenure' WHEN GROUPING(email)=0 THEN 'email_type' WHEN GROUPING(student)=0 THEN 'student_pack' ELSE 'all' END dim,
  COALESCE(band,tenure,email,student,'all') val,
  COUNT(*) active, ROUND(SUM(g)) gross, ROUND(SUM(net)) net,
  COUNT_IF(prv IS NULL OR prv < DATEADD('month',-1,m)) new_or_returning,
  IFF(m = '2026-09-01', NULL, COUNT_IF(nxt IS NULL OR nxt > DATEADD('month',3,m))) churned,
  IFF(m = '2026-09-01', NULL, COUNT_IF(nxt > DATEADD('month',3,m))) churned_later_returned
FROM x WHERE m >= '2026-01-01'
GROUP BY GROUPING SETS ((m),(m,band),(m,tenure),(m,email),(m,student))
ORDER BY 1,2,3
