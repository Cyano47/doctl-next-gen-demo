# 06 — ICP and Interview Plan

Purpose: name the customer Launchpad should be built for, using behaviour (warehouse) rather than sentiment (nine interviews) as the primary source, then design next week's interviews to test what the data cannot tell us. Constraint from Vik: not multi-million-dollar customers.

Component anchors refer to `01_Decomposition.md`; F-numbers to `04_Data_Findings.md`.

---

## 1. What the data says about who showed up and who stayed

Three populations, in order of how much they matter:

**Who deployed (299 external teams, F5):** technically advanced (89%), small (median LTV ≈ $46; 2 enterprise accounts), split between brand-new accounts (43% under 90 days old) and long-tenured ones (39% over a year). Over-indexed 4× vs. the DigitalOcean base on *Advanced SMB* and on *cloud-adoption-advanced*; under-indexed on Hobbyists.

**Who kept it (41 of 266 RAG apps, F6):** Advanced SMB kept 56%; Emerging SMB 27%; Hobbyist 14%; unsegmented/new 8%. Accounts with $100–1k lifetime spend kept 28%; $0 accounts 7%. Tenure > 1 year kept 21%.

**Who came back (21 teams with 4+ deploys, F2):** the only behavioural evidence of a *repeated* job. Not yet profiled — recruit query below.

**Who nobody built for:** the 108 same-day deleters (41%). They are not a segment; they are an outcome. Their segment mix is roughly the same as everyone else's — which means same-day deletion is not a hobbyist phenomenon. It is something about the product's first hour.

## 2. Denominators (F5 extension, queried 14 Sep)

DigitalOcean segmented accounts, Aug 2026:

| Segment | Accounts | Launchpad users (matched) | Penetration |
|---|---|---|---|
| Hobbyist | ~484,000 | 84 | 0.017% |
| Emerging SMB | ~224,000 | 66 | 0.029% |
| Advanced SMB | ~19,700 | 18 | **0.091%** |
| Advanced Enterprise | ~4,400 | 2 | 0.045% |

Accounts with a live App Platform app deployed since 1 Jun 2026: **~46,700** — Hobbyist 20.0k, Emerging SMB 19.3k, Advanced SMB 2.0k, Enterprise 0.24k.

Reading: Advanced SMB penetration is 3× Emerging SMB and 5× Hobbyist, with 5× the retention. Absolute penetration is tiny everywhere — Launchpad reached under 0.1% of even its best segment. Whatever else is true, the product was never found by most of the people it fit.

## 3. ICP hypothesis

**Primary ICP — "the small team already running production on DigitalOcean, adding an AI-shaped workload."**

| Attribute | Definition (data) | Definition (interview language) |
|---|---|---|
| Segment | Emerging SMB or Advanced SMB; `technically_advanced` | Efficiency Architect: agency, technical founder, 1–10 person team |
| Tenure & spend | Account > 90 days old; LTV $100 – $10k; monthly spend roughly $50 – $2k | Already paying; not enterprise; not free tier |
| Existing footprint | ≥ 1 live App Platform app or ≥ 1 managed database | Already uses managed services; does not want to run servers |
| Trigger | Adding a component they have not run before: agent, knowledge base, vector store, queue, GPU inference | "I know how to ship a web app; I don't know how to ship a RAG pipeline" |
| Job | Get a multi-resource architecture running *and keep it running* without hiring | Speed to POC + Day-2 confidence |
| Pool size | ~21k App-Platform-active SMB accounts; ~240k SMB accounts overall | |
| Not | Enterprise; Hobbyist with $0 spend; multi-million accounts; users who bypass the console entirely (serve them via API/MCP, not Launchpad) | |

**Why this and not "AI-Enabled Builders" (the MVP's stated target):** they showed up (43% of users were new accounts), but they did not stay (8% retention among unsegmented/new). Building for them means solving the first hour — a different product problem from Day 2. It is a legitimate second bet, not the first one.

**Why this and not "Autonomous Soloists":** the data cannot see them — an agent with an API token does not leave a Launchpad stack behind. Serving them is an API/MCP question (see `07`, `08`), not an ICP-for-Launchpad question.

**What would falsify the hypothesis:** if the interviews find that surviving Advanced SMB users kept the app because they forgot it existed (4.b in `03`), or that the 21 repeaters are internal/SE demo accounts, the "kept it" signal collapses and the ICP reverts to hypothesis-from-interviews only.

## 4. Interview plan — week of 21 Sep 2026

### 4.1 What the interviews must answer (mapped to gaps)

| Question | Gap (`03`) | Cohort |
|---|---|---|
| What happened in the first hour? Did it work, what did you see, why did you delete? | 1.a ★ | A — same-day deleters |
| What are you doing with the thing that is still running? Did you know it was? | 4.a, 4.b | B — idle survivors |
| Why deploy 4+ times? For whom? What would you have needed to stop re-creating? | 1.b | C — repeaters |
| What did you do instead — how did you get your AI workload to production? | 7.b | D — Advanced SMB non-users on App Platform |
| Would you have preferred this via your coding agent / CLI / Terraform? | 2.a, 1.c | All |
| What would "trusted" mean for this deployment — what would you need to see to leave it running for a client? | §4 | All |

### 4.2 Cohorts and recruit queries

Run each query, exclude `is_free_employee` / `is_test`, hand the UUID list to whoever owns customer outreach. Target 15–18 completed interviews; recruit 3× that. Cohort D is the control — people who fit the ICP and never touched Launchpad.

```sql
-- Cohort A: deleted within 24h, external, RAG kit (target 6 interviews)
WITH apps AS (
  SELECT DISTINCT a.account_uuid, a.created_at, a.deleted_at
  FROM PRODUCTION.TRANSFORMED_DATA.DO_TERRAFORM_STACK_RESOURCES r
  JOIN PRODUCTION.TRANSFORMED_DATA.APP_PLATFORM_APPS a ON a.uuid = r.resource_id
  WHERE r.resource_type='app_platform' AND a.created_at >= '2026-06-01')
SELECT apps.account_uuid, acc.lifetime_value, apps.created_at, apps.deleted_at
FROM apps JOIN PRODUCTION.TRANSFORMED_DATA.ACCOUNTS acc ON acc.uuid = apps.account_uuid
WHERE apps.deleted_at IS NOT NULL
  AND DATEDIFF('hour', apps.created_at, apps.deleted_at) <= 24
  AND NOT COALESCE(acc.is_free_employee,false) AND NOT COALESCE(acc.is_test,false)
  AND acc.lifetime_value > 0          -- bias toward people with a stake
ORDER BY apps.created_at DESC;

-- Cohort B: still exists, never redeployed (target 4)
-- same CTE; WHERE a.deleted_at IS NULL
--   AND (a.last_deployment_created_at IS NULL
--        OR a.last_deployment_created_at <= DATEADD('day',1,a.created_at))

-- Cohort C: 4+ stacks (target 4)
SELECT s.team_uuid, COUNT(*) n, MIN(s.created_at) first_deploy, MAX(s.created_at) last_deploy,
       LISTAGG(DISTINCT s.template_id, ',') kits, acc.lifetime_value
FROM PRODUCTION.TRANSFORMED_DATA.DO_TERRAFORM_STACKS s
JOIN PRODUCTION.TRANSFORMED_DATA.ACCOUNTS acc ON acc.uuid = s.team_uuid
WHERE s.created_at >= '2026-04-28'
  AND NOT COALESCE(acc.is_free_employee,false) AND NOT COALESCE(acc.is_test,false)
GROUP BY 1, acc.lifetime_value HAVING COUNT(*) >= 4 ORDER BY n DESC;

-- Cohort D: ICP-fit non-users (target 4) — Advanced/Emerging SMB, live App Platform app,
--   a managed DB or Gradient agent, no Launchpad stack ever
WITH seg AS (
  SELECT account_urn, segment_type FROM PRODUCTION.TRANSFORMED_DATA.ACCOUNT_SEGMENT_TYPES
  WHERE period_start_date = (SELECT MAX(period_start_date) FROM PRODUCTION.TRANSFORMED_DATA.ACCOUNT_SEGMENT_TYPES)
    AND segment_type IN ('Advanced SMB','Emerging SMB')),
ap AS (SELECT DISTINCT account_uuid FROM PRODUCTION.TRANSFORMED_DATA.APP_PLATFORM_APPS
       WHERE deleted_at IS NULL AND last_deployment_created_at >= '2026-07-01'),
lp AS (SELECT DISTINCT team_uuid FROM PRODUCTION.TRANSFORMED_DATA.DO_TERRAFORM_STACKS)
SELECT ap.account_uuid, seg.segment_type, acc.lifetime_value
FROM ap JOIN seg ON seg.account_urn = 'do:team:' || ap.account_uuid OR seg.account_urn = ap.account_uuid
JOIN PRODUCTION.TRANSFORMED_DATA.ACCOUNTS acc ON acc.uuid = ap.account_uuid
LEFT JOIN lp ON lp.team_uuid = ap.account_uuid
WHERE lp.team_uuid IS NULL AND acc.lifetime_value BETWEEN 100 AND 10000
  AND NOT COALESCE(acc.is_free_employee,false) AND NOT COALESCE(acc.is_test,false)
ORDER BY RANDOM() LIMIT 60;
```

Recruiting channel: the Great Question workspace is connected and has candidate segments and screener tooling; nothing has been created there. If the research team is already using it, the four cohorts above map to four segments.

**Already interviewed — do not re-recruit; read first (Slack `09`, `#customer-insights`):** Israel / Josie (Eunhae Lee, 11 May — ELK kit, churned to Betterstack, "post-deploy drop-off"); David / Club Calima (Eunhae Lee, 8 May — maintenance > setup, SSL, compliance, personal recipes); Uma Mahesh Nandi (Quinn Eckart, 3 Jun — RAG kit, $12 vs actual cost, stateless KB, ranked architecture-agent highest). Also pull Kathryn Bartel's **in-product feedback survey report** (5 May) — it has a Launchpad section and is the closest thing to cohort-A exit data that already exists. These three transcripts should shape the cohort A and B guides before any new session is scheduled.

### 4.3 Screener (2 minutes)

1. Do you build software as part of your job or business? (yes required)
2. Roughly how many people work on your product? (1 / 2–10 / 11–50 / 50+ — exclude 50+)
3. Have you deployed an AI feature (chat, RAG, agent, embeddings) to real users in the last 6 months? (yes / tried / no)
4. Which of these have you used on DigitalOcean: App Platform / Droplets / Managed DB / Gradient / Launchpad-Starter Kits / Terraform / API-CLI / MCP server (multi)
5. Cohort A/B/C only: "In [month] you deployed a [RAG assistant] with DigitalOcean's Launchpad. Do you remember doing that?" (yes / vaguely / no — keep "vaguely")

### 4.4 Discussion guide (30 minutes, semi-structured)

**Opening (3 min)** — What are you building; who uses it; how do you ship today.

**The moment (10 min)** — cohort-specific:
- A: Walk me through the day you deployed it. What did you expect to see? What did you see? What made you delete it — the app, the cost, the architecture, curiosity satisfied? If it had done one thing differently, would you have kept it?
- B: Did you know it's still running? What is it doing? Have you touched it? Who pays for it? What would make you either use it or delete it?
- C: Why more than once? Same thing each time or different? For whom? What did you change each time? What would have let you do it once?
- D: When you last added an AI component to production, how did you do it? What took longest? Where did you get stuck? Did you look at anything on DigitalOcean for it? Did you look at anything outside?

**Trust (7 min)** — all: If a client or your co-founder asked "is this production-ready," what would you need to be able to say? Who patches it? What happens when the model or a dependency changes? What would you need to see about cost? Would you need the Terraform?

**Surface (5 min)** — all: Show two mocked entry points — a console flow and "paste your repo URL into your coding agent / `doctl`." Which would you actually use? Why? Have you handed an agent your API token?

**Alternatives (3 min)** — What did you compare it to, if anything? Vercel, Railway, Render, GCP, a developer?

**Close (2 min)** — What would have to be true for you to run your next AI workload this way?

### 4.5 Schedule and outputs

| Day | Activity |
|---|---|
| Mon 15 – Wed 17 Sep | Run recruit queries; outreach; confirm `5.a` (is the product live/dead — changes the framing of every question) |
| Thu 18 – Fri 19 | Screener responses; schedule 15–18 slots |
| Mon 21 – Thu 24 | Interviews (4–5/day), two interviewers, recorded |
| Fri 25 | Synthesis: per-cohort answers to §4.1; update `02_Assumed_Facts.md` A3, B10, B13, C18; update the ICP table above |

Outputs feed fp-audit (which assumptions survived), `07` (which teams the survivors' needs touch), and `08` (whether the vision's building blocks are real).

## 5. Parallel data work (does not block interviews)

| Query | Fills |
|---|---|
| Launchpad teams × `PRODUCT_API_REQUESTS_DAILY` × `TOOL_REGISTRY_MCP_SERVERS` — do they also use API/CLI/MCP? | 2.a |
| Droplet lifecycle join for ELK/Airflow stacks | 5.c |
| Billing on the 41 surviving apps and their DBs/agents | 4.b, 6.d |
| `SEGMENT_CLOUD_APPS_DESTROY_SURVEY` filtered to `rag-assistant-%-chat` app names | 1.a (partial, if the survey fired) |
| `MARKETPLACE_DROPLETS` retention for the ELK / Airflow images Launchpad reused | 7.c |
| Support tickets mentioning `rag-assistant` or Launchpad | 9.c |
