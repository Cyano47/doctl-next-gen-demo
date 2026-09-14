# 07 — Dependencies on Other Teams

Every team Launchpad depends on, derived from what the product actually provisions (`DO_TERRAFORM_STACK_RESOURCES`: droplet, app_platform, knowledge_base, genai_agent, dbaas, loadbalancer), what the record says it needs (`Past Work/04` §5–7), and what the failure analysis (`05`) attributes to each. Team names are functional; map to actual org names before circulating.

For each dependency: **what Launchpad needs**, **what the record says**, **what the data says**, **what is unknown**, and **the type of dependency** — *Build* (they must ship something), *Maintain* (they must keep something working), *Agree* (they must accept a boundary), *Inform* (they hold information Launchpad needs).

---

## Tier 1 — Launchpad cannot function without them

### 1. Gradient (GenAI platform: agents, knowledge bases, inference) `[3.2.5, 1.1, 1.6]`

- **Needs:** stable agent + knowledge-base provisioning APIs; a way to load content into the KB at deploy time so the first-hour demo is not empty; ownership of AI cost/token telemetry (the research explicitly places this in Gradient's domain); agreement that Launchpad may create Gradient resources on the user's behalf.
- **Record:** the RAG kit — 80% of Launchpad volume — is functionally a Gradient onboarding flow with infrastructure attached. Gradient is not mentioned once in the Past Work as a stakeholder.
- **Data:** every RAG stack creates one `genai_agent` and one `knowledge_base` (354 each). July/September provisioning failures are unattributed; Gradient API drift is the leading candidate.
- **Unknown:** Gradient's own roadmap for "deploy an agent with infra"; whether Gradient sees Launchpad as distribution or as overlap; whether Gradient changed anything in July or September.
- **Type:** Build, Maintain, Agree, Inform. **This is the most under-recognised dependency in the record.**

### 2. App Platform `[3.2.2, 1.3, 1.6, 7.4]`

- **Needs:** app creation from a template repo; the redeploy loop after handoff; a first-run experience for an app that arrives with sibling resources; agreement on the "one level above" boundary; ideally a spec extension that can express multi-resource architectures so Launchpad's output is a first-class App Platform object rather than an orphan.
- **Record:** every PRFAQ carries a non-cannibalisation paragraph; the reviewer note "be clear how this is different from App Platform" shaped drafts; Scrydex replaced Terraform with App Platform YAML. The boundary is asserted, never agreed.
- **Data:** 266 Launchpad apps live in `APP_PLATFORM_APPS`; 93% never redeployed; 37 idle survivors. ~21k SMB accounts with live apps are the ICP pool (`06`).
- **Unknown:** App Platform's roadmap for multi-resource deploys; whether App Platform PM regards Launchpad as a funnel or a fork; whether the spec can express agent + KB + DB today.
- **Type:** Build (first-run, spec), Agree (boundary), Inform (roadmap).

### 3. Terraform provider & IaC (Vik's team) `[3.1.4, 1.3, 1.8, 10.4]`

- **Needs:** provider coverage for every resource the kits create (Gradient agent/KB included); a state-ownership model (platform-managed vs user-managed); the export/"eject" artifact the research called for; a position on the one-way-door question.
- **Record:** Terraform runs invisibly in the background; the eject hatch is recommended and absent; the state-layer decision is flagged five times and analysed zero.
- **Data:** 1,004 Terraform jobs; failure curve F4; `project_id` populated with a single value across all stacks (E30 — design says one project per deploy).
- **Unknown:** whether provider version drift caused any failures; reversibility of the Terraform choice; whether state is retained after a stack is "deleted."
- **Type:** Build, Maintain, Inform. **Internal to Vik's ownership — the one dependency Vik can resolve unilaterally.**

### 4. Console & Growth `[3.2.1, 6.3, 8.5]`

- **Needs:** placement; the entry point; funnel instrumentation (the ten planned metrics, two reported); an account of what changed in August.
- **Record:** "premium in-console placement" asserted; "customers search for a product, not an architecture" asserted; both in the same doc.
- **Data:** volume flat May–July, −70% in August, −50% in September. Penetration <0.1% of best segment.
- **Unknown:** everything about August. `SEGMENT_CLOUD_EXPERIMENT_VIEWED` may hold it.
- **Type:** Inform (urgently), Build (instrumentation), Agree (placement going forward).

## Tier 2 — Launchpad depends on them for specific kits or steps

### 5. Marketplace `[3.2.3, 7.1.3, 8.4]`

- **Needs:** the ELK and Airflow blueprints; a process for keeping images current (Marketplace has a vendor portal for this; Launchpad has nothing); agreement on whether Launchpad kits are Marketplace listings.
- **Record:** two of three kits were scoped to reuse Marketplace blueprints "to minimise new infrastructure work"; the retrospective lists Marketplace as an overlap risk.
- **Data:** ELK + Airflow together <20% of volume and shrinking; `MARKETPLACE_DROPLETS` holds the comparator retention data (not yet queried, 7.c).
- **Unknown:** whether Marketplace would host multi-resource kits; whether "deploy an architecture" belongs in Marketplace search.
- **Type:** Maintain (blueprints), Agree (listing model), Inform (comparator data).

### 6. Managed Databases (DBaaS) `[3.2.6, 1.6, 4.4]`

- **Needs:** provisioning; upgrade/patch story for a DB the user did not configure; cost transparency for the DB line item.
- **Data:** 308 `dbaas` resources across 262 stacks.
- **Unknown:** whether idle survivors are paying for DBs they forgot (4.b).
- **Type:** Maintain, Inform.

### 7. Droplets / Networking (Load Balancers, VPC) `[3.2.6, 1.4, 4.2]`

- **Needs:** droplet images for ELK/Airflow; LB and private networking defaults; the OS-patching story the interviews asked about ("who patches this").
- **Data:** 690 droplets across 334 stacks; 220 load balancers.
- **Type:** Maintain, Inform.

### 8. API & MCP server (Vik's team) `[3.1.1, 3.1.2, 2.2, 7.1.1]`

- **Needs:** for the AgentDeploy direction — every Launchpad action exposed as MCP tools so a coding agent can do what the console does; a bench test of whether agents can already close 1.4 (DNS/SSL/secrets/health) today.
- **Record:** Quinn's recommended redirect ("integrations with 3p coding tools"); AgentDeploy's premise (C18) that agents *cannot* close the loop — untested; Wiplash's behaviour suggests they partly can.
- **Data:** `TOOL_REGISTRY_MCP_SERVERS` exists; not yet joined to Launchpad users (2.a).
- **Type:** Build, Inform. **Also internal to Vik's ownership.**

### 9. MARS — Managed Agent Runtime Services `[3.2.4, 7.1.4, 2.2]`

- **What it is (Slack, `09`):** DigitalOcean's hosted coding-agent platform — microVM sandboxes running Claude Code, Codex CLI, Cursor, OpenCode or custom agents from an `agents.yaml`; Secrets Manager; session Insights. RFC Jul 2026; Public Preview 10 Sep 2026; first-party provider in OpenAI's Agents API. Team: Syed Hashmi, Jagan Mohan Ungati, Divya Nag, Sathish Jothikumar, Josh Bailey; RFC by Adil Hafeez.
- **Needs:** not a control plane for Launchpad — the dependency runs the other way. A MARS-hosted agent that writes an application needs somewhere to *deploy and operate* it; Launchpad's capability, exposed via MCP/API, is that somewhere. Needs: agreement that Launchpad's tools are in the default MARS agent toolset; a joint demo (agent in MARS → architecture on DO); shared adoption instrumentation (MARS already filed theirs with Data on 9 Jul — Launchpad never did).
- **Record:** one mention, as an alternative investment. Quinn's own channel (13 May): "just trying to grok: MARS <> Agent Hub <> Managed Agents."
- **Type:** Agree (toolset), Build (MCP tools — Vik), Inform (MARS roadmap). **3.a resolved.**

### 9a. Growth / Console Onboarding (Haley Eidem, Aaron Mitchell, Kapil Kulkarni) `[3.2.1, 6.3, 8.5]` — *added from Slack, `09`*

- **What they are doing:** shipping "Product Stack Explorer" (GROW-5095, flag `ui_product_stack_explorer`) on the home dashboard below Quick Actions — a stack-selection surface whose initial stacks come from Launchpad and `digitalocean.com/solutions`. Proposed an A/B/C/D test on home-vs-Launchpad placement; primary metric "resource deployment count." Explicitly avoiding Launchpad itself: "there's talk about using Launchpad for other things, so I'd rather us not get involved there."
- **Needs from them:** what changed on the dashboard ~5 Aug (the cliff); the experiment framework and the placement test; agreement that Stack Explorer and Launchpad are one funnel, not two; their product-usage-grouping research ("what customers actually are purchasing to compose their solutions") as an input to which architectures Launchpad should offer.
- **Type:** Inform (August), Agree (one funnel), Build (experiment). **Tier 1.** They asked the `05` question themselves on 9 Sep, without the Past Work.

## Tier 3 — Enabling functions

### 10. Billing & Cost `[1.7, 4.3]`

- **Needs:** pre-deploy estimate accuracy; spend caps (explicitly out of MVP scope); a way to see the whole stack's cost as one line; attribution of Launchpad-created revenue.
- **Data:** no Launchpad revenue table exists; 6.d.
- **Type:** Build (caps, aggregation), Inform (attribution).

### 11. Security & Compliance `[4.2]`

- **Needs:** review of template defaults; posture statement for the SMB ICP (which is production-minded even if not compliance-mandated).
- **Record:** NFRs assert secrets encryption and private networking; no review on record; compliance controls out of scope.
- **Type:** Inform (review), Agree (what "production-ready" means for the ICP).

### 12. Support `[9.6, 4.5]`

- **Needs:** a runbook for Launchpad-created resources; a signal when tickets reference them.
- **Record:** zero support voice in the Past Work.
- **Data:** ticket search on `rag-assistant-*-chat` not yet done (9.c).
- **Type:** Inform, Maintain (runbook).

### 13. Research (ANE customer insights) `[11.3, 6.1]`

- **Needs:** the sampling frame for the nine interviews; the archetype-to-segment rubric (6.b); execution or support for next week's interviews (`06`).
- **Type:** Inform, Build (rubric).

### 14. Data & Analytics `[5.1.8, 11.3]`

- **Needs:** the Launchpad funnel instrumented end to end; the joins in `04` productionised; entry-point attribution; ELK/Airflow retention.
- **Data:** the stack tables exist and are populated; `stack_id` in the resources view does not join to anything — a modelling defect worth one ticket.
- **Type:** Build (funnel), Maintain (views).

### 15. Sales Engineering `[2.6]`

- **Needs:** confirmation of whether kits were used for demos; whether some of the 21 repeaters are SEs.
- **Type:** Inform.

### 16. Product Leadership `[9.2, 9.3, 9.4]`

- **Needs:** the decision-maker, the criteria, the deadline; the boundary ruling between Launchpad, App Platform, MARS, Gradient, Marketplace; the answer to "what happened after 27 Aug."
- **Type:** Agree. **Blocks everything in Tier 1 that is of type Agree.**

---

## Dependency map by cause (from `05`)

| Cause | Teams that must act |
|---|---|
| 1. Provisioning breaking | Gradient, Terraform/IaC, Marketplace, Data (alerting) — and an *owner* (Leadership) |
| 2. First hour does not convince | Gradient (KB content), App Platform (first-run), Billing (cost clarity), Console |
| 3. Nothing to come back for | App Platform (redeploy loop), MARS (if it is the control plane), Terraform (export), Managed DB/Droplets (upgrade story) |
| 4. Built for one user, used by another | Research, Data, Security (posture for SMB), Billing (caps) |
| 5. Nobody could find it / August cliff | Console & Growth (Stack Explorer team, 9a), Marketplace, API/MCP (for agent-driven users) |
| 6. No boundary | Leadership, App Platform, Growth (Stack Explorer), MARS (toolset), Gradient, Marketplace |

## What Vik can do without anyone's agreement

Terraform/IaC (3) and API/MCP (8) are inside Vik's ownership. Concretely available this month: the provider-drift check on the failure curve; the state/export model memo (10.b); the MCP bench test of the AgentDeploy premise (1.c); and productionising the `04` joins with Data. Everything else in Tier 1 needs a conversation first — Gradient, App Platform, and Console are the three to have before the interviews, because their answers change the interview questions.
