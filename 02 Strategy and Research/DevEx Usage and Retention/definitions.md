# DevEx usage and retention: definitions

**definition_version: v1** (set 8 October 2026; first run 2026-09, covering January to September 2026)

Every number in `history/` carries the version it was built under. If a rule below changes, bump the version, re-run the backfill under the new version, and never mix versions in one trend line.

Source system: Snowflake `PRODUCTION`, read through the Snowflake (DigitalOcean) MCP on an XS warehouse with a 5-minute timeout. The queries live in `sql/`; this file explains them.

## Unit and population

- **Unit:** account (team, `CORE.ACCOUNTS.ACCOUNT_URN_TYPE = 'team'`). Users appear only in the raw-log sample, which carries `USER_ID`.
- **Clean accounts** (`sql/00_cohort.sql`, block `acct`): exclude test, abuse, admin-locked, free and free-employee accounts, and any `@digitalocean.com` email. Flags are all-time.
- **Deliberate deviation from the activation work:** suspended, hold and deleted accounts are **kept**. The activation cohort in `DevEx Research/2026-10-run-04/snowflake-activation.md` drops them. Dropping them here would remove most of the churners this analysis exists to count.

## Active, revenue and spend band

- **Active in month M:** the account's invoice items for `MFD.INVOICE_ITEMS_NET.INVOICE_START_DATE = M` sum to gross > 0.
- **Gross and net:** the invoice-item `GROSS_AMOUNT` and `NET_AMOUNT` (net is after credits and discounts). These are not GAAP revenue. Promo credits make net much lower than gross for new accounts.
- **Spend band:** the account's gross for that month. `a_lt10` under $10, `b_10_50`, `c_50_500`, `d_500_5k`, `e_5k_plus` $5K and over.
- **Tenure:** account age in month M. `a_new` created that month, `b_lt6mo` under 6 months, `c_6_24mo` 6 to 24 months, `d_24mo_plus`.
- **Email type:** `free` if `IS_FREE_EMAIL_DOMAIN`, else `business`. **Student pack:** any row in `PROMOS_GITHUB_STUDENT_PACK_USAGES`.
- **New or returning:** active in M but not in M−1.

## Churn

- **Churned in M:** active in M and not active in any of M+1, M+2 or M+3.
- **Final** when the run month is at least three months after M. In the 2026-09 run, January to June are final, July and August are provisional (they will fall as later months arrive), and September has no churn value.
- **Churned later returned:** churned by the rule above but active again after the 3-month gap. Use it to show how much churn is really a long pause. It keeps rising as later months arrive, so `is_final` describes the churn count, not this column. Compare it only across months of the same age.
- **Churn rate** = churned ÷ active in the same month and cut. Rates are computed when reading; history stores counts.
- Each run recomputes the whole window, so history receives restated churn rows under the new `run_id`. Readers take the latest `run_id` per key (`append_history.py latest`).

## Tokens

`OAUTH_ACCESS_TOKENS` has no token-type column, and application 1 is mostly short-lived session tokens. The **personal access token proxy** (block `pat_filter`) is:

- application 1 with an expiry of exactly 30, 60, 90 days or 1 year (`expires_in` 2592000, 5184000, 7776000, 31536000), which matches the expiry options in the token UI;
- application 109918, with no expiry and an RBAC scope (rows start in April 2026);
- application 30327, with no expiry and the "read write" scope.

The 30-day bucket is noisy: about 30 tokens per account, which points to scripted creation. Read account counts, not token counts. The application IDs are [UNVERIFIED] with the IAM owner.

- **Holding a valid token at month end:** created before the next month starts, and neither revoked nor expired by then.
- **Used a token in M** (`token_use`): the account made at least one API call in M from a client family other than `x_internal`, `k8s_controllers`, `container_registry` or `browser` (families below). Kubernetes controllers and registry pulls authenticate with tokens too, but no person chose to use them that month.
- **Snapshot** (`token_snapshot`): `LAST_USED_AT` is overwritten in place, so it only describes the run month and only if run soon after month end. It cannot rebuild history.
- **Agent endpoint keys:** `GEN_AI_AGENT_API_KEYS` joined to `GEN_AI_STARFISH_AGENTS` for the account.

## Client families (user agents)

The first match wins, in this order (block `ua_family_daily`, and `ua_family_edge` for the raw log):

| Family | Rule (abridged) |
|---|---|
| `x_internal` | product `billing` or `my`; UAs SFDC-Callout, service(s), widget, USER_AGENT; `mcp-e2e%`, `k8saasdev%` |
| `k8s_controllers` | cloud-controller-manager, cluster-autoscaler, csi-digitalocean, doks-, cert-manager, external-dns, do-operator |
| `container_registry` | product `registry`, or docker, containerd, crane, kaniko, skopeo, cosign, buildah, trivy, helm |
| `mcp_remote` / `mcp_local` / `mcp_third_party` | `do-remote-mcp%` / `mcp-digitalocean%`, `digitalocean-mcp%`, `do-mcp%` / any other `%mcp%` |
| `agent_clients` | opencode, claude, codex, litellm, hermes-agent, langchain, openai, chatgpt, or `%agent%` that is not a crawler, browser or GitHub CLI |
| `doctl`, `terraform`, `iac_other` | doctl; terraform or terraform-provider; pulumi, ansible, packer, crossplane, jclouds |
| `sdk_pydo`, `sdk_godo`, `sdk_other_official` | pydo; godo; dots (TypeScript) and dropletkit |
| `community_libs` | python-digitalocean, digitalocean-php-api-client, digitalocean-api-dotnet, passport-digitalocean |
| `ci_actions`, `curl`, `raw_http` | do-app-action and github-actions; curl; HTTP libraries such as Go-http-client, python-requests/httpx, axios, node, okhttp |
| `browser`, `unknown_ua`, `third_party_and_other` | Mozilla; empty UA; everything else |

Go-http-client calling `billing` and python-httpx calling `my` reach about 102K accounts a month. They are internal platform calls, which is why `x_internal` tests the product first.

## Two API sources and how far to trust each

- **`PRODUCT_API_REQUESTS_DAILY`** (daily table): one row per account, day, product and normalized UA. Used for monthly account counts by family, MCP and library-to-product mix. Its volume moves month to month for pipeline reasons (about 90.6M requests a day in May, 80.0M in August, 174.6M in September). Treat its month-on-month changes as **directional**, and check large moves against the raw log. The `coverage_daily` check measures this each month: on a normal sample day the daily table holds about 0.69 of the raw log's accounts for doctl, Terraform and both MCP types. On the May and August 2026 sample days it held 0.33 to 0.46. Low-coverage months depress every daily-table count, so a rise in the month after one is partly recovery.
- **`EDGE_API_REQUESTS`** (raw log): about 376M rows a day, so it is **sampled**. One day per month, the second Wednesday (2026: Jan 14, Feb 11, Mar 11, Apr 8, May 13, Jun 10, Jul 8, Aug 12, Sep 9; Oct 14 next). One day fits the timeout, three days do not. The host is limited to `api.digitalocean.com` and inference hosts (`%do-ai.run%`, `%inference%`); product is the first path segment after `/v2/`. Use it for request volume, write share and library trends. All of its numbers are per sample day, not per month.
- The inference host first appears in the raw log in May 2026.

## Product groups

`PRICING.SKU_DETAIL_CONSOLIDATED` maps a SKU to a product name, which is matched by pattern (block `product_group`). The first match wins: `inference_serverless`, `inference_dedicated`, `agents`, `gpu`, `networking`, `kubernetes`, `app_platform_functions`, `databases`, `storage_registry`, `droplets`, `other`, `other_unmapped` (no SKU match).

## Agentic signals

- `serverless_inference`: rows in `SERVERLESS_INFERENCE_GPU_NET_REVENUE` that are not excluded. Volume is tokens; revenue is its own net revenue. **The table only exists from April 2026**, so January to March are missing, not zero.
- `dedicated_inference`: `DEDICATED_INFERENCE_DAILY_CAPACITY` (volume is GPU hours).
- `agents_created`: agents created that month in `GEN_AI_STARFISH_AGENTS`.
- `mcp_remote`, `mcp_local`, `agent_clients`: from the daily table, using the families above.
- `any_agentic_ex_gpu`: any of the above. GPU Droplets are reported in revenue, not as agentic.
- `accounts` counts everyone with the signal; `active_accounts` counts only those active (billable) that month. The gap is real: many remote MCP users have no billable usage.

## MCP

- Remote vs local is set by the user-agent prefix (above). Remote was first seen on 19 March 2026.
- `new_accounts`: first month that account used that MCP type within the window (blank for the window's first month). `retained_from_prev`: also used it the month before.
- `ACTIONS_INFRASTRUCTURE.TOOL_REGISTRY_MCP_SERVERS` holds customer-registered MCP servers for agents (starts July 2026, streamable HTTP only, not filtered to clean accounts). It does not track DigitalOcean's own MCP server. The `MCP` database exposes no tables to this role.

## History format

`history/metrics.csv` and `history/churn.csv` use the columns `run_id, month, metric_id, dimension, dimension_value, value, unit, source_table, definition_version, is_final`.

- `metric_id` = `<result>.<column>`, for example `base_churn.active` or `mcp.accounts`.
- Churn columns go to `churn.csv`; `is_final` is true when the run month is three or more months after the row's month. Everything else goes to `metrics.csv` with `is_final = true`.
- The files are append only. Rows are never edited; restated values arrive under a newer `run_id`.
- Only aggregates are stored. There are no account IDs, user IDs or emails anywhere in this folder.
