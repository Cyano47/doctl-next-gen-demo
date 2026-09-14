# 03 — Missing Pieces

Parts of the problem structure (`01_Decomposition.md`) for which no material exists in the Past Work, and which `04_Data_Findings.md` did not fill. For each: what is missing, why the structure needs it, the artifact that would fill it, and where it most likely lives. "Owner" is a best guess at the team, not a person.

Items marked **★** are the ones whose absence most limits the decisions in `05`–`08`.

**Update 14 Sep (Slack, `09`):** 3.a resolved (MARS is a coding-agent runtime, not a control plane); 5.a partially resolved (agent-Launchpad prototypes built in Aug; Growth team building an adjacent Stack Explorer; "talk about using Launchpad for other things" on 9 Sep; no decision on record); 3.d has a candidate (dashboard Launchpad section changed ~5 Aug per e2e failures); 1.a partially filled by the Israel and Uma interviews in `#customer-insights`. Rows below are left as written so the before/after is visible.

## §1 The gap — the work itself

| # | Missing | Why it matters | Artifact that fills it | Where / owner |
|---|---|---|---|---|
| 1.a ★ | **What the 108 same-day deleters experienced.** Did the app work? Did they see the cost estimate? Did the RAG app answer badly? Did they just want to see it provision? | 41% of the user base. Largest cohort. No Day-2 theory covers them. | 10–15 exit interviews (see `06`), or an in-product destroy survey on Launchpad-created resources | Launchpad + Research |
| 1.b | Which of 1.1–1.9 the 21 repeat teams were doing. Replicating for clients? Demoing? Testing presets? | Only behavioural evidence of a recurring job. | 5 interviews with repeaters (`06`) | Research |
| 1.c | Whether a coding agent with a DO API token can already do 1.4 (DNS, SSL, secrets, health) end-to-end today via the MCP server. | AgentDeploy's founding premise (C18) is untested. | A half-day bench test: Claude Code + DO MCP server, deploy FreeScout to production with domain and TLS. Record what it cannot do. | API/MCP (Vik's team) |
| 1.d | What the RAG kit actually deployed — the architecture, the presets, the default sizes, the monthly cost of the default. | Cannot judge 4.1 (correctness) or 4.3 (cost) without it. Not in any Past Work file. | The template repo + Terraform module; a screenshot of the cost estimate | Launchpad eng |

## §2 The actor

| # | Missing | Why | Artifact | Owner |
|---|---|---|---|---|
| 2.a | Whether Launchpad users also call the API / `doctl` / MCP / Terraform provider directly, before or after deploying. | Tells whether the actor is a human in the console or an agent — decides which surface a successor lives on. | Join `DO_TERRAFORM_STACKS.team_uuid` to `PRODUCT_API_REQUESTS_DAILY` and `TOOL_REGISTRY_MCP_SERVERS` | Data (query not yet run) |
| 2.b | The "ANE" definition and the interview sampling frame. | B12. Without it the archetypes cannot be sized. | One paragraph from the research team | ANE insights team |
| 2.c | Sales / SE use of Starter Kits as demo environments. Did it happen? Did it help? | Named secondary user; zero evidence either way. Some of the 21 repeaters may be SEs. | Ask; check repeaters against employee-adjacent accounts | Sales eng |

## §3 Surfaces

| # | Missing | Why | Artifact | Owner |
|---|---|---|---|---|
| 3.a ★ | **What MARS is.** Scope, status, owner, roadmap, what it abstracts. | Quinn's named alternative; every "redundancy" argument depends on it. Zero description in the record. | MARS PRD / one-pager / 30-min conversation | MARS owner |
| 3.b | App Platform's roadmap for multi-resource / "architecture" deploys, and its spec's ability to express what Launchpad provisions (agent + KB + DB + app). | Defines whether "one level above App Platform" is a durable boundary or a temporary gap. | App Platform roadmap; a spec-expressiveness check | App Platform PM |
| 3.c | Gradient's roadmap for agent + knowledge-base deployment UX. | The RAG kit is 80% of Launchpad volume and is, functionally, a Gradient onboarding flow with infra attached. | Gradient PM conversation | Gradient |
| 3.d | Console team's account of what changed in August (placement, tile, nav, experiment). | The volume cliff (F1) has no explanation. | Console release notes / experiment log; `SEGMENT_CLOUD_EXPERIMENT_VIEWED` may show it | Console |
| 3.e | MCP server capability inventory: which DO resources and actions it exposes today. | Needed for 1.c and for the AgentDeploy premise. | Tool list from the MCP server repo | API/MCP |

## §4 Trust

| # | Missing | Why | Artifact | Owner |
|---|---|---|---|---|
| 4.a | Whether any surviving Launchpad deployment has been patched, upgraded, or scaled by anyone. | Distinguishes "running and maintained" from "running and forgotten." | Droplet/app change history for the 41 survivors | Data |
| 4.b | Cost incurred by the 37 idle-but-existing apps and their DBs / agents. | If users are paying for things they forgot, that is a trust event waiting to happen. | Billing join on surviving resource IDs | Data / Billing |
| 4.c | Security review of what the templates deploy (defaults, exposed ports, secrets handling). | 4.2 is asserted in NFRs; no review on record. | Security review doc | Security |

## §5 The Launchpad record

| # | Missing | Why | Artifact | Owner |
|---|---|---|---|---|
| 5.a ★ | **What happened after 27 Aug.** Was the recommendation accepted? Is AgentDeploy staffed? Is anyone maintaining the templates (F4 says no)? | Decides whether this is a relaunch, a rescue, or a post-mortem. | One conversation with Quinn and with the PRFAQ authors | Quinn; PRFAQ authors |
| 5.b | The two inaccessible source docs (IDs ending `…Zqs`, `…VEM`). | Unknown unknowns. | Fix sharing; re-read | Vik |
| 5.c | ELK and Airflow retention. | Only RAG retention was measured. | Droplet join on `DO_TERRAFORM_STACK_RESOURCES.resource_id` (droplet) → droplet lifecycle table | Data |
| 5.d | Results against the planned metric framework (time-to-first-deploy, drop-off, attach, scale-up). | The team defined ten metrics and reported two. | Amplitude/Segment funnel for the Launchpad flow, if instrumented | Launchpad / Analytics |
| 5.e | Entry-point attribution: how each of the 467 deploys arrived (console tile, docs, Marketplace, blog, link). | Distribution is being both blamed and exonerated without data. | Referrer on the deploy event; `SEGMENT_FRONT_END_IDENTIFIES` / page events | Analytics |
| 5.f | Prototype fidelity: how much of the repo-scanning demo is real code. | E8. Changes the relaunch cost estimate by an order of magnitude. | Repo access or a 30-min demo | Launchpad eng |
| 5.g | `project_id` discrepancy (E30). | Design says one project per deploy; view shows one value. | Ask eng; check source table | Launchpad eng |

## §6 Customer base

| # | Missing | Why | Artifact | Owner |
|---|---|---|---|---|
| 6.a ★ | **Size of the Advanced SMB / cloud-adoption-advanced / $100–10k LTV population** on DigitalOcean, and its growth rate. | This is the ICP the data points at (`06`). Need the denominator. | One query on `ACCOUNT_SEGMENT_TYPES` × `ACCOUNTS` | Data (straightforward) |
| 6.b | Mapping of the four interview archetypes onto DO segmentation fields. | The archetypes are the language of the research; the segments are the language of the data. Nobody has bridged them. | A short rubric agreed with the research team | Research + Data |
| 6.c | Why the 129 unmatched accounts are unsegmented (too new? URN format?). | 43% of users; affects every segment percentage. | Check segmentation job cadence | Data |
| 6.d | Revenue attributable to Launchpad-created resources over their life. | Only "value" measure DigitalOcean actually has. | Billing join on stack resource IDs | Billing / Data |

## §7 Alternatives

| # | Missing | Why | Artifact | Owner |
|---|---|---|---|---|
| 7.a | Hands-on benchmark: deploy the same RAG app on GCP Agent Starter Pack, Railway/Render, Vercel + Supabase, and via Claude Code + DO MCP. Time, steps, cost, what breaks on Day 2. | C17 has never been tested. | Half-day per alternative; a comparison sheet | PM (Vik) |
| 7.b | Whether any interviewee evaluated and rejected a named competitor. | No switching evidence at all. | Add to interview guide (`06`) | Research |
| 7.c | Marketplace 1-click adoption and retention for comparable stacks (e.g. the ELK / Airflow blueprints Launchpad reused). | The nearest internal comparator; tells whether Launchpad's retention is unusual or normal for templated deploys. | Query `MARKETPLACE_DROPLETS` for the same images | Data |

## §8 Economics

| # | Missing | Why | Artifact | Owner |
|---|---|---|---|---|
| 8.a | Team, cost, and timeline for any scope — the retrospective leaves `[INSERT]`. | No estimate exists anywhere. | Engineering sizing session | Eng lead |
| 8.b | Which "other investments with stronger pull" Quinn meant. | Opportunity cost is asserted with no comparator. | Ask Quinn | Quinn |
| 8.c | Current monthly cost of keeping Launchpad live as-is (infra, on-call, template rot). | It is live and failing 71% of the time; that has a cost today. | Eng estimate | Launchpad eng |

## §9 Organisation

| # | Missing | Why | Artifact | Owner |
|---|---|---|---|---|
| 9.a ★ | Who decides, by when, against what criteria. | Without it every file in this folder is analysis with no consumer. | One line from Vik's manager | Vik |
| 9.b | Quinn's role and mandate. | D22 rests on an unverified seniority claim. | Ask | Vik |
| 9.c | Eng, design, support, sales voices on Launchpad. | Zero on record. Support tickets on Launchpad-created resources would be especially telling. | Support ticket search for the app names (`rag-assistant-*-chat`) | Support |
| 9.d | The boundary decision: who owns "architecture-level deploy" — Launchpad, App Platform, MARS, or Gradient. | Named as unresolved in every PRFAQ. | A decision, not a document | Product leadership |

## §10 Time

| # | Missing | Why | Artifact | Owner |
|---|---|---|---|---|
| 10.a | Decision deadline and what forces it. | Nothing in the record says when. | Vik | Vik |
| 10.b | Reversibility analysis of the Terraform-as-state-layer choice vs alternatives (App Platform spec, Pulumi, custom). | E27 is asserted five times and analysed zero. | Two-page technical memo | Vik / IaC eng |

## §11 Evidence base

| # | Missing | Why | Artifact | Owner |
|---|---|---|---|---|
| 11.a | Resolution of the PRFAQ dating inconsistency (June vs September). | Affects whether AgentDeploy pre- or post-dates the discontinuation rec (D23). | Google Doc version history | Vik |
| 11.b | Provenance of "Vik's ownership" and "growth area" statements in the Past Work. | They shaped the original frame; they came from outside the sources. | Confirm with Vik | Vik |

---

## Summary by urgency for next week's interviews

Must have before interviews: **1.a** (the question set is built around it), **6.a** (to recruit from the right pool), **5.a** (to know whether interviewees are being asked about a live product or a dead one).

Can run in parallel with interviews: 2.a, 5.c, 6.c, 7.c (all single queries); 1.c and 3.e (one afternoon on the MCP server); 3.a and 3.d (two conversations).

Can wait for after: everything in §8, §10, and 7.a.
