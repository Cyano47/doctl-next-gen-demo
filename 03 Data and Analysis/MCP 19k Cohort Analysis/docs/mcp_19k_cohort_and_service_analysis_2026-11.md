# DigitalOcean MCP ~19k Account Cohort, Infrastructure Deployment, and Service Attach Analysis (Release through October 31, 2026)

*Written for senior product, engineering, design, and business stakeholders.*

---

## Short Answer

From launch through **October 31, 2026**, **19,068 clean customer accounts** used DigitalOcean MCP (**18,065** standard `'team'` accounts, **889** enterprise `'teamgroup'` accounts, and **114** legacy `NULL`-URN accounts, after removing **246** employee, test, abuse, admin-locked, and synthetic QA/probe accounts from **19,314** raw accounts across the `Account Retention` sheet and Snowflake `PRODUCT_API_REQUESTS_DAILY`). Together, these **19,068** accounts generated **$4,604,308** in October 2026 gross DigitalOcean revenue across **12,582** October-paying accounts (**66.0%** paid share; **84.9%** October paid retention among the **14,821** accounts ever billed on DO; **118.1%** Sep-to-Oct net dollar retention).

The 19k population is **not** one uniform user base. It splits into two distinct customer populations, and **deploying infrastructure via MCP** is the primary behavioral bridge that separates durable users from one-day explorers:

1. **`Only MCP` (`11,054` accounts, `58.0%` of users, `$323,041` Oct 2026 gross — `7.0%` of revenue, `$56.71` Oct paid ARPA):** Net-new, AI-referred, consumer-email signups (**83.6%** of all brand-new `0–7d` signups, **93.9%** of ChatGPT web-referred MCP accounts, and **98.1%** of all `$0` never-billed MCP accounts sit here; **84.5%** use hosted `do-remote-mcp`). When `Only MCP` accounts stop at read-only exploration, only **41.9%** (`2,276 / 5,427`) pay DigitalOcean in October. When they **deploy billed infrastructure via MCP (Stage 4)**, October DO paid conversion jumps to **85.9%** (`2,564 / 2,985`, **+44.0 pp**) and pre-October MCP tool retention rises from **37.4%** (`1,195 / 3,199`) to **53.4%** (`1,038 / 1,943`, **+16.0 pp**). Their paid footprint is a **single-service Droplet monoculture** (**1.62** average billed/active services; **57.0%** Droplets vs **9.7%** App Platform and **7.5%** Managed PostgreSQL).
2. **`MCP + Others` (`8,014` accounts, `42.0%` of users, `$4,281,268` Oct 2026 gross — `93.0%` of revenue, `$621.74` Oct paid ARPA — `11.0x` `Only MCP`):** Established multi-tool builders and scalers (**52.8%**, `4,231 / 8,014`, are veteran DO customers with **1yr+** tenure generating **$3.73M/mo**; **70.1%** pair MCP with named DevEx/IaC/SDK tools led by `doctl` at **63.6%**, `Terraform` at **11.6%**, and `godo` at **9.2%**). For this group, **dropping MCP does not mean churning off DigitalOcean**: **73.5%** (`1,436 / 1,953`) of `MCP + Others` accounts that `Just Tried` MCP (`1–2d` pre-Oct) and **77.1%** (`1,700 / 2,204`) that `Churned Away` from MCP (`3+d` pre-Oct, `0` Oct MCP calls) remained paying DO customers in October (**$2.21M** combined Oct gross), falling back to `doctl`, `Terraform`, or Cloud Console. Those who **Stayed Back** on MCP (`2,914` accounts) posted **98.1%** October paid share (`2,858 / 2,914`) and **152.0%** Sep-to-Oct MoM NRR, running **3.84** services per paid account across Droplets (**86.7%**), App Platform (**48.4%**), Spaces (**47.5%**), and Managed PostgreSQL (**43.9%**).
3. **Half of MCP users never write, and 1 in 5 Remote MCP Droplet creation attempts hits `422` or `401/403` walls:** Among the **16,732** clean accounts with endpoint-level HTTP verb visibility in `PRODUCT_API_REQUESTS_DAILY`, **50.5%** (`8,458`) are **Stage 1 Read-Only Explorers** (`100% GET`), **6.9%** (`1,154`) write only to non-infra config (`/v2/account/keys` SSH keys, monitoring/uptime) or `DELETE` cleanup, **2.3%** (`387`) attempt unbilled/blocked infra writes (**Stage 3**, where pre-Oct MCP retention craters to **26.9%**), and **40.2%** (`6,733`) are **Stage 4 Verified MCP Infra Deployers**. Two-day raw `EDGE_API_REQUESTS` calibration (`2026-09-09` and `2026-10-14`) shows **20.9%** of Remote MCP accounts attempting `POST /v2/droplets` (`38 / 183` accounts) fail with `422` Droplet limit/validation (**23** accounts) or `401/403` token scope rejections (**15** accounts), and **30.6%** of Remote `/v2/account` SSH-key writers (`53 / 173`) hit `401/403` scope errors.

---

## Numbered Findings

### 1. Spine Reconciliation: Merging Raw `EDGE` Sheet Counts with `PRODUCT_API_REQUESTS_DAILY` Captures `19,068` Clean Accounts and Fixes `TODAY()` Retention Drift

Relying on `PRODUCT_API_REQUESTS_DAILY` alone undercounts MCP accounts by **12.2%** (`16,732` vs `19,068` clean accounts) because the daily table samples roughly **69%** of raw `EDGE_API_REQUESTS` traffic, while relying on the spreadsheet's `Bucket` formula alone misclassifies October cohorts due to an unanchored `TODAY()` formula evaluated in November (`0%` active on Nov 24). Merging both sources through **October 31, 2026** resolves both defects:

- **Raw Union (`19,314` accounts):** `19,074` accounts in the `Account Retention` tab (`2025-06-08` to `2026-10-31`) unioned with `16,977` valid-UA MCP accounts in `PRODUCT_API_REQUESTS_DAILY` (`< '2026-11-01'`, after dropping `1` probe-only account from `16,978` raw) yields **16,737** accounts in both sources, **2,337** Sheet-only accounts (low-request `1–2` day accounts missed by daily sampling), and **240** Daily-only accounts (primarily pre-June-8-2025 local MCP adopters).
- **Hygiene Exclusions (`-246` accounts):** Removing **199** `@digitalocean.com` / employee accounts, **44** `is_abuse` / `is_admin_locked` accounts, **2** missing-core / synthetic QA accounts (`0`, `38082003`, `6595347`, `3057872`, `31664295`), and **1** `is_test` / `is_free` account leaves **19,068 clean customer accounts** (**18,065** `'team'` + **889** `'teamgroup'` + **114** legacy `NULL` URN; **16,732** with endpoint-level verb visibility in `PRODUCT_API_REQUESTS_DAILY`). Suspended, hold, and archived customer accounts (**2,911** accounts) are intentionally retained so true churners are never hidden.

---

### 2. The 2x4 Cohort Matrix: `Only MCP` Drives `58.0%` of Adoption (`11,054` Accounts), While `MCP + Others` Drives `93.0%` of Revenue (`$4.28M` Oct Gross)

Anchoring MCP lifecycle cohorts to `'2026-10-31'` and separating right-censored October `1–2` day starters (**3,675** accounts, **19.3%**) prevents the October Remote MCP surge from inflating either `Just Tried` or `Stayed Back`:

| Programmatic Cohort (`Mar 2025 – Oct 2026`) | MCP Lifecycle Cohort (at `2026-10-31`) | Clean Accounts (`%` of `19,068`) | Never Billed (`$0` All-Time) | Billed -> Churned DO (`$0` Oct) | Billed & Stayed DO (`Oct > $0`) | DO Paid Share (`Ret. of Billed`) | Oct 2026 Gross USD (`Paid ARPA`) | Sep->Oct MoM NRR | Verified MCP Deployer (`Stage 4 %` of Visible) |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **1. Only MCP** | `1. Just Tried` (`1–2d` pre-Oct) | 3,013 (`15.8%`) | 1,395 | 623 | 995 | `33.0%` (`61.5%`) | $49,382 (`$49.63`) | `76.7%` | `18.6%` (`386 / 2,078`) |
| **1. Only MCP** | `2. Churned Away` (`3+d`, `0` Oct MCP) | 1,375 (`7.2%`) | 322 | 375 | 678 | `49.3%` (`64.4%`) | $33,630 (`$49.60`) | `95.6%` | `41.0%` (`552 / 1,346`) |
| **1. Only MCP** | `3. Stayed Back` (Oct Active) | 3,934 (`20.6%`) | 1,043 | 124 | 2,767 | `70.3%` (`95.7%`) | $168,957 (`$61.06`) | `116.6%` | `42.7%` (`1,636 / 3,835`) |
| **1. Only MCP** | `4. Oct 2026 New Trial` (`1–2d`) | 2,732 (`14.3%`) | 1,405 | 71 | 1,256 | `46.0%` (`94.6%`) | $71,072 (`$56.59`) | `127.2%` | `18.4%` (`411 / 2,245`) |
| **1. Only MCP Subtotal** | **All `Only MCP`** | **11,054 (`58.0%`)** | **4,165** | **1,193** | **5,696** | **`51.5%` (`82.7%`)** | **$323,041 (`$56.71`)** | **`105.7%`** | **`31.4%` (`2,985 / 9,504`)** |
| **2. MCP + Others** | `1. Just Tried` (`1–2d` pre-Oct) | 1,953 (`10.2%`) | 31 | 486 | 1,436 | `73.5%` (`74.7%`) | $1,180,786 (`$822.27`) | `108.7%` | `33.4%` (`488 / 1,460`) |
| **2. MCP + Others** | `2. Churned Away` (`3+d`, `0` Oct MCP) | 2,204 (`11.6%`) | 8 | 496 | 1,700 | `77.1%` (`77.4%`) | $1,027,894 (`$604.64`) | `91.9%` | `63.2%` (`1,379 / 2,182`) |
| **2. MCP + Others** | `3. Stayed Back` (Oct Active) | 2,914 (`15.3%`) | 20 | 36 | 2,858 | `98.1%` (`98.7%`) | $1,789,581 (`$626.17`) | `152.0%` | `59.8%` (`1,675 / 2,803`) |
| **2. MCP + Others** | `4. Oct 2026 New Trial` (`1–2d`) | 943 (`5.0%`) | 24 | 27 | 892 | `94.6%` (`97.1%`) | $283,007 (`$317.27`) | `117.6%` | `25.6%` (`206 / 783`) |
| **2. MCP + Others Subtotal** | **All `MCP + Others`** | **8,014 (`42.0%`)** | **83** | **1,045** | **6,886** | **`85.9%` (`86.8%`)** | **$4,281,268 (`$621.74`)** | **`119.0%`** | **`51.9%` (`3,748 / 7,228`)** |
| **Total Clean MCP** | **All Cohorts** | **19,068 (`100.0%`)** | **4,248** | **2,238** | **12,582** | **`66.0%` (`84.9%`)** | **$4,604,308 (`$365.94`)** | **`118.1%`** | **`40.2%` (`6,733 / 16,732`)** |

- **MCP Retention After Removing Oct Right-Censoring (`15,393` pre-October starters):** Among the **15,393** clean accounts that started MCP before October 1, 2026 (`4,966` `Just Tried` + `3,579` `Churned Away` + `6,848` `Stayed Back` — or strictly `4,765` pre-Oct starters active in Oct when excluding `2,083` `3+` day October adopters), **32.3%** (`4,966 / 15,393`) stopped after `1–2` days, **23.3%** (`3,579 / 15,393`) used MCP for `3+` days before going quiet in October, and **31.0%** (`4,765 / 13,310` pre-Oct starters) returned in October (**35.6%** overall `Stayed Back` share including multi-day October adopters).
- **Tool Churn vs. Platform Churn:** In `Only MCP`, abandoning MCP after `1–2` days drags Sep-to-Oct DO MoM NRR down to **76.7%** (`61.5%` paid retention of ever-billed). In `MCP + Others`, `Just Tried` accounts still post **108.7%** MoM NRR and `$1.18M` October gross spend because MCP was an experiment on top of an existing `doctl`/`Terraform` production footprint.

---

### 3. Who Are They: `Only MCP` Captures AI-Referred New Signups (`93.9%` of ChatGPT Referrals), While `MCP + Others` Captures `doctl` (`63.6%`) and `Terraform` (`11.6%`) Veterans

 Account tenure at first MCP call, email domain, web referrer, and companion API tools cleanly separate the two personas:

- **Bimodal Account Tenure (`37.4%` Brand-New `0–7d` vs `34.6%` `1yr+` Veterans):**
  - **7,131** accounts (**37.4%** of `19,068`) called MCP within **0–7 days** of creating their DigitalOcean account; **83.6%** (`5,960`) of them are `Only MCP`, **39.7%** (`2,833`) paid DO in October (`$130,985` gross), and **34.0%** reached Stage 4 verified deployment.
  - **6,600** accounts (**34.6%**) were **1yr+ DO veterans** before touching MCP; **64.1%** (`4,231`) are `MCP + Others`, **87.6%** (`5,779`) paid DO in October, and they generated **$3,728,754** (**81.0%** of all October gross revenue across the 19k cohort).
- **ChatGPT Is a Direct Top-of-Funnel Acquisition Engine for `Only MCP`:** **2,331** accounts (**12.2%**) arrived from an AI web referrer (`WEB_ANALYTICS.ACCOUNT_SESSIONS`), led by **ChatGPT / OpenAI** with **2,234** accounts (**11.7%** of the entire 19k MCP base!). Fully **93.9%** (`2,098 / 2,234`) of ChatGPT-referred MCP accounts are `Only MCP`, retaining on MCP at **42.7%** (`Stayed Back`), but converting to October paid DO at only **36.7%** (`819 / 2,234`) and Stage 4 verified infra deploy at **27.5%** (vs **42.0%** for organic/direct signups).
- **Students & Autonomous Agent Inboxes Are Small Slices, Not the Core:** Verified GitHub Student Pack users account for **2.7%** (`523 / 19,068`) of clean MCP accounts — they have high Stage 4 deployment (**51.3%**) via promo credits, then churn heavily once credits expire (**12.2%** `Stayed Back`, **34.4%** Oct paid). Autonomous agent email domains (`grokbot.com`, `agentmail.to`) account for only **4** clean accounts (`0.02%`) inside MCP because agent-signup swarms overwhelmingly call `doctl` or raw REST rather than MCP.
- **Companion Interfaces Inside `MCP + Others` (`8,014` Accounts):**
  - **Named DevEx / IaC / SDK / AI Tools (`5,614` accounts, `70.1%` of `MCP + Others`, `$3,918,866` Oct gross):** Led by **`doctl` CLI** (**5,097** accounts, **63.6%**, `$3.77M` Oct gross), **`Terraform`** (**930**, **11.6%**, `$2.00M` Oct gross), **`godo` official Go SDK** (**740**, **9.2%**, `$2.01M` Oct gross), **Community SDKs** (`python-digitalocean`/PHP/.NET: **504**, **6.3%**, `$735k`), **GitHub Actions / `do-app-action`** (**256**, **3.2%**), **Other IaC** (Pulumi/Ansible/Packer/Crossplane: **97**, **1.2%**), **AI Client Direct APIs** (`Cursor`/`Claude`/`OpenCode`/`Codex`/`LiteLLM`: **96**, **1.2%**), **`pydo` official Python SDK** (**87**, **1.1%**, `$761k` Oct gross), and **Other Official SDKs (`dots`/`dropletkit`)** (**18**, **0.2%**).
  - **Only `curl` / Raw HTTP Libraries (`2,400` accounts, `29.9%` of `MCP + Others`, `$362,402` Oct gross):** Accounts whose only non-MCP programmatic calls are `curl` or generic HTTP clients (`python-requests`, `axios`, `node`, Go `net/http`) behave much closer to mid-tier indie builders (`$181` paid ARPA vs `$801` for Named DevEx/IaC/SDK accounts).

---

### 4. Deploying Infrastructure Using MCP: Stage 4 Deployers Retain `+16.0 pp` Higher in `Only MCP`, While Remote MCP Loses `20.9%` of Droplet Creates to `422`/`403` Errors

Evaluating all **16,732** clean accounts with endpoint and HTTP-verb visibility in `PRODUCT_API_REQUESTS_DAILY` (plus `2,336` unsampled Sheet-only `1–2d` accounts) reveals a sharp activation cliff between reading and deploying:

| MCP Infra Deployment Stage | All Clean MCP (`%` of `16,732` Visible) | `Only MCP` Accounts (`%` Visible) | `MCP + Others` Accounts (`%` Visible) | Pre-Oct Starter Oct MCP Retention (`All` / `Only MCP`) | Oct 2026 DO Paid Share (`All` / `Only MCP`) | Oct 2026 Gross USD |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| **Stage 1 — Read-Only Explorer (`100% GET`)** | 8,458 (`50.5%`) | 5,427 (`57.1%`) | 3,031 (`41.9%`) | `35.1%` (`1,912/5,444`) / `37.4%` | `58.1%` / `41.9%` | $2,385,610 |
| **Stage 2 — SSH Key / Ops Config / Cleanup Only** | 1,154 (`6.9%`) | 814 (`8.6%`) | 340 (`4.7%`) | `44.3%` (`321/724`) / `41.9%` | `46.9%` / `29.2%` | $179,984 |
| **Stage 3 — Unbilled / Blocked Infra Write** | 387 (`2.3%`) | 278 (`2.9%`) | 109 (`1.5%`) | `26.9%` (`68/253`) / `28.6%` | `20.7%` / `10.4%` | $11,780 |
| **Stage 4 — Verified Infra Deployer (Write + Billed `M`/`M+1`)** | 6,733 (`40.2%`) | 2,985 (`31.4%`) | 3,748 (`51.9%`) | **`47.1%`** (`2,410/5,117`) / **`53.4%`** | **`86.5%`** / **`85.9%`** | $1,654,576 |
| *Stage 0 — Sheet-Only (`EDGE` Unsampled in Daily)* | *2,336* | *1,550* | *786* | *`3.0%` (`54/1,772`)* | *`52.2%` / `38.0%`* | *$372,358* |

- **Why Stripping `/v2/account` Writes Matters:** **3,200** clean accounts (`19.1%` of visible) issued `POST/PUT/PATCH` calls to `/v2/account` (predominantly `POST /v2/account/keys` SSH key uploads). Counting all `POST` calls as "deploying infrastructure" would have falsely classified **814** `Only MCP` accounts (`29.2%` Oct paid) as infrastructure deployers.
- **Stage 3 Blocked Writers Churn Worse Than Read-Only Users (`26.9%` vs `35.1%`):** When a user tries to provision via MCP and fails (`$0` billed on that service in `M` or `M+1`), they leave fastest. Raw `EDGE_API_REQUESTS` calibration across `2026-09-09` and `2026-10-14` (Query `01c89f6a-0821-cfce-001b-b50227ce50e7`) pinpoints the exact failure modes on **Remote MCP**:
  - **Droplet Create (`POST /v2/droplets`) vs Day-2 Actions (`/v2/droplets/{id}/actions`):** Across the two sample days, **145** Remote MCP accounts (`280` requests) succeeded (`2xx`) on `POST /v2/droplets`, while **23** accounts (`63` requests) failed with **`422` Droplet limit / payment-gate / SSH validation** and **15** accounts (`18` requests) failed with **`401/403` read-only token scope** (**20.9%** of attempting accounts hit `422`/`403` errors). Separately, **112** Remote MCP accounts (`279` `2xx` requests) called `/v2/droplets/{id}/actions` for Day-2 power/reboot/snapshot ops — meaning ~**50%** of `/v2/droplets` `POST` volume is Day-2 management rather than net-new VM creation.
  - **App Platform & SSH Key Scope Failures:** On those same two days, **53** Remote MCP accounts (`66` requests) hit `401/403` errors writing `/v2/account` SSH keys (vs `120` `2xx` accounts), and **12** of **30** Remote MCP accounts writing `/v2/apps` hit `401/403` or `4xx` errors — whereas **Local MCP** (`mcp-digitalocean`) converted **29** `2xx` `/v2/apps` deployers (`78` requests) with only **7** `4xx` accounts.
- **Remote vs Local MCP Trade-Off:** Hosted **Remote MCP (`do-remote-mcp`, `13,428` accounts, `70.4%`)** nearly doubles `Stayed Back` MCP retention (**42.0%** vs **21.4%** for Local MCP) because OAuth eliminates local Node/JSON config friction, but **Local MCP (`5,640` accounts, `29.6%`)** converts **54.1%** of visible accounts into Stage 4 Verified Infra Deployers vs **34.7%** on Remote MCP (**+19.4 pp**) because Local MCP runs inside the IDE next to application code and git repos.
- **Which Individual Infra Endpoints Are Deployed via MCP:**
  1. **Droplets & 1-Clicks:** `13,310` readers -> `4,814` writers (`36.2%` conversion) -> **`4,572` verified billed deployers** (`2,502` `Only MCP` + `2,070` `MCP + Others`). **83.8%** (`2,502 / 2,985`) of all `Only MCP` verified deployers deploy Droplets.
  2. **App Platform:** `4,743` readers -> `1,896` writers (**`40.0%`** conversion — highest of any compute endpoint) -> **`1,761` verified billed deployers** (`364` `Only MCP` vs `1,397` `MCP + Others` — **3.8x** skew toward multi-tool repo-connected builders).
  3. **Managed Databases:** `3,083` readers -> `971` writers (`31.5%`) -> **`952` verified billed deployers** (`146` `Only MCP` vs `806` `MCP + Others`).
  4. **Cloud Firewalls (`844` verified), Domains/DNS/CDN/Certs (`550`), Spaces (`359`), VPC/LB/Reserved IPs (`197`), Volumes/NFS (`79`), DOCR (`74`), DOKS (`65` verified — `0` in `Only MCP`, `65` in `MCP + Others`), Gradient AI / Agents / MicroVMs (`26` verified), and Functions (`6` verified billed out of `80` writers due to free tier).**

---

### 5. Individual DO & AI Service Attach: `Only MCP` Is a `1.62`-Service Droplet Entry Point; Stage 4 MCP Deployment Multiplies App Platform (`1.80x`) and Postgres (`1.64x`) Attach

Across all **23** individual billed DigitalOcean and Gradient AI services (`Mar 2025 – Oct 2026`, `MFD.MONTHLY_ACCOUNT_PRODUCT_REVENUE` + behavioral AI telemetry):

| Individual Service | All `19,068` Clean Attach (`Era` / `Oct 26`) | `Only MCP` Attach (`11,054`) | `MCP + Others` Attach (`8,014`) | Stage 4 Verified Deployer (`6,733`) | Stage 1 Read-Only (`8,458`) | Oct 2026 Gross USD (Visible Daily Spine) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| **Droplets (incl. Backups/Snapshots)** | `69.5%` (`13,250`) / `57.5%` | `57.0%` (`6,301`) | `86.7%` (`6,949`) | **`90.9%`** (`6,121`) | `59.5%` (`5,036`) | $1,802,932 |
| **App Platform** | `26.0%` (`4,952`) / `18.0%` | `9.7%` (`1,072`) | `48.4%` (`3,880`) | **`37.2%`** (`2,501`) | `20.6%` (`1,745`) | $337,677 |
| **Spaces Object Storage** | `25.2%` (`4,798`) / `21.4%` | `9.0%` (`992`) | `47.5%` (`3,806`) | **`33.6%`** (`2,263`) | `22.0%` (`1,859`) | $146,784 |
| **Managed PostgreSQL** | `22.8%` (`4,341`) / `16.7%` | `7.5%` (`826`) | `43.9%` (`3,515`) | **`31.6%`** (`2,125`) | `19.2%` (`1,626`) | $399,733 |
| **Volumes Block Storage / NFS** | `11.5%` (`2,196`) / `8.2%` | `4.3%` (`477`) | `21.5%` (`1,719`) | `14.3%` (`962`) | `10.5%` (`889`) | $136,075 |
| **Networking (LB / Reserved IP / VPC)** | `9.2%` (`1,750`) / `5.6%` | `1.6%` (`176`) | `19.6%` (`1,574`) | `10.4%` (`703`) | `8.8%` (`747`) | $60,842 |
| **Container Registry (DOCR)** | `8.9%` (`1,701`) / `6.5%` | `0.9%` (`104`) | `19.9%` (`1,597`) | `11.4%` (`770`) | `7.8%` (`663`) | $12,600 |
| **Managed Valkey / Redis** | `8.8%` (`1,686`) / `6.3%` | `1.6%` (`172`) | `18.9%` (`1,514`) | `12.1%` (`813`) | `7.3%` (`619`) | $79,201 |
| **Managed MySQL** | `6.4%` (`1,212`) / `4.5%` | `2.3%` (`253`) | `12.0%` (`959`) | `7.7%` (`519`) | `6.0%` (`506`) | $126,342 |
| **DOKS (Managed Kubernetes)** | `5.2%` (`984`) / `3.0%` | `0.22%` (`24`) | `12.0%` (`960`) | `5.5%` (`369`) | `5.2%` (`437`) | $756,005 |
| **Gradient Serverless Inference** | `4.4%` (`843`) / `1.8%` | `1.2%` (`135`) | `8.8%` (`708`) | `5.6%` (`379`) | `3.5%` (`298`) | $14,063 |
| **Managed MongoDB** | `3.5%` (`675`) / `2.3%` | `0.9%` (`104`) | `7.1%` (`571`) | `4.7%` (`314`) | `3.1%` (`260`) | $40,599 |
| **Managed OpenSearch / Vector** | `3.5%` (`673`) / `1.5%` | `0.6%` (`63`) | `7.6%` (`610`) | `4.4%` (`299`) | `2.9%` (`249`) | $28,187 |
| **Gradient Agent Platform** | `2.6%` (`490`) / `0.3%` | `0.6%` (`62`) | `5.3%` (`428`) | `3.1%` (`206`) | `2.1%` (`179`) | $164 |
| **GPU Droplets / Bare Metal / Paperspace** | `2.1%` (`409`) / `0.6%` | `0.7%` (`73`) | `4.2%` (`336`) | `2.9%` (`193`) | `1.8%` (`149`) | $168,529 |
| **Model Routers / Sandboxes / KBs / Action GW** | `0.6%` / `0.5%` / `0.4%` / `0.4%` | `<=0.18%` each | `1.3%` / `1.1%` / `0.9%` / `0.6%` | `0.89%` / `0.74%` / `0.40%` / `0.34%` | `<=0.38%` each | $917 |

- **DOKS Is Read via MCP, Provisioned via IaC:** DOKS is the **#2 revenue product** among MCP accounts (**$756,005** Oct gross across `523` Oct-billed visible accounts), yet **68.9%** of DOKS MCP revenue (`$521,933`) comes from **Non-Infra / Read-Only** MCP accounts in `MCP + Others`, and **zero** `Only MCP` accounts ever deployed DOKS via MCP. Kubernetes operators use MCP for read-only cluster inspection/debugging while provisioning via `Terraform` and `doctl`.
- **App Platform + Managed Postgres Is the Natural Second-Step Stack:** Stage 4 Verified MCP Deployers attach to **App Platform** at **37.2%** (`1.80x` Stage 1 Read-Only's `20.6%`) and **Managed PostgreSQL** at **31.6%** (`1.64x` Read-Only's `19.2%`), proving that guided multi-resource app + database deployment is already working for `MCP + Others` and represents the highest-leverage expansion path for `Only MCP`'s Droplet-only signups.

---

### 6. Recommended Product & GTM Actions

1. **Eliminate Remote MCP `401/403` Scope & `422` Droplet Limit Walls In-Flow (Owner: MCP & Auth/Billing Eng):** Default Remote MCP OAuth consent to clear read+write scopes when the user prompts a deployment action, and return structured MCP tool-error remediation payloads on `422` (one-click Droplet limit increase / payment-method link / auto-selecting existing `/v2/account/keys` SSH keys instead of failing `POST /v2/account/keys`). Target: cut Remote MCP `POST /v2/droplets` `422`+`401/403` failure rate from **20.9%** to **<8%** and lift `Only MCP` Stage 4 deployment from **31.4%** to **42%+**.
2. **Ship Guided "App + Postgres" & "Droplet + Firewall + Domain" Golden-Path MCP Prompts for ChatGPT / New Signups (Owner: DevEx PM & Docs):** **2,098** ChatGPT-referred `Only MCP` accounts retain on MCP (`42.7%`) but stall at `27.5%` Stage 4 deployment and `1.62` services. Replace generic "list my Droplets" onboarding examples with repo-to-App-Platform + Managed Postgres and Droplet + Cloud Firewall + DNS composite MCP workflows.
3. **Position Remote MCP for `doctl` / `Terraform` Veterans Around Read-Safe Day-2 Observability & Incident Triage (Owner: Core Compute / DOKS PM):** Since `MCP + Others` drives **93.0%** of revenue (`$4.28M`/mo) and uses MCP heavily for read-only inspection on DOKS (`776` readers vs `74` writers) and Day-2 Droplet actions (`50%` of Droplet POSTs), invest in richer read-only diagnostic tools (logs, metrics, deployment diffing, billing/cost anomaly checks) rather than forcing IaC teams to mutate production clusters via MCP.

---

## Methods & Caveats Appendix

1. **Data Sources & Executed Query IDs (`< '2026-11-01'`):**
   - **Account Spine & Verb Telemetry:** Google Sheet `MCP Usage data Updated` (`Account Retention`, `19,074` accounts from `RAW.EDGE_API_REQUESTS`, `2025-06-08` to `2026-10-31`) merged with `PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY` (`01c89f63-0821-dd8d-001b-b50227cccd7f`, `01c89f68-0821-dd8d-001b-b50227cd5fd3`, `01c89f69-0821-dd8d-001b-b50227cdebf3`, `01c89f54-0821-dd8d-001b-b50227cb7a1f`) and 2-day `PRODUCTION.RAW.EDGE_API_REQUESTS` calibration on `2026-09-09` and `2026-10-14` (`01c89f6a-0821-cfce-001b-b50227ce50e7`).
   - **Account Hygiene, Persona, Billing, NRR & 23-Service Vectors:** `PRODUCTION.CORE.ACCOUNTS`, `PROMOS_GITHUB_STUDENT_PACK_USAGES`, `WEB_ANALYTICS.ACCOUNT_SESSIONS`, `MFD.MONTHLY_ACCOUNT_REVENUE`, `MFD.ACCOUNT_NET_DOLLAR_RETENTION`, `MFD.MONTHLY_ACCOUNT_PRODUCT_REVENUE`, `GEN_AI_USAGE_EVENTS_DAILY`, `GEN_AI_STARFISH_AGENTS`, `GEN_AI_STARFISH_KNOWLEDGE_BASES`, `GEN_AI_MODEL_ROUTERS`, `OHS.SESSIONS`, and `ACTION_GATEWAY.USAGE_TOOL_CALL` (`01c89f6e-0821-dd8d-001b-b50227cea8d7`, `01c89f72-0821-cfce-001b-b50227cf1d0f`, `01c89f73-0821-cfce-001b-b50227cf5bc7`, `01c89f74-0821-dd8d-001b-b50227d00923`, `01c89f76-0821-cfce-001b-b50227d0533f`, `01c89f76-0821-cfce-001b-b50227d05323`, `01c89f7a-0821-dd8d-001b-b50227d106d3`, `01c89f7f-0821-cfce-001b-b50227d22027`, `01c89f7f-0821-cfce-001b-b50227d22023`).
2. **Classification Priority & False Positives Removed:**
   - **Internal / Daemon Traffic Stripped Before `Only MCP` vs `MCP + Others`:** Excluded `product IN ('billing','my','registry')`, internal UAs (`SFDC-Callout`, `service`, `services`, `widget`, `Edge-Tester%`, `mcp-e2e%`, `k8saasdev%`), DOKS in-cluster controllers (`cloud-controller-manager`, `cluster-autoscaler`, `csi-digitalocean`, `doks-%`, `cert-manager`, `external-dns`, `do-operator`), container daemons (`docker`, `containerd`, `crane`, `kaniko`, `skopeo`, `cosign`, `buildah`, `trivy`, `helm`), browsers (`Mozilla%`), and crawlers (`meta-externalagent%`). Without this filter, any `Only MCP` user who opened the Cloud Console or pulled a container image would be misclassified into `MCP + Others`.
   - **Synthetic / Probe `%mcp%` UAs Removed:** Excluded `mcp-e2e%`, `k8saasdev%`, `%probe%`, `%bxss%`, `%nslookup%`, `intigriti%`, `vera-mcp-%`, `bbp-mcp-test%`, and `cakewalk-mcp%`.
   - **Non-Infra Writes Stripped from Stage 3/4 Deployment:** `/v2/account` (SSH keys), `projects`, `tags`, `images`, `consent`, `signals`, `uptime`, `monitoring`, `insights`, and `DELETE`-only calls are isolated in **Stage 2** (`1,154` accounts) rather than counted as infrastructure deployment.
3. **Key Caveats & Bias Direction:**
   - **`PRODUCT_API_REQUESTS_DAILY` Sampling (`Floor` on Stage 3/4 Counts & `MCP + Others` Share):** **2,336** clean Sheet-only `1–2d` accounts lack rows in `PRODUCT_API_REQUESTS_DAILY`. Their companion-interface check (`comp_m`) and Stage 1–4 verb classification therefore represent a **floor** (we isolate them explicitly as `Stage 0` in the deployment ladder rather than assuming Stage 1).
   - **Action-Endpoint Conflation in `PRODUCT_API_REQUESTS_DAILY` (`Ceiling` on Net-New VM Creation, `Unchanged` on Active Paid Infra Management):** Because `PRODUCT_API_REQUESTS_DAILY` groups `POST /v2/droplets` and `POST /v2/droplets/{id}/actions` under `product = 'droplets'`, Stage 4 Verified Deployer (`6,733` accounts) is a **ceiling** on net-new resource creation via MCP (~50% of Droplet `POST` calls in raw `EDGE` calibration are Day-2 `/actions` on active billed Droplets), though **unchanged** as a measure of active mutating management of paid infrastructure.
   - **Custom Wrapper User-Agents (`Floor` on Local/3P MCP Adoption):** Developers who wrap DigitalOcean API calls inside custom Python/Node scripts without `"mcp"` in the HTTP `User-Agent` are invisible to UA-based MCP detection (**floor** on total MCP adoption).
4. **Reproducible Artifacts (Zero PII):**
   - Script: `Data Analysis/scripts/build_mcp_19k_cohorts.py`
   - SQL Pack: `Data Analysis/sql/57_mcp_19k_cohort_and_services.sql`
   - Aggregate CSVs: `Data Analysis/data/mcp_19k_spine_reconciliation.csv`, `Data Analysis/data/mcp_19k_cohort_matrix_2x4.csv`, `Data Analysis/data/mcp_19k_infra_deployment_ladder.csv`, `Data Analysis/data/mcp_19k_mcp_endpoints_deployed.csv`, `Data Analysis/data/mcp_19k_personas.csv`, `Data Analysis/data/mcp_19k_companion_interfaces.csv`, `Data Analysis/data/mcp_19k_individual_services.csv`
