-- Next-gen doctl private-preview stratified candidate pool
-- Classification: DigitalOcean internal.
-- Validated in Snowflake on 2026-09-22.
--
-- Output intentionally permits the same customer to appear in multiple cohorts.
-- Telemetry is a discovery signal; do not contact customers from this result.

WITH params AS (
  SELECT
    90 AS lookback_days,
    14 AS recent_days,
    10 AS candidates_per_cohort
),

base AS (
  SELECT
    d.account_id,
    d.request_date,
    d.product,
    COALESCE(d.num_requests, 0) AS num_requests,
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
  WHERE d.request_date >= DATEADD(
      day,
      -p.lookback_days,
      CURRENT_DATE()
    )
    AND LOWER(d.user_agent) = 'doctl'
    AND d.account_id IS NOT NULL
),

daily AS (
  SELECT
    account_id,
    request_date,
    SUM(num_requests) AS daily_requests
  FROM base
  GROUP BY account_id, request_date
),

product_usage AS (
  SELECT
    account_id,
    product,
    SUM(num_requests) AS product_requests
  FROM base
  WHERE NULLIF(product, '') IS NOT NULL
  GROUP BY account_id, product
),

product_stats AS (
  SELECT
    account_id,
    COUNT(*) AS product_count,
    MAX(product_requests)
      / NULLIF(SUM(product_requests), 0) AS top_product_share,
    LISTAGG(product, ', ')
      WITHIN GROUP (ORDER BY product) AS products
  FROM product_usage
  GROUP BY account_id
),

activity AS (
  SELECT
    account_id,
    COUNT(DISTINCT request_date) AS active_days,
    SUM(num_requests) AS total_requests,
    SUM(write_requests) AS write_requests,
    SUM(IFF(is_ai, num_requests, 0)) AS ai_requests,
    COUNT(DISTINCT IFF(is_ai, request_date, NULL))
      AS ai_active_days,
    MAX(request_date) AS last_seen
  FROM base
  GROUP BY account_id
),

regularity AS (
  SELECT
    account_id,
    COALESCE(
      STDDEV_SAMP(daily_requests)
        / NULLIF(AVG(daily_requests), 0),
      0
    ) AS daily_variation
  FROM daily
  GROUP BY account_id
),

billable AS (
  SELECT
    account_id,
    BOOLOR_AGG(
      COALESCE(is_currently_billable_customer, FALSE)
    ) AS is_billable
  FROM PRODUCTION.TRANSFORMED_DATA.IS_CURRENTLY_BILLABLE_CUSTOMER
  GROUP BY account_id
),

salesforce_account AS (
  SELECT
    atlantis_id,
    name,
    customer_segment,
    is_csm_owned,
    tam,
    owner_id,
    digital_ocean_support_plan,
    support_health,
    num_of_support_tickets,
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
    a.account_id,
    COALESCE(
      NULLIF(sf.name, ''),
      NULLIF(acct.company_name, ''),
      '[not available]'
    ) AS account_name,
    a.last_seen,
    a.active_days,
    a.total_requests,
    a.write_requests,
    a.ai_requests,
    a.ai_active_days,
    ps.product_count,
    ps.products,
    ps.top_product_share,
    r.daily_variation,
    acct.is_vip,
    COALESCE(sf.is_csm_owned, FALSE) AS is_csm_owned,
    COALESCE(
      NULLIF(tam.name, ''),
      NULLIF(owner.name, ''),
      '[unassigned]'
    ) AS outreach_owner,
    COALESCE(
      NULLIF(sf.customer_segment, ''),
      '[unknown]'
    ) AS customer_segment,
    COALESCE(
      NULLIF(sf.digital_ocean_support_plan, ''),
      '[unknown]'
    ) AS support_plan,
    COALESCE(
      NULLIF(sf.support_health, ''),
      '[unknown]'
    ) AS support_health,
    COALESCE(sf.num_of_support_tickets, 0)
      AS support_ticket_count,
    COALESCE(
      NULLIF(sf.ultimate_parent_id, ''),
      TO_VARCHAR(a.account_id)
    ) AS parent_key
  FROM activity a
  JOIN product_stats ps
    ON ps.account_id = a.account_id
  JOIN regularity r
    ON r.account_id = a.account_id
  JOIN PRODUCTION.TRANSFORMED_DATA.ACCOUNTS acct
    ON acct.id = a.account_id
  JOIN billable b
    ON b.account_id = a.account_id
   AND b.is_billable
  LEFT JOIN salesforce_account sf
    ON sf.atlantis_id = a.account_id
  LEFT JOIN PRODUCTION.SALESFORCE.USERS tam
    ON tam.id = sf.tam
  LEFT JOIN PRODUCTION.SALESFORCE.USERS owner
    ON owner.id = sf.owner_id
  WHERE NOT COALESCE(acct.is_test, FALSE)
    AND NOT COALESCE(acct.is_free_employee, FALSE)
    AND NOT COALESCE(acct.is_admin, FALSE)
    AND NOT COALESCE(acct.is_abuse, FALSE)
    AND NOT COALESCE(acct.is_suspended, FALSE)
    AND NOT COALESCE(acct.is_hold, FALSE)
    AND NOT COALESCE(acct.is_archived, FALSE)
    AND COALESCE(sf.is_active, TRUE)
),

cohorts AS (
  SELECT
    'Power Automator' AS cohort,
    e.*,
    total_requests AS priority_1,
    active_days AS priority_2
  FROM eligible e
  CROSS JOIN params p
  WHERE last_seen >= DATEADD(
      day,
      -p.recent_days,
      CURRENT_DATE()
    )
    AND active_days >= 30
    AND total_requests >= 5000
    AND top_product_share >= 0.50
    AND daily_variation <= 1.25

  UNION ALL

  SELECT
    'Power User',
    e.*,
    active_days,
    product_count
  FROM eligible e
  CROSS JOIN params p
  WHERE last_seen >= DATEADD(
      day,
      -p.recent_days,
      CURRENT_DATE()
    )
    AND active_days >= 20
    AND product_count >= 5
    AND write_requests >= 50

  UNION ALL

  SELECT
    'AI User',
    e.*,
    ai_active_days,
    ai_requests
  FROM eligible e
  CROSS JOIN params p
  WHERE last_seen >= DATEADD(
      day,
      -p.recent_days,
      CURRENT_DATE()
    )
    AND ai_active_days >= 3
    AND ai_requests >= 25
),

parent_deduped AS (
  SELECT *
  FROM cohorts
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY cohort, parent_key
    ORDER BY
      is_csm_owned DESC,
      priority_1 DESC,
      priority_2 DESC
  ) = 1
),

ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY cohort
      ORDER BY
        is_csm_owned DESC,
        priority_1 DESC,
        priority_2 DESC
    ) AS cohort_rank
  FROM parent_deduped
)

SELECT
  cohort,
  cohort_rank,
  account_id,
  account_name,
  outreach_owner,
  last_seen,
  active_days,
  total_requests,
  write_requests,
  product_count,
  products,
  top_product_share,
  daily_variation,
  ai_active_days,
  ai_requests,
  is_vip,
  is_csm_owned,
  customer_segment,
  support_plan,
  support_health,
  support_ticket_count
FROM ranked
CROSS JOIN params p
WHERE cohort_rank <= p.candidates_per_cohort
ORDER BY cohort, cohort_rank;
