# 14 — Great Question Sources (CY 2026)

Curated research already sitting in the Great Question workspace that bears on the problem definition in `13` and the interview plan in `06`. Searched 14 Sep 2026 via the read-only MCP connection; timeframe limited to studies and transcripts created in calendar 2026. Titles and summaries are PII-masked in the connection, so everything below is referenced by **study ID** and **transcript ID** — open them directly in Great Question. No customer names or identifiers appear here, consistent with the folder rule.

Two things to know before using this:

1. **Most Launchpad research is not in the Launchpad study.** Study 83103 ("Launchpad (Starter Kits) Customer Feedback Interviews") holds one transcript. The prototype walkthroughs from April 2026 — where PMs showed the Launchpad mock to customers and asked about console vs IDE, cost, and Day 2 — live inside study **80549 "PM Customer Interviews (Ongoing)"**, which has ~100 sessions from March to July. That is the corpus.
2. **Nothing has been synthesised.** Zero insights and two masked highlights mention Launchpad. Section 3 of this file is the first pass at cohort tagging.

---

## 1. Inventory — 2026 studies relevant to this problem

42 studies were created in 2026. The ones that matter, in order of usefulness:

| Study | Title | Status | Sessions w/ transcript | Why it matters |
|---|---|---|---|---|
| **80549** | PM Customer Interviews (Ongoing) | closed | ~90, Mar 27 – Jul 6 | The main corpus. Launchpad prototype shown to ~10 customers in April; RAG/agent-platform usage; coding-agent workflows; SRE/observability prototypes in June. |
| **83103** | Launchpad (Starter Kits) Customer Feedback Interviews | closed | 1 (t123597, 11 May) | The only post-launch churned-user interview on record — the ELK → third-party logging story cited in `09`. |
| **83371** | Deploy Navigation Menu & Landing Page Feedback | closed | 11, May 4 – 27 | Where customers called the home-page Launchpad area "an ad." Cause 5 evidence. |
| **76629** | OpenClaw Churn Survey | closed | 45 survey responses, Feb | **Closest existing analogue to the Launchpad same-day-deleter cohort** — a one-click AI deploy on Droplets that users spun down. See §2. |
| **77232 / 75541** | ANE Needs Definition (EXTERNAL / DO Customers) | closed | ~9, Feb 12 – Mar 17 | Defines "ANE" (the term `03` 2.b says is undefined in the Past Work). AI-native builders' stacks and constraints. |
| **86401** | Understanding Early AI/ML Customer Needs | closed | 1 (t129805, 11 Jun) | Marketplace-led; AI/ML on DO from a K8s user. |
| **74671** | Droplet SRE Prototype Test | closed | 2 (t107590, t108021, Jan) | Cohort C3 — how much autonomy customers give a remediation agent. |
| **82230** | Doctl / CLI Experience | paused | 2 (t121918, t122667) | Terraform + K8s users; asked directly about starter kits vs their own IaC. |
| **74982 / 75029 / 75000** | DO.Next landing page / general pipeline / FinOps + Billing | closed | ~8, Jan – Feb | Cost visibility, forgotten resources, security alerts on the landing page. T8 evidence. |
| **79340 / 81325** | Node Stack Research I / II | closed | ~5, Mar – Apr | Users on Vercel / Railway / Render / Fly / Supabase / Neon — the external alternative set, in their words. |
| **79084 / 79445** | Headless Hosting (Mar) / CW Headless Hosting | paused | ~6, Mar | Agencies: per-client stacks, handover, ongoing maintenance load. Cohort C4. |
| 80649 | Starter Kits Customer Feedback Interviews (Q1 2026) | draft | 0 | Never ran. |
| 84722 / 83797 / 83820 | Cross-Selling AI workloads / PM outreach for agent users / PM Interviews for Managed Agents | closed | 0 found | Sessions likely logged under 80549 instead. Check in the UI. |

Insight documents created in 2026: "Usability and Discoverability" (Jul 17, empty body) and "Fine Tuning Models" (Mar 6, study 77232). Neither covers Launchpad.

---

## 2. The one dataset to read first — OpenClaw Churn Survey (76629)

45 people who spun up the one-click OpenClaw Droplet and then spun it down, surveyed February 2026. It is not Launchpad, but it is the same event: a one-click AI deployment on DigitalOcean, abandoned. Nobody has asked Launchpad's 108 same-day deleters anything; these 45 were asked.

**Why they spun down**

| Reason | n |
|---|---|
| I found a better way to deploy | 18 |
| I couldn't get it working | 15 |
| I was just playing around but didn't need it for longer | 12 |

**What they were trying to do** (44 free-text answers): roughly 30 are variants of *test / explore / try / see the hype / learn in a safe environment*. About 8 name a real use — personal assistant, marketing assistant, bug-fix bots, 24/7 task automation. One wanted to record a YouTube walkthrough.

**Where they went instead**: locally (10), a managed service (6), a blank Ubuntu droplet with the upstream install script (several, in free text).

**Where they turned for help**: OpenClaw docs (12), Claude (11), DO docs (7), ChatGPT (6), DO chat assistant (1).

**Free-text failure reasons worth reading verbatim** (15): the one-click image shipped an older version under a different name so upstream docs and commands did not match; the agent could not install skills or modify files in its own workspace; messaging-channel pairing failed after hours; wanted to use an existing Claude subscription and the droplet only supported an API key; "wanted to avoid being charged while the service was not fully operational."

**What it says for `13`**: this is cohort C1 (Evaluator) with a minority of C5 (agent-directed). Two-thirds were touring or blocked, not churning from a product they needed. "Found a better way" is the SaaS/manual-install workaround from `13` §4. The stale-image complaint is T6 (composition decay) observed by a customer. 25 of 45 said yes to a follow-up interview — a recruitable cohort-A analogue that already consented.

---

## 3. Transcripts by cohort (`13` §3)

All in study 80549 unless marked. Dates are session dates. Descriptions paraphrase what the speaker said; open the transcript for the quote.

### C1 — Evaluator / Tourist

| Transcript | Date | What is in it |
|---|---|---|
| t119118 | 7 Apr | Shown the Launchpad prototype. First question: "is this for prototyping or is it production-grade? I'd have to see that." Cost: "$36 looks good, but plus token usage, which can balloon — what is it really going to be?" Wants a slider/estimate upfront. Already plays with Gradient agents on their own dataset; "haven't done a ton with it." |
| t119178 | 8 Apr | Shown the three kits. Can see a use for observability "for upper-small to midsize orgs"; "drawing a blank" on a use case for the data-workflow kit. Console for small tests, IDE for enterprise scale. |
| t118913 | 6 Apr | Asks what each template actually is; wants example use cases on the card. Proposes a template marketplace / repository where users share their own. |
| t122717, t123673 (83371) | 4 & 11 May | Deploy-nav interviews: the Launchpad section "not helpful for you"; never scrolled to it. |
| Survey 76629 | Feb | See §2. |

### C2 — Shipper adding an unfamiliar component

| Transcript | Date | What is in it |
|---|---|---|
| t119035 | 7 Apr | Has built several RAG systems, always with an external vector SaaS; "RAG would be huge." On managing the deployed kit afterwards: "honestly, not much — infrastructure is at its best when I don't have to think about it." First time wrote every command by hand to understand it; now has Claude Code replicate from a plan. |
| t117525 | 27 Mar | Built RAG with a document DB's vector feature; "it's almost like engineer-as-a-service using an agent." Does not like managing droplets — upgradability and security — and moved a platform off them for that reason. |
| t121777 | 27 Apr | Gradient outage → spent a day migrating agents to a model router to get back online; still thinks Gradient is the best option for vector KBs because the external vector SaaS "is way too complicated." Small KBs go in the prompt; only big ones need a vector store. |
| t130019 | 15 Jun | Runs vector DB + knowledge base + bucket + Python API + PHP apps on DO in production; shown the centralised observability prototype. |
| t128285 | 1 Jun | Live shop with paying customers; "did see Launchpad, reading on it to see if that's the route I want to go"; TypeScript/Node shop that builds its own auth and middleware. |
| t122363 | 30 Apr | Five-dev team on Codex; property-data RAG chatbot via knowledge base; PM cross-references another founder's KB-agent build. |
| t123673 (83371) | 11 May | "Wasn't aware at ground level — did R&D and found we have to use a vector DB." |
| t120596 | 17 Apr | Multi-cloud startup; asks whether the Gradient knowledge base is shared across customers ("the most important thing for a company is data"); chooses DO for quick POCs and AWS for scale. Shown Launchpad; PM redirects to Agent Platform as "even easier." |
| t118095 | 1 Apr | Consultant who deploys to whatever cloud the client mandates; "GPUs in Kubernetes is a challenge, no client will pay for it — most AI we do we just call via API." Hyperscaler support pushed them to the managed inference service instead of helping. |

### C3 — Operator / Maintainer

| Transcript | Date | What is in it |
|---|---|---|
| t122700 | 4 May | Founder who is also "the CISO"; "significant time every month just upgrading all the dependencies or risk getting super hacked." Sees Launchpad as a time-saver for an incubator building several things a year. |
| t123597 (83103) | 11 May | The churned Launchpad user. Wants something "running in the background" that pings with options; today periodically opens Insights to tweak container count vs size for cost. Asks whether more kits are coming; PM admits the observability kit is out of date. |
| t128274 | 1 Jun | Sentry warnings flagged to a developer who fixes via Claude; asked about one-click remediation. |
| t129303 | 8 Jun | Alert → dashboard → run it through an agent for a recommendation. |
| t130340 | 17 Jun | Wants the HubSpot-style loop: app failed → agent pulls logs and RAM charts → diagnoses → opens a PR. "Would cover the nice ninety percent of cases." |
| t107590, t108021 (74671) | 28 & 30 Jan | SRE prototype: "you don't want to give the agent too much control" but for a DB on a small droplet running out of resources, "full autonomy to deal with an issue like this." |
| t109136 (75029) | 5 Feb | Landing page: likes security alerts, projected spend, and most-expensive-resources up top. |
| t109204 (75029) | 5 Feb | Powers off droplets for a month before deleting to keep the IP; sometimes forgets and keeps paying. Parses billing CSV by script. |
| t115825, t116460 (79084) | 17 & 20 Mar | Agency: ongoing maintenance is package upgrades and breaking changes; some clients get handed the codebase, others stay on retainer. |

### C4 — Replicator

| Transcript | Date | What is in it |
|---|---|---|
| t118913 | 6 Apr | "App server + worker + Redis queue is a repeating pattern for me — I'd like to capture that" as a personal template. |
| t115806 (79084) | 17 Mar | "Entire application stack per customer"; same container, different database; all IaC and scripts, developer team controls it. |
| t112698 (75029) | 25 Feb | One DO Team per client as the organising unit. |
| t119035 | 7 Apr | Replicates a working DB setup for different clients by having Claude Code inspect and copy it. |
| t117188, t119475 (79340/81325) | 26 Mar, 10 Apr | Agencies on Vercel/Railway/Fly: why Railway (a migration step before deploy) vs Vercel (during); Fly machines deployed by a hand-written CLI script; Neon chosen for one-week-a-month traffic spikes. |

### C5 — Agent-directed builder

| Transcript | Date | What is in it |
|---|---|---|
| **t117540** | 27 Mar | Tried a competitor's agent that "sets up your SQL database and just runs things" — "we don't feel safe enough about what it's installing; never going with that in production." Trusts DO's managed Postgres because "you take care of the hardcore technology thing we can believe in — not something AI." The clearest statement of T10 (accountability) on record. |
| t120596 | 17 Apr | Cursor in planning mode, then execute; reviews rather than writes. Admin watches the Cursor dashboard. |
| t118578 | 2 Apr | K8s via CLI + GitHub Actions; asks Claude/Cursor to do it "with the set of permissions"; asked whether they connected the DO MCP. |
| t115632 (79445) | 16 Mar | Non-technical interviewer asks how Claude manages servers: "SSH cloud to a server and it starts setting up everything… security updates is not essential." |
| t123686 | 11 May | Wants to "add a Claude Code component so people can get the benefit of DigitalOcean without sending their health records to Anthropic" — vibe coders on DO without developers. |
| t118563 | 2 Apr | Solo founder already in `Past Work/01`; on a one-click production-ready agent template: "it would — but it would feel like App Platform… part of the fun is building it." |
| t119193 | 8 Apr | Claude Code, not Cursor; asked how they operate DO infrastructure. |

### C6 — The agent as actor

| Transcript | Date | What is in it |
|---|---|---|
| t113675 (77232) | 2 Mar | Cloud agents do UI work and record video; Claude Code plan mode → Cursor agent executes the plan. Splits between tools "to get the best back and forth." |
| t121688 | 27 Apr | Heavy `doctl` use for troubleshooting and DB work; has not tried MCP "because the CLI has been very helpful." Builds their own CLIs. |
| t120413 | 16 Apr | K8s at scale; wrote their own load balancer; Claude subscription-vs-API cost reasoning. |
| t117188 (79340) | 26 Mar | Claude Code with spec-driven development alongside the IDE. |

### Cross-cutting — trust and cost (T5, T8)

| Transcript | Date | What is in it |
|---|---|---|
| t119118 | 7 Apr | "$36 plus token usage that can balloon." |
| t122837 | 5 May | "Transparency of cost is very important to me." |
| t123729 | 11 May | "How do I determine the cost per token?" |
| t130959 | 23 Jun | Consistent ~500 tokens/call; deciding whether to move inference from OpenAI to DO. |
| t108369 (75029) | 2 Feb | Paid too much for an outdated managed DB "charged more just to force people to update." |

### Cross-cutting — what they use instead (`13` §4)

t123597 (third-party logging SaaS instead of ELK kit) · t121777 (model router instead of Gradient during outage) · t119035 (external vector SaaS for every prior RAG) · t117540 (managed Postgres, not an agent installer) · t118095 (call AI via API rather than run GPUs) · t116999, t116314, t119475 (Vercel + Supabase/Neon "copy-paste my setup from other projects"; Railway for migration control; Fly for on-demand machines) · t113675, t112306 (77232: on-prem and managed inference for compliance).

---

## 4. Manual search prompts for Great Question

The search box accepts a natural-language query (semantic) and, separately, keyword filters. Set the date filter to **2026-01-01 → today** and, for the first pass, restrict to studies **80549, 83103, 83371, 77232, 86401**. Semantic queries work best phrased the way a customer would say it; end with a question mark for question-style retrieval. Keywords: one or two words, OR synonyms, quotes only for verbatim phrases.

| Goal | Semantic query | Keyword |
|---|---|---|
| C1 — what evaluators were checking | *I just spun it up to see what it looked like and then deleted it* | `deleted OR "played around" OR "tried it"` |
| C1 — cost at first sight | *the estimate looked cheap but I couldn't tell what it would really cost with token usage* | `cost OR pricing OR tokens` |
| C2 — adding a new component | *adding a vector database or knowledge base to my existing application for the first time was hard* | `"knowledge base" OR "vector" OR embeddings OR rag` |
| C2 — SaaS instead of self-host | *I decided to use a managed service instead of running the component myself* | `pinecone OR supabase OR betterstack OR openrouter` |
| C3 — Day 2 burden | *how do you keep your servers patched and who is responsible when something breaks in production?* | `upgrade OR patching OR maintenance` |
| C3 — proactive watching | *I would want the platform to tell me before something needs a security review or should scale up* | `security OR alert OR "scale up"` |
| C4 — replication | *I deploy the same stack for every client and recreate it manually each time* | `clients OR agency OR replicate OR template` |
| C5/C6 — agent as operator | *I gave my AI coding agent an API token and let it provision infrastructure for me* | `"claude code" OR cursor OR codex OR mcp OR doctl` |
| C5 — trust in agent-installed infra | *I don't feel safe about what the agent is installing so I won't use it in production* | `safe OR trust OR "production"` |
| Launchpad direct | *what did you think of the starter kit prototype and would you use it from the console or your IDE?* | `launchpad OR "starter kit"` |
| Discovery (Cause 5) | *I never noticed that section on the home page* | `homepage OR "home page" OR navigation OR "left nav"` |
| Trust bar (T5) | *what would make you trust this enough to run it in production for a paying customer?* | `"production ready" OR production` |

Also useful: **Studies → 76629 → Responses** for the churn survey, and the interview-willing filter (25 said yes) for a cohort-A analogue recruit.

---

## 5. What is missing from Great Question

- No transcript for any of Launchpad's 108 same-day deleters, 41 idle survivors, or 8 repeaters (`06` cohorts A–C). The OpenClaw survey is the analogue, not the thing.
- No sessions found under Cross-Selling AI workloads (84722) or the Managed Agents PM studies (83797, 83820) — check whether they were filed under 80549.
- No Day-2 exit data: nobody who ran a kit for 30+ days and then deleted has been interviewed.
- No synthesis: zero insight documents on Launchpad, deployment, or agents in 2026. The two Launchpad highlights are PII-masked in the connection.
- The April prototype walkthroughs (t117525, t118913, t119035, t119118, t119178, t120596) predate launch by weeks and were never revisited with the same people post-launch. Those six are the cheapest before/after study available: they saw the mock; ask them now what they did.

---

## How this feeds `06`

- Read §2 and the six April prototype transcripts before writing the cohort-A guide.
- Add to the "already interviewed — do not re-recruit" list: every transcript in §3 tagged 83103 or 83371.
- The 25 OpenClaw survey respondents who agreed to a follow-up are a ready cohort for the "what were you checking?" question (`11` entry 4, `13` §3 note on C1).
- t117540 should be quoted in the trust section of every interview brief; it is the customer stating `13` T10 unprompted.
