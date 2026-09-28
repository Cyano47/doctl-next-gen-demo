-- Next-gen doctl private-preview candidate cohort
-- Classification: DigitalOcean internal; contains customer account metadata when run.
--
-- Verified source:
--   PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY
--   user_agent = 'doctl'
--
-- The 90-day lookback follows the Public API Deprecation Process convention.
-- The remaining thresholds are draft screening parameters, not approved policy.
-- Change them only after the PM/Data/Research cohort review.

SET LOOKBACK_DAYS = 90;
SET RECENT_DAYS = 14;
SET MIN_ACTIVE_DAYS = 20;
SET MIN_REQUESTS = 500;
SET MAX_REQUESTS = 100000;
SET MIN_PRODUCT_COUNT = 2;
SET COHORT_SIZE = 20;

WITH usage AS (
  SELECT
    account_id,
    COUNT(DISTINCT request_date) AS active_days,
    SUM(num_requests) AS requests,
    MAX(request_date) AS last_seen,
    COUNT(DISTINCT product) AS product_count,
    LISTAGG(DISTINCT product, ', ')
      WITHIN GROUP (ORDER BY product) AS products
  FROM PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY
  WHERE request_date >= DATEADD(day, -$LOOKBACK_DAYS, CURRENT_DATE())
    AND LOWER(user_agent) = 'doctl'
    AND account_id IS NOT NULL
  GROUP BY account_id
),
salesforce_account AS (
  SELECT
    atlantis_id,
    name,
    customer_segment,
    is_csm_owned,
    tam,
    digital_ocean_support_plan,
    is_active,
    ultimate_parent_account
  FROM PRODUCTION.SALESFORCE.ACCOUNTS
  WHERE atlantis_id IS NOT NULL
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY atlantis_id
    ORDER BY last_modified_at DESC NULLS LAST
  ) = 1
),
eligible AS (
  SELECT
    u.*,
    COALESCE(
      NULLIF(sf.name, ''),
      NULLIF(a.company_name, ''),
      '[not available]'
    ) AS account_name,
    a.is_vip,
    COALESCE(sf.is_csm_owned, FALSE) AS is_csm_owned,
    COALESCE(NULLIF(owner.name, ''), '[unassigned]') AS outreach_owner,
    COALESCE(NULLIF(sf.customer_segment, ''), '[unknown]') AS customer_segment,
    COALESCE(
      NULLIF(sf.digital_ocean_support_plan, ''),
      '[unknown]'
    ) AS support_plan,
    COALESCE(
      NULLIF(sf.ultimate_parent_account, ''),
      NULLIF(sf.name, ''),
      NULLIF(a.company_name, ''),
      TO_VARCHAR(u.account_id)
    ) AS parent_key
  FROM usage u
  JOIN PRODUCTION.TRANSFORMED_DATA.ACCOUNTS a
    ON a.id = u.account_id
  LEFT JOIN PRODUCTION.TRANSFORMED_DATA.IS_CURRENTLY_BILLABLE_CUSTOMER b
    ON b.account_id = u.account_id
  LEFT JOIN salesforce_account sf
    ON sf.atlantis_id = u.account_id
  LEFT JOIN PRODUCTION.SALESFORCE.USERS owner
    ON owner.id = sf.tam
  WHERE COALESCE(a.is_test, FALSE) = FALSE
    AND COALESCE(a.is_free_employee, FALSE) = FALSE
    AND COALESCE(a.is_admin, FALSE) = FALSE
    AND COALESCE(a.is_abuse, FALSE) = FALSE
    AND COALESCE(a.is_suspended, FALSE) = FALSE
    AND COALESCE(a.is_hold, FALSE) = FALSE
    AND COALESCE(a.is_archived, FALSE) = FALSE
    AND COALESCE(b.is_currently_billable_customer, FALSE) = TRUE
    AND u.last_seen >= DATEADD(day, -$RECENT_DAYS, CURRENT_DATE())
    AND u.active_days >= $MIN_ACTIVE_DAYS
    AND u.requests BETWEEN $MIN_REQUESTS AND $MAX_REQUESTS
    AND u.product_count >= $MIN_PRODUCT_COUNT
    AND COALESCE(sf.is_active, TRUE) = TRUE
),
deduplicated AS (
  SELECT *
  FROM eligible
  QUALIFY ROW_NUMBER() OVER (
    PARTITION BY parent_key
    ORDER BY
      is_csm_owned DESC,
      is_vip DESC,
      active_days DESC,
      requests DESC
  ) = 1
)
SELECT
  account_id,
  account_name,
  last_seen,
  active_days,
  requests,
  product_count,
  products,
  is_vip,
  is_csm_owned,
  outreach_owner,
  customer_segment,
  support_plan
FROM deduplicated
ORDER BY
  is_csm_owned DESC,
  is_vip DESC,
  active_days DESC,
  requests DESC
LIMIT $COHORT_SIZE;
