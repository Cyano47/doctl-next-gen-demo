-- Top 100 next-gen doctl private-preview candidates.
-- Ranking is 50% latest monthly net revenue and 50% recent doctl usage.
-- Usage score weights: active days 35%, requests 30%, products 20%, writes 15%.
-- Internal use only. Ranking does not authorize customer outreach.

WITH params AS (
  SELECT 30 AS lookback_days
),
telemetry_max AS (
  SELECT MAX(request_date) AS through_date
  FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY
  WHERE LOWER(user_agent) = 'doctl'
),
base AS (
  SELECT
    d.account_id,
    d.request_date,
    d.product,
    COALESCE(d.num_requests, 0) AS num_requests,
    COALESCE(d.num_get_requests, 0)
      + COALESCE(d.num_head_requests, 0) AS read_requests,
    COALESCE(d.num_put_requests, 0)
      + COALESCE(d.num_post_requests, 0)
      + COALESCE(d.num_delete_requests, 0)
      + COALESCE(d.num_patch_requests, 0) AS write_requests,
    d.product IN (
      'agents',
      'dedicated-inferences',
      'gen-ai',
      'vector-databases'
    ) AS is_ai
  FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY d
  CROSS JOIN params p
  CROSS JOIN telemetry_max m
  WHERE LOWER(d.user_agent) = 'doctl'
    AND d.account_id IS NOT NULL
    AND d.request_date BETWEEN
      DATEADD(day, -(p.lookback_days - 1), m.through_date)
      AND m.through_date
),
usage AS (
  SELECT
    account_id,
    MAX(request_date) AS last_seen,
    COUNT(DISTINCT request_date) AS active_days,
    SUM(num_requests) AS total_requests,
    SUM(read_requests) AS read_requests,
    SUM(write_requests) AS write_requests,
    COUNT(DISTINCT NULLIF(product, '')) AS product_count,
    COUNT(DISTINCT IFF(is_ai, request_date, NULL)) AS ai_active_days,
    SUM(IFF(is_ai, num_requests, 0)) AS ai_requests
  FROM base
  GROUP BY account_id
),
billable AS (
  SELECT
    account_id,
    BOOLOR_AGG(COALESCE(is_currently_billable_customer, FALSE))
      AS is_billable
  FROM PRODUCTION.TRANSFORMED_DATA.IS_CURRENTLY_BILLABLE_CUSTOMER
  GROUP BY account_id
),
billing_month AS (
  SELECT MAX(DATE_TRUNC('month', invoice_start_date)::DATE) AS month
  FROM PRODUCTION.TRANSFORMED_DATA.MONTHLY_ACCOUNT_REVENUE
),
billing AS (
  SELECT
    r.account_id,
    m.month AS billing_month,
    SUM(COALESCE(r.total_gross, 0)) AS monthly_gross,
    SUM(COALESCE(r.total_net, 0)) AS monthly_net
  FROM PRODUCTION.TRANSFORMED_DATA.MONTHLY_ACCOUNT_REVENUE r
  CROSS JOIN billing_month m
  WHERE DATE_TRUNC('month', r.invoice_start_date)::DATE = m.month
  GROUP BY r.account_id, m.month
),
salesforce_account AS (
  SELECT
    atlantis_id,
    name,
    atlantis_email,
    is_free_email_domain,
    customer_segment,
    is_csm_owned,
    tam,
    owner_id,
    digital_ocean_support_plan,
    support_health,
    is_active,
    ultimate_parent_id
  FROM PRODUCTION.SALESFORCE.ACCOUNTS
  WHERE atlantis_id IS NOT NULL
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY atlantis_id
    ORDER BY last_modified_at DESC NULLS LAST
  ) = 1
),
eligible AS (
  SELECT
    u.account_id,
    COALESCE(
      NULLIF(sf.name, ''),
      NULLIF(a.company_name, ''),
      '[not available]'
    ) AS account_name,
    u.last_seen,
    u.active_days,
    u.total_requests,
    u.read_requests,
    u.write_requests,
    u.product_count,
    u.ai_active_days,
    u.ai_requests,
    b.billing_month,
    COALESCE(b.monthly_gross, 0) AS monthly_gross,
    COALESCE(b.monthly_net, 0) AS monthly_net,
    COALESCE(sf.is_csm_owned, FALSE) AS is_csm_owned,
    COALESCE(NULLIF(sf.atlantis_email, ''), '[not available]')
      AS account_email,
    COALESCE(sf.is_free_email_domain, FALSE) AS is_free_email_domain,
    COALESCE(
      NULLIF(tam.name, ''),
      NULLIF(owner.name, ''),
      '[unassigned]'
    ) AS outreach_owner,
    COALESCE(NULLIF(sf.customer_segment, ''), '[unknown]')
      AS customer_segment,
    COALESCE(NULLIF(sf.digital_ocean_support_plan, ''), '[unknown]')
      AS support_plan,
    COALESCE(NULLIF(sf.support_health, ''), '[unknown]')
      AS support_health,
    COALESCE(
      NULLIF(sf.ultimate_parent_id, ''),
      TO_VARCHAR(u.account_id)
    ) AS parent_key
  FROM usage u
  JOIN PRODUCTION.TRANSFORMED_DATA.ACCOUNTS a
    ON a.id = u.account_id
  JOIN billable bc
    ON bc.account_id = u.account_id
   AND bc.is_billable
  LEFT JOIN billing b
    ON b.account_id = u.account_id
  LEFT JOIN salesforce_account sf
    ON sf.atlantis_id = u.account_id
  LEFT JOIN PRODUCTION.SALESFORCE.USERS tam
    ON tam.id = sf.tam
  LEFT JOIN PRODUCTION.SALESFORCE.USERS owner
    ON owner.id = sf.owner_id
  WHERE NOT COALESCE(a.is_test, FALSE)
    AND NOT COALESCE(a.is_free_employee, FALSE)
    AND NOT COALESCE(a.is_admin, FALSE)
    AND NOT COALESCE(a.is_abuse, FALSE)
    AND NOT COALESCE(a.is_suspended, FALSE)
    AND NOT COALESCE(a.is_hold, FALSE)
    AND NOT COALESCE(a.is_archived, FALSE)
    AND COALESCE(sf.is_active, TRUE)
),
components AS (
  SELECT
    e.*,
    PERCENT_RANK() OVER (
      ORDER BY GREATEST(monthly_net, 0)
    ) AS billing_percentile,
    PERCENT_RANK() OVER (
      ORDER BY active_days
    ) AS active_days_percentile,
    PERCENT_RANK() OVER (
      ORDER BY LN(1 + GREATEST(total_requests, 0))
    ) AS requests_percentile,
    PERCENT_RANK() OVER (
      ORDER BY product_count
    ) AS products_percentile,
    PERCENT_RANK() OVER (
      ORDER BY LN(1 + GREATEST(write_requests, 0))
    ) AS writes_percentile
  FROM eligible e
),
scored AS (
  SELECT
    *,
    100 * (
      0.35 * active_days_percentile
      + 0.30 * requests_percentile
      + 0.20 * products_percentile
      + 0.15 * writes_percentile
    ) AS usage_score,
    100 * (
      0.50 * billing_percentile
      + 0.50 * (
        0.35 * active_days_percentile
        + 0.30 * requests_percentile
        + 0.20 * products_percentile
        + 0.15 * writes_percentile
      )
    ) AS selection_score
  FROM components
),
parent_deduped AS (
  SELECT *
  FROM scored
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY parent_key
    ORDER BY selection_score DESC, monthly_net DESC, total_requests DESC
  ) = 1
),
ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      ORDER BY
        selection_score DESC,
        is_csm_owned DESC,
        monthly_net DESC,
        total_requests DESC
    ) AS overall_rank
  FROM parent_deduped
)
SELECT
  overall_rank,
  account_id,
  account_name,
  account_email,
  is_free_email_domain,
  outreach_owner,
  last_seen,
  active_days,
  total_requests,
  read_requests,
  write_requests,
  GREATEST(total_requests - read_requests - write_requests, 0)
    AS other_requests,
  product_count,
  ai_active_days,
  ai_requests,
  billing_month,
  ROUND(monthly_gross, 2) AS monthly_gross,
  ROUND(monthly_net, 2) AS monthly_net,
  ROUND(usage_score, 1) AS usage_score,
  ROUND(selection_score, 1) AS selection_score,
  is_csm_owned,
  customer_segment,
  support_plan,
  support_health
FROM ranked
WHERE overall_rank <= 100
ORDER BY overall_rank;
