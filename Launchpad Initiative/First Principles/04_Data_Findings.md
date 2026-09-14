# 04 — Data Findings: what the warehouse says about Launchpad

Source: read-only queries against DigitalOcean Snowflake, `PRODUCTION.TRANSFORMED_DATA`, run 14 Sep 2026 (IST evening). Every number below is reproducible from the SQL in the appendix. No customer identifiers are included here.

## Data identification and confidence

Launchpad has no table named after it. Its provisioning records live in three views:

| View | Grain | Key fields | Confidence it is Launchpad |
|---|---|---|---|
| `DO_TERRAFORM_STACKS` | one row per deployment | `template_id` ∈ {`rag_assistant`, `elk`, `airflow`}, `model_preset_id`, `scale_preset_id`, `region`, `status` ∈ {active, deleted}, `team_uuid`, `user_uuid`, `job_uuid` | High — the three template IDs are exactly the three MVP kits in the proposal; presets match the "cost-aware customization" scope; earliest row 20 Apr 2026, eight days before the 28 Apr launch |
| `DO_TERRAFORM_JOBS` | one row per Terraform run | `state` ∈ {pending, deploying, completed, failed}, `clean_project_on_err` | High — joins 1:1 to stacks on `stacks.job_uuid = jobs.uuid` (637/637) |
| `DO_TERRAFORM_STACK_RESOURCES` | one row per created resource | `resource_type` ∈ {droplet, app_platform, knowledge_base, genai_agent, dbaas, loadbalancer}, `resource_id` | Medium — `stack_id` does not join to `stacks.uuid`, `stacks.job_uuid`, `jobs.uuid`, or `jobs.stack_id` (all 0 matches); the view also contains rows dated back to 2023, so it is not Launchpad-only. `resource_id` for `app_platform` rows does join to `APP_PLATFORM_APPS.uuid` (1,984 rows), and the joined apps are named `rag-assistant-xxxx-chat`, which confirms the Launchpad subset. Retention analysis below uses that path and filters `app.created_at >= 2026-04-28`. |

Supporting tables: `ACCOUNTS` (joined on `uuid = team_uuid`; provides `lifetime_value`, `created_at`, `is_free_employee`, `is_test`, `is_vip`, `is_hatch`), `ACCOUNT_SEGMENT_TYPES` (latest period 2026-08-01; joined on `account_urn`; 170 of 299 external Launchpad accounts matched — the rest are probably too new for the August segmentation run), `APP_PLATFORM_APPS` (`deleted_at`, `last_deployment_created_at`, `has_domain`, `phase`).

**Caveats that bound every finding:**
- "External" = not `is_free_employee` and not `is_test`. 30 of 329 post-launch teams were internal; excluded throughout.
- "Post-launch" = `created_at >= 2026-04-28`. 170 stacks (mostly April) predate this and are treated as internal/beta.
- Retention is measured only for the RAG kit, via its App Platform component. ELK/Airflow are droplet-based; their retention would need a droplet join (not done — see `03_Missing_Pieces.md`).
- `stacks.status = 'active'` means the stack record was not torn down through Launchpad. It does not mean the resources still exist; 475 stacks are "active" by this definition while only 41 RAG apps still exist. Do not use `status` as a retention metric.
- Segmentation percentages are on the 170 matched accounts; the 129 unmatched are disproportionately new accounts, so Hobbyist share is likely understated.

## Findings

### F1. Volume: 467 external-and-internal post-launch deployments across 329 teams — not "<100" `[5.4]`

| Month (2026) | rag_assistant | elk | airflow | Total stacks |
|---|---|---|---|---|
| Apr (from 20th; incl. pre-launch/beta) | 99 | 50 | 55 | 204 |
| May | 142 | 18 | 6 | 166 |
| Jun | 85 | 14 | 5 | 104 |
| Jul | 99 | 5 | 9 | 113 |
| Aug | 23 | 7 | 3 | 33 |
| Sep (to 13th) | 15 | 1 | 1 | 17 |

(All statuses, internal included; the external-only job counts in F4 are the cleaner monthly series.)

- Post-launch: **467 stacks, 329 teams, 326 users**; 299 teams external.
- The RAG kit is ~80% of post-launch volume. ELK and Airflow together are under 20% and were mostly April/May.
- Quinn's "fewer than 100 deployments in recent months" is consistent only with August alone (33) or with a definition not stated in the doc. Total post-launch external deployments are roughly 4–5× that figure.
- The volume cliff is **August**, not launch. May–July were flat at ~100–170/month. Something changed in August (placement, marketing, breakage — see F4 — or the discontinuation decision itself). This is a question for the Launchpad and Console teams, not something the data resolves.

### F2. Repeat behaviour: overwhelmingly one-and-done, with a small heavy tail `[1.10, 6.2a]`

| Stacks per team (all periods) | Teams |
|---|---|
| 1 | 274 (80%) |
| 2–3 | 47 (14%) |
| 4+ | 21 (6%); max 36 |

Twenty-one teams deploying four or more times is the strongest behavioural signal of a "template replication" job (the interview finding "creating & replicating own templates," ranked High for Efficiency Architects). Some of the 21 will be internal or test churn; the recruit query in `06` filters those.

### F3. Retention (RAG kit, external, post-launch): 85% deleted, 41% within 24 hours, 7% ever touched again `[5.4, 8.2]`

Of **266** Launchpad-created App Platform apps across **236** external accounts:

| Outcome | Apps | Share |
|---|---|---|
| Still exists (13 Sep) | 41 | 15% |
| Deleted | 225 | 85% |
| — deleted within 24 h | 108 | 41% |
| — deleted day 1–7 | 37 | 14% |
| — deleted day 8–30 | 39 | 15% |
| — deleted after day 30 | 41 | 15% |
| Median time to delete | 2 days | |
| Ever redeployed after day 1 (exists or deleted) | 18 | 7% |
| Still exists **and** redeployed after day 1 | 4 | 1.5% |
| Still exists, never redeployed | 37 | 14% |
| Still exists with a custom domain | 1 | 0.4% |

Reading: 93% of users never pushed a change to what Launchpad created. Of the 41 that survive, 37 are untouched since the day they were created — running, billing, and idle. Quinn's "<5% still active" is consistent with the "exists and redeployed" definition (1.5%) and inconsistent with "exists" (15%); the doc does not say which was meant.

The 24-hour deletion cohort (108) is the single largest group. It is the cohort with no Day-2 story at all — they never reached Day 2. Whatever they were doing (evaluating, demoing, hitting a wall, seeing the cost) happened within hours.

### F4. Provisioning failure rate: 17% overall, rising to 23% in July and 77% in September `[1.5, 5.5.1 maintenance burden]`

External, post-launch, all kits:

| Month | Completed | Failed | Failure rate |
|---|---|---|---|
| Apr (28–30) | 20 | 2 | 9% |
| May | 101 | 10 | 9% |
| Jun | 82 | 13 | 14% |
| Jul | 87 | 24 | 22% |
| Aug | 26 | 5 | 16% |
| Sep (to 13th) | 4 | 10 | **71%** |
| **Total** | **320** | **64** | **17%** |

RAG-only in September: 3 completed, 10 failed. The Proposal's NFR was "must deploy successfully with zero manual edits on default config." The retrospective's "high maintenance burden: every blueprint required ongoing updates as underlying products/APIs/OSS versions changed — with no dedicated team" is visible here as a rising failure curve after the team stopped attending to it. This is the one failure cause in the record that the data confirms directly rather than by inference.

### F5. Who used it: small, technically advanced, established-or-brand-new; not enterprise `[6.1, 6.2, 6.2a]`

299 external post-launch teams.

**Lifetime value** (account-level, all products, to date):

| LTV bucket | Accounts | Share |
|---|---|---|
| $0 | 109 | 36% |
| $0–100 | 63 | 21% |
| $100–1k | 43 | 14% |
| $1k–10k | 47 | 16% |
| $10k–100k | 32 | 11% |
| >$100k | 5 | 2% |
| **Median** | **≈ $46** | |

**Account age at first Launchpad deploy:**

| Age | Accounts | Share |
|---|---|---|
| < 7 days | 62 | 21% |
| 7–90 days | 67 | 22% |
| 90 days – 1 year | 53 | 18% |
| > 1 year | 116 | 39% |

Other flags: 34 `is_vip`, 13 `is_hatch` (startup program), 0 `is_trial`, 55 with a company name on file.

**DigitalOcean segmentation** (170 matched of 299; base = all segmented accounts, Aug 2026):

| Dimension | Value | Launchpad share (of matched) | Base share | Index |
|---|---|---|---|---|
| Segment type | Hobbyist | 49% | 64% | 0.8× |
| | Emerging SMB | 39% | 30% | 1.3× |
| | Advanced SMB | 11% | 2.6% | **4.1×** |
| | Advanced Enterprise | 1% | 0.6% | ~2× (n=2) |
| Demographic | Individual | 49% | 64% | 0.8× |
| | SMB | 49% | 35% | 1.4× |
| | Enterprise | 1% | 0.7% | (n=2) |
| Technical aptitude | technically_advanced | 89% | 83% | 1.1× |
| Cloud adoption | cloud_adoption_advanced | 12% | 2.8% | **4.2×** |

Reading: Launchpad's users skew toward small businesses with advanced cloud adoption, 4× the base rate — and away from hobbyists. Enterprise is absent (2 accounts). This matches Vik's boundary ("not multi-million-dollar customers") and matches the interviews' Efficiency Architect description (agencies, technical founders, already using managed services) better than it matches the MVP's stated target ("Pre-ANE/DNE, low–medium infra expertise").

### F6. Who kept it: retention rises with segment maturity and tenure `[6.2a, 4.10]`

RAG apps, external, post-launch (small n — directional only):

| Cut | Apps | Still exist | Deleted <24 h | Ever redeployed |
|---|---|---|---|---|
| Advanced SMB | 9 | **56%** | 22% | 0% |
| Emerging SMB | 59 | 27% | 49% | 8% |
| Hobbyist | 79 | 14% | 43% | 6% |
| Unmatched (mostly new accounts) | 118 | 8% | 36% | 7% |
| LTV $100–1k | 40 | **28%** | 25% | 8% |
| LTV $0 | 96 | 7% | 41% | 4% |
| Account > 1 yr old | 94 | 21% | 46% | 5% |
| Account < 7 days old | 56 | 20% | 39% | 5% |

Reading: survival is 4–7× higher among Advanced SMB and $100–1k accounts than among $0 / unmatched / hobbyist accounts. Redeployment is near zero everywhere — even the accounts that keep the app do not change it. The Day-2 gap is not that users tried Day-2 work and failed; the data shows almost nobody attempted it.

## What the data does not say

- **Why** anyone deleted. No exit survey table was found for Launchpad (there is `SEGMENT_CLOUD_APPS_DESTROY_SURVEY` for App Platform generally; not queried — candidate for follow-up).
- Whether the 108 same-day deleters saw the deployed app work, saw the cost estimate, or hit an error inside the app (as opposed to a provisioning failure).
- Anything about ELK/Airflow retention (droplet join not done).
- Which entry point (console tile, docs, Marketplace, direct link) each deploy came from. No referrer/source field on the stack.
- Whether Launchpad users also use the API, `doctl`, MCP server, or Terraform provider directly — `PRODUCT_API_REQUESTS_DAILY` and `TOOL_REGISTRY_MCP_SERVERS` exist and could answer this (not queried).
- Any revenue attributable to Launchpad-created resources. `MARKETPLACE_DROPLET_REVENUE`-style tables exist for Marketplace; nothing equivalent was found for Launchpad stacks.

## Appendix — SQL

All queries were run via the read-only MCP warehouse `MCP_QUERY_WH_XS`.

```sql
-- A. Stacks by month / template / status
SELECT DATE_TRUNC('month', created_at) AS month, template_id, status,
       COUNT(*) AS stacks, COUNT(DISTINCT team_uuid) AS teams
FROM PRODUCTION.TRANSFORMED_DATA.DO_TERRAFORM_STACKS
WHERE _deleted_at IS NULL
GROUP BY 1,2,3 ORDER BY 1,2,3;

-- B. Repeat distribution
WITH per_team AS (
  SELECT team_uuid, COUNT(*) n
  FROM PRODUCTION.TRANSFORMED_DATA.DO_TERRAFORM_STACKS
  WHERE _deleted_at IS NULL GROUP BY 1)
SELECT CASE WHEN n=1 THEN '1' WHEN n<=3 THEN '2-3' ELSE '4+' END bucket, COUNT(*)
FROM per_team GROUP BY 1;

-- C. Account profile of external post-launch teams
WITH s AS (
  SELECT team_uuid, MIN(created_at) first_stack
  FROM PRODUCTION.TRANSFORMED_DATA.DO_TERRAFORM_STACKS
  WHERE _deleted_at IS NULL AND created_at >= '2026-04-28' GROUP BY 1)
SELECT a.lifetime_value, DATEDIFF('day', a.created_at, s.first_stack) acct_age_days,
       a.is_vip, a.is_hatch, a.is_trial
FROM s LEFT JOIN PRODUCTION.TRANSFORMED_DATA.ACCOUNTS a ON a.uuid = s.team_uuid
WHERE NOT COALESCE(a.is_free_employee,false) AND NOT COALESCE(a.is_test,false);

-- D. RAG app retention
WITH apps AS (
  SELECT DISTINCT a.uuid, a.account_uuid, a.created_at, a.deleted_at,
         a.last_deployment_created_at, a.has_domain
  FROM PRODUCTION.TRANSFORMED_DATA.DO_TERRAFORM_STACK_RESOURCES r
  JOIN PRODUCTION.TRANSFORMED_DATA.APP_PLATFORM_APPS a ON a.uuid = r.resource_id
  WHERE r.resource_type = 'app_platform' AND a.created_at >= '2026-04-28')
SELECT apps.*
FROM apps LEFT JOIN PRODUCTION.TRANSFORMED_DATA.ACCOUNTS acc ON acc.uuid = apps.account_uuid
WHERE NOT COALESCE(acc.is_free_employee,false) AND NOT COALESCE(acc.is_test,false);
-- then: deleted_at IS NULL; DATEDIFF('hour', created_at, deleted_at) <= 24;
--       last_deployment_created_at > DATEADD('day', 1, created_at)

-- E. Job success/failure by month
SELECT DATE_TRUNC('month', j.created_at) month, s.template_id, j.state, COUNT(*)
FROM PRODUCTION.TRANSFORMED_DATA.DO_TERRAFORM_JOBS j
JOIN PRODUCTION.TRANSFORMED_DATA.DO_TERRAFORM_STACKS s ON s.job_uuid = j.uuid
LEFT JOIN PRODUCTION.TRANSFORMED_DATA.ACCOUNTS a ON a.uuid = s.team_uuid
WHERE j.created_at >= '2026-04-28'
  AND NOT COALESCE(a.is_free_employee,false) AND NOT COALESCE(a.is_test,false)
GROUP BY 1,2,3 ORDER BY 1,2,3;

-- F. Segment cross-tab (latest period)
WITH lp AS (
  SELECT DISTINCT s.team_uuid
  FROM PRODUCTION.TRANSFORMED_DATA.DO_TERRAFORM_STACKS s
  LEFT JOIN PRODUCTION.TRANSFORMED_DATA.ACCOUNTS a ON a.uuid = s.team_uuid
  WHERE s.created_at >= '2026-04-28'
    AND NOT COALESCE(a.is_free_employee,false) AND NOT COALESCE(a.is_test,false)),
seg AS (
  SELECT account_urn, demographic, technical_aptitude, cloud_adoption, segment_type
  FROM PRODUCTION.TRANSFORMED_DATA.ACCOUNT_SEGMENT_TYPES
  WHERE period_start_date = (SELECT MAX(period_start_date)
                             FROM PRODUCTION.TRANSFORMED_DATA.ACCOUNT_SEGMENT_TYPES))
SELECT COALESCE(seg.segment_type,'(unmatched)'), COUNT(*)
FROM lp LEFT JOIN seg
  ON seg.account_urn = 'do:team:' || lp.team_uuid OR seg.account_urn = lp.team_uuid
GROUP BY 1;
```
