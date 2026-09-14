# 09 — Slack Echoes (Sep 2025 – Sep 2026)

Public-channel Slack search, run 14 Sep 2026, for whether the problems named in `02`–`08` are echoed elsewhere in the company. Private channels and DMs were not searched (requires consent). Each echo is tied to the component or cause it bears on; quotes are verbatim; names are DigitalOcean employees or customers who were interviewed by DigitalOcean and posted about internally.

Workspace: `digitalocean.enterprise.slack.com`. Permalinks are of the form `/archives/<channel>/p<ts>`.

---

## What the search resolved

Three of the ★ gaps in `03_Missing_Pieces.md` moved:

| Gap | Before | After Slack |
|---|---|---|
| **3.a — What is MARS** | Undescribed | **Resolved.** MARS = *Managed Agent Runtime Services/Stack* — DigitalOcean's hosted coding-agent platform (microVM sandboxes; Codex CLI, Claude Code, OpenCode, Cursor as pre-configured agent types; agents.yaml config; Secrets Manager; Insights). RFC Jul 2026; internal testing Aug; Public Preview **10 Sep 2026**; first-party provider in OpenAI's Agents API (11 Sep). It is **not** a multi-resource infrastructure control plane. |
| **5.a — What happened after 27 Aug** | Unknown | **Partially resolved.** No Slack record of the recommendation being accepted or rejected. But: `agent-launchpad-prototype` repos were created by Scott Miller (5 Aug) and Quinn Eckart (18 Aug); the Docs team requested a Launchpad icon (20 Aug); the Growth team is shipping a "Product Stack Explorer" that sources its stacks from Launchpad and debated "are we replacing launchpad with this?" (29 Aug); and on 9 Sep a Growth PM wrote "there's talk about using Launchpad for other things." Launchpad is live, still being iterated on by people outside the original team, and its future is being discussed — not settled. |
| **3.d — What changed in August** | Unknown | **One candidate.** From 5 Aug, the `ui-starter-kit` e2e suite began failing on *"Dashboard Launchpad starter kits shows three starter kit cards in the Dashboard Launchpad section — Expected to find content: Launchpad … never did."* The console home-dashboard Launchpad section appears to have disappeared or changed around 5 Aug — the same week volume fell 70%. Unconfirmed; the Console/Growth team can confirm in a minute. |

## Echoes by cause (`05_Why_Not_Working_Today.md`)

### Cause 1 — Provisioning is breaking, unmaintained

- **`#ui-eng-alerts`, 25 Aug → 14 Sep 2026** — `ui-starter-kit` e2e tests failing daily. From 9 Sep: *"Launchpad direct template routes loads RAG on /launchpad/rag_assistant; accepting model terms enables Deploy — Expected to find element `[data-testid="rag-model-terms-agreement-checkbox"]`, but never found it."* The RAG create page's model-terms checkbox stopped rendering on ~9 Sep. The warehouse shows 10 of 14 September deploys failing (F4). Same week.
- **`#ui-dev`, 31 Aug** — release bot: *"ui-starter-kit tests fail 28.57% of the time."*
- **`#marketplace-alerts` / `#audit-testing-alerts`, 27 Aug** — `e2e-pricing` failing: *"Cloud: Launchpad rag assistant lowest_cost matches billing."* The pricing-consistency test for the RAG kit was red the day Quinn's recommendation was dated.
- **`#iam-prs`, 1 May** — Julian Miller: *"not sure if you're up-to-date on launchpad stuff (I'm not at all…), but this should hopefully fix pe smokes."* Three days after launch, Launchpad was already being patched by people outside the team.

→ `[1.3, 1.5, 8.4]`; confirms E-side of `02` A6. Nobody in public Slack is acknowledging or triaging these alerts.

### Cause 2 — The first hour does not convince

- **`#customer-insights`, 11 May — Eunhae Lee, interview with Israel (Josie App)**, headed *"Core Problem: Post-Deploy Drop-off. The most critical finding."* Israel launched the ELK kit and *"immediately hit a wall — he didn't know how to log in or integrate it with his application, and had to hunt through external GitHub docs… This friction was enough to make him abandon the stack in favor of Betterstack."* Quote: *"I launched it, it was very simple... but then I had to go and read some additional documentation to actually find out the password."* His bar: *"I expect within five to ten minutes to start seeing my logs."* On the RAG kit: *"didn't test it because he had no data to seed it with… The lack of sample/demo data as a starting point was a specific blocker."*
- **`#customer-insights`, 3–9 Jun — Quinn Eckart, interview with Uma Mahesh Nandi (RAG Launchpad usability)**: setup praised (*"I expected to manually attach agents and knowledge bases — it just handled everything"*), but *"Unpredictable pricing. Documentation cited a $12 price point, but actual costs became variable and difficult to predict once knowledge base indexing began."* PM takeaway: *"Pricing documentation gap needs immediate attention."*

→ `[1.9, 4.3, 4.8]`. Two independent interviewers, two kits, the same first-hour failure the warehouse shows as 41% same-day deletion (F3). The "empty knowledge base" mechanism hypothesised in `05` is stated by a customer. The `02` entry A3 ("Day-2 is why they left") should be read alongside this: the interviews the company already ran point at Day 0.

### Cause 3 — Nothing to come back for

- **`#customer-insights`, 8 May — Eunhae Lee, interview with David (Club Calima, CTO)**, section *"Automated Maintenance > Initial Setup"*: *"The primary value isn't just the 'start,' but the ongoing curation… 'If using the template lets me update automatically [it's] a super big advantage… [it avoids] spending a significant amount of time every month just upgrading all the dependencies.'"* Also: *"Templates should solve high-friction infra tasks like SSL/certificate management"*; and a preference for *"personal recipes"* (his own Docker Compose stacks) *"unless the generic kits are strictly up-to-date."*
- **Israel (Josie), same 11 May post** — unprompted: *"Your system will ping me and say, we noticed that you are growing. Maybe you need to think of scaling this up… it's time for you to do a security review."*

→ `[1.6, 4.5, 8.2]`. Corroborates D2 in `08`. Note David's condition — generic kits are acceptable only if *"strictly up-to-date"* — which, per Cause 1, they are not.

### Cause 4 — Built for one customer, used by another

- **Uma (TCS engineer, hackathon side project)** and **Israel (serial founder, MRR $262 / LTV $2,545, ~10k users)** and **David (venture-studio CTO, MRR $165 / LTV $1,357)** — the three Launchpad interviewees on record in Slack are: a technically advanced individual, and two Emerging-SMB founders/CTOs in the $1k–3k LTV band. That is the F5/F6 profile, not the proposal's "low–medium infra expertise" target.
- **David**: *"Compliance as a Disruptor… 'If your security aspect grows better and it's easier to do compliance here, then we don't have to pay for Vanta.'"* — the SMB ICP asking for the posture the MVP scoped out (§4.2).

→ `[5.1.6, 6.1, 4.10]`; supports B10/B11 in `02`.

### Cause 5 — Nobody could find it / August cliff

- **`#ui-eng-alerts`, 5 Aug** — dashboard Launchpad section e2e failures begin (see table above).
- **`#customer-insights`, 5 May — Cicily Wu, three nav-redesign interviews** (Adam/Hardcover, Amit, Jack/MSP): all three described the home-page AI/Launchpad area as *"an ad"*: *"Views the Inference/AI section on the homepage as an ad rather than a useful feature"*; *"The homepage's AI/Launchpad section is irrelevant to his use case and takes up prime screen space"*; *"wants to see his assets first, not ads."*
- **`#proj-navbar-redesign`, 13 May** — Gabriel Serrao Mazzei: *"is there a reason why Launchpad is right under Home vs being slotted within the product offerings?"* Cicily Wu: *"you can't favorite home and launchpad since these two are pinned at the top."*
- **`#project-product-stack-explorer`, 4 Sep** — Aaron Mitchell: *"IIRC the launchpad did not have meaningful use though."* Haley Eidem, 9 Sep: *"We know Launchpad wasn't used, but is that because the stacks didn't meet user needs, because users don't want to launch products that way (all at once in the UI), because the product creation flow didn't work well (we know this is at least partially true), or something else?"*
- **Uma** *"discovered the DigitalOcean RAG Launchpad via Google while searching for cloud-based RAG models"* — one data point that search-by-use-case (D5 in `08`) is a real entry path.

→ `[3.2.1, 6.3, 8.5]`. "Premium placement" (A5 in `02`) was, to three interviewed customers, an advertisement they scrolled past; and the Growth PM's list of four hypotheses for why Launchpad "wasn't used" is the same list as `05` — asked independently, two weeks ago, by a team that does not appear in the Past Work.

### Cause 6 — No boundary decision

- **`#launchpad`, 13–15 May** — the channel that carries the name was created by Quinn as `managed-agents`, renamed `agent-hub`, then `launchpad`; Scott Miller: *"wait. you can't name it that, we just launched 'launchpad' for deploy… i just think it could cause confusion."* Archived the same day. Inside: Quinn — *"just trying to grok: MARS <> Agent Hub <> Managed Agents"*; Scott — *"To me MARS seems like the infra, Agent Hub is the cloud console, all under the concept of 'managed agents'."*
- **`#project-product-stack-explorer`, 29 Aug** — Aaron Mitchell: *"where is the stack explorer going to be in the app — are we replacing launchpad with this?"* 9 Sep, Haley Eidem: *"there's talk about using Launchpad for other things, so I'd rather us not get involved there… let's plan to place this on the homepage right below Quick Actions."*
- **`#mars-deploy-v2-execution`, 14 Jul** — Josh Bailey: *"ahh we're putting these products in Agent Platform? as part of mars – open harness we created the new 'Managed Agents' product category."*

→ `[7.4, 9.4, 9.7]`. The naming collision in May is the boundary problem in miniature. A Growth team is now building a stack-selection surface adjacent to Launchpad and explicitly avoiding it because its future is undecided.

## Echoes for `08_Grand_Vision_Inputs.md`

- **D4 / commitment 3 (every surface, same architecture)** — Israel: *"the most natural integration for him would be a DigitalOcean Claude skill — his primary working environment — rather than just the console or CLI."* Adam (Hardcover) runs *"AI agents heavily via Claude Code locally on a Mac Mini"* and finds *"the managed agent platform concept (cloud-based)… not appealing given his local-first setup."* Two agent-native customers, two different surfaces wanted — neither is the console.
- **A1 (repo analysis / architecture agent)** — Uma, offered three roadmap options (*"pre-made Terraform stacks, AI agent for architecture generation from natural language, and analysis of existing apps"*), *"ranked the AI architecture agent as most useful for beginners."* Israel, unprompted, described *"a chat interface… the chat agent interviews me, asks me questions, and then actually launches my first application"* and *"was visibly excited when shown the mockup"* of an internal prototype. The `agent-launchpad-prototype` repos (Aug) are presumably that prototype.
- **MARS connection** — since MARS is a coding-agent runtime, not an infra control plane, the fork in `08` §2 resolves: *Launchpad does not create into MARS.* The relationship is the other way — a coding agent running in MARS could call Launchpad's capability (via MCP/API) to provision and operate the infrastructure the agent's code needs. Quinn's "discontinue Launchpad in favor of integrations with 3p coding tools and MARS" and AgentDeploy's premise are now readable as one statement: the *surface* moves to the agent; the *capability* (architecture → provision → operate) is still needed underneath. That is `08` commitment 3, and it is inside Vik's API/MCP ownership.

## Echoes for `07_Team_Dependencies.md`

Two teams appear in Slack that the Past Work never names:

| Team | Evidence | What it means |
|---|---|---|
| **Growth / Console onboarding** (Haley Eidem PM, Aaron Mitchell, Kapil Kulkarni eng) | `#project-product-stack-explorer`, GROW-5095 "Product Stack Explorer Phase 1 Launch Experiment"; feature flag `ui_product_stack_explorer`; primary metric "resource deployment count"; sourcing stacks from Launchpad and `digitalocean.com/solutions`; an A/B/C/D test on home vs Launchpad placement was proposed 9 Sep | They own the home dashboard where Launchpad's tile lived, are running the experiment framework Launchpad never used, and are building the discovery layer (Cause 5) independently. Add as Tier 1, type *Agree + Build*. |
| **MARS / Managed Agents** (Syed Hashmi, Jagan Mohan Ungati, Divya Nag, Sathish Jothikumar, Josh Bailey) | `#sol-mars-open-harness`, `#mars-internal-testing`, `#genai_uat`, RFC in `#rfc` (Adil Hafeez, Hugo Corbucci) | Already filing Snowflake/Looker adoption instrumentation (9 Jul) — the thing Launchpad never had; already has a Salesforce case type. The reference team for "how a new product gets operational ownership." Replace `07` #9 (MARS as possible control plane) with: *MARS as the agent runtime that would consume Launchpad's capability.* |

Also on record: **Product Docs** (Kate Erickson) still investing in Launchpad assets on 20 Aug; **Customer Insights** (Eunhae Lee, Quinn Eckart, Cicily Wu, Kathryn Bartel) running Launchpad interviews and an in-product feedback survey whose report (5 May) covers Launchpad — that report is a direct input to `06` and was not in the Past Work.

## What was not found

- No public-channel discussion of Quinn's 27 Aug recommendation, its acceptance, or a decision.
- No mention of "AgentDeploy" or "LaunchBot" by name in public channels (the prototype repos are named `agent-launchpad-prototype`).
- No support-ticket thread referencing Launchpad-created resources (`#cs-standup` mentions MARS cases, not Launchpad).
- No engineering thread acknowledging the September RAG create-page break or the rising Terraform failure rate.
- No Gradient-side discussion of Launchpad as a consumer of agent/KB APIs.

## Corrections this forces in other files

| File | Entry | Change |
|---|---|---|
| `02` | D26 (MARS) | Unknown → **Evidenced**: MARS is a coding-agent runtime; Quinn's redundancy argument is about *surface*, not capability |
| `02` | D23 (two contradictory tracks) | Strengthened: Scott Miller and Quinn were prototyping an agent-first Launchpad in August while the retrospective was being written; the tracks were run by the same people |
| `02` | A5 (premium placement) | Strengthened as Unverified/contradicted: customers called the placement "an ad"; the dashboard section appears to have changed 5 Aug |
| `02` | A3 (Day-2 caused churn) | Weakened further: the company's own May–June interviews found *post-deploy drop-off in the first minutes* as "the most critical finding" |
| `03` | 3.a, 5.a, 3.d | See table at top |
| `03` | 1.a | Partially filled by Israel's and Uma's interviews; still need the same-day-deleter cohort at scale |
| `05` | Cause 5 | Add: 5 Aug dashboard change as the leading candidate for the August cliff |
| `07` | Tier 1 | Add Growth/Console onboarding team; recast MARS |
| `08` | §2 MARS fork | Resolved: Launchpad is a capability MARS-hosted agents call, not a thing that creates into MARS |
| `06` | Interview plan | Add Israel, Uma, David to the "already interviewed — do not re-recruit; re-read transcripts first" list; pull the 5 May in-product feedback report before writing the guide |

## Reference list

| Date | Channel | Author | Subject |
|---|---|---|---|
| 2026-04-27 | #donext-landing-page | Gabriel Serrao Mazzei | "get started" links broken pre-launch |
| 2026-04-30 | #announcements | Dhruv Kela | "Introducing DigitalOcean Launchpad" |
| 2026-05-01 | #iam-prs | Julian Miller | Fixing Launchpad smoke tests |
| 2026-05-05 | #customer-insights | Kathryn Bartel | In-product feedback survey report (covers Launchpad) |
| 2026-05-05 | #customer-insights | Cicily Wu | Nav-redesign interviews — home page as "ad" |
| 2026-05-08 | #customer-insights | Eunhae Lee | David (Club Calima) — maintenance > setup |
| 2026-05-11 | #customer-insights | Eunhae Lee | Israel (Josie) — post-deploy drop-off |
| 2026-05-13 | #proj-navbar-redesign | Gabriel Serrao Mazzei / Cicily Wu | Launchpad nav placement |
| 2026-05-13–15 | #launchpad | Quinn Eckart / Scott Miller | MARS/Agent Hub naming; channel archived |
| 2026-06-03/09 | #customer-insights | Quinn Eckart | Uma Mahesh Nandi — RAG Launchpad usability |
| 2026-07-11/24 | #rfc | Adil Hafeez / Hugo Corbucci | RFC: MARS — Managed Agent Runtime Stack |
| 2026-07-14 | #mars-deploy-v2-execution | Josh Bailey | "Managed Agents" product category |
| 2026-08-05 | #ghe-enterprise-log | — | `scottmiller/agent-launchpad-prototype` created |
| 2026-08-05 | #ui-eng-alerts | bot | Dashboard Launchpad section e2e failing |
| 2026-08-18 | #ghe-enterprise-log | — | `qeckart/agent-launchpad-prototype` created |
| 2026-08-20 | #digital-experience | Kate Erickson | Launchpad icon request for Docs |
| 2026-08-27 | #marketplace-alerts | bot | RAG pricing e2e failing |
| 2026-08-29 | #project-product-stack-explorer | Aaron Mitchell | "are we replacing launchpad with this?" |
| 2026-09-01 | #marketing-and-comms-public | Grace Morgan | MARS Public Preview GTM, launch 9/10 |
| 2026-09-04–09 | #project-product-stack-explorer | Haley Eidem / Aaron Mitchell | "Launchpad wasn't used" — four hypotheses; experiment design |
| 2026-09-09 | #ui-eng-alerts | bot | RAG create page model-terms checkbox missing |
| 2026-09-11 | #sol-mars-open-harness | Syed Hashmi | MARS first-party in OpenAI Agents API |
