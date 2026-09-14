# 13 — Outsider Read: the problem and the vision, from first principles

Written 14 Sep 2026 by a PM arriving from hyperscaler infrastructure platforms (AWS/GCP), after reading `00`–`12` and `../Past Work/`. This file does not evaluate Launchpad and does not propose a solution. It asks what is *true* about the problem underneath it — who has it, when, what they do about it today, and what any vision has to respect. Folder evidence is cited by file and F-number; patterns from outside DigitalOcean are labelled **[outside pattern]** and are priors, not findings.

Rule followed: `12` is left alone. Where this file disagrees with the direction of `01`–`12`, it says so and stops there.

---

## 1. Foundational truths of infrastructure management

These are the things I would bet on regardless of vendor, and which the folder's own evidence either confirms or does not contradict. Everything in §2–§5 is derived from them.

**T1. Nobody wants infrastructure. Infrastructure is a liability carried on behalf of an application.**
Every resource created must be paid for, patched, secured, and eventually deleted. The user's unit of value is the application, or more precisely the outcome the application produces for *their* users. The folder's sharpest fact says this in numbers: an ordinary App Platform app gets a custom domain 50% of the time and is redeployed 70% of the time; a Launchpad app 0.8% and 7% (`11` V-f). One is somebody's application. The other is somebody's resources.

**T2. Creation happens once. Operation happens forever.**
Day 0/1 is exciting, well-served by every vendor, and roughly 1% of the lifetime effort. Day 2 is boring, badly served, and where all the cost and all the trust live. **[outside pattern]** Every "easy start" product without an operating story becomes a trap: Elastic Beanstalk (customers graduate away and resent it), Amplify gen 1 (rebuilt on CDK to make the abstraction see-through), first-generation Quick Starts (rotted templates). The folder confirms the principle from the failure side: value front-loaded, nothing to return for (`05` Cause 3), and from the customer's mouth — David: "the primary value isn't the start, it's the ongoing curation" (`09`).

**T3. An abstraction over infrastructure fails in exactly one of two ways: too opaque to fix, or too leaky to be worth it.**
The ones that survive have a see-through or eject path (Amplify → CDK, App Platform → spec YAML, Heroku → 12-factor portability). Quinn's "abstraction mismatch" (`02` A3) and the interviewees' "who patches this" are the opaque failure. Launchpad's Terraform state exists but was never exposed, exported, or used after apply (`11` entry 16) — an abstraction with no see-through.

**T4. The actor performing the work determines the surface. The actor is becoming an agent.**
If a human clicks, the surface is a console. If an agent acts, the surface must be machine-legible: API, CLI, IaC, MCP — with plan/preview, idempotency, structured errors, and scoped credentials. The console is not merely less important to the agent-directed user; it is invisible. The folder has this on record three times: Wiplash hands an agent a token; Israel wants "a DigitalOcean Claude skill"; Adam runs Claude Code on a Mac Mini (`09`). **[outside pattern]** Hyperscalers are shipping first-party MCP servers and agent-in-console operations assistants in 2025–26; this is the mainstream, not an edge case.

**T5. Trust in infrastructure is predictability on five questions.**
What happens when (a) traffic grows, (b) something breaks, (c) the bill arrives, (d) I need to change it, (e) I want to leave. "Production" means I can answer all five before they happen. Every interview anxiety in `Past Work/01` §3 maps to one of the five. Nothing in three product generations answered more than (a) partially.

**T6. Every static composition of N moving parts decays at a rate proportional to N.**
Templates, blueprints, starter kits, reference architectures — all rot. **[outside pattern]** AWS staffed a team and a CI pipeline behind the Solutions Library and they still rot; the ones that hold up are vendor-maintained because the vendor is paid to. The folder's cleanest curve is this law in action: 9% → 22% failure, May → July (`11` F4). This is not a Launchpad defect. It is a property of the artifact class.

**T7. Expertise is per-component, not per-person.**
The "technically advanced" Advanced-SMB founder who has run web apps for years is a novice at vector stores. 89% of Launchpad users were flagged `technically_advanced` (`04` F5) and still behaved like beginners with the RAG stack. Segmenting by skill level is the wrong axis. Segment by *distance from the component being added*.

**T8. At DigitalOcean the customer is small, so cost surprise is fatal, not irritating.**
Median lifetime spend of Launchpad users: ≈ $46 (`04` F5). **[outside pattern]** At AWS the $0–$100/month cohort is a marketing expense and the bill-shock stories are reputational noise. At DigitalOcean that cohort *is* the business and price simplicity *is* the brand. Uma's "documented $12, actual variable once indexing began" (`09`) is not a docs bug; it is a violation of the company's core promise to its core customer.

**T9. People search for a problem or a product, never for an architecture.**
"Cloud-based RAG" is what Uma typed into Google (`09`). "Architecture" is an internal taxonomy word. Quinn observed this (`Past Work/04` §4) and the folder marks it Unverified (`02` B14) — from an infra-platform seat I would treat it as a law. Discovery surfaces built around the shape of the solution fail; ones built around the customer's use case or the product they already know work.

**T10. What a platform can offer that neither a template nor an agent can is accountability over time.**
A template is a snapshot. An agent is a session. A platform holds state, watches resources, bills as one, and can be *responsible* for something after the user walks away. This is the only native reason for a cloud provider to be in this space at all — the answer to "why should the customer give this the time of day instead of pointing Claude Code at the API?" If a product does not exercise this advantage, it is a digitised Yellow Pages: a button over primitives the agent can already call.

---

## 2. The struggling moment

The folder frames the problem as a gap between "code works" and "trusted production." From the customer's side, the moment is narrower and more concrete:

> *I have something running. I need to add a component I have never run before — an agent, a knowledge base, a vector store, a queue, GPU inference. I know how to ship my app. I do not know the reference shape for this thing, what size it needs, what it will cost, or who will look after it. My choices are: learn it (a week), hire it (money I don't have), buy it as a SaaS (another vendor, another bill, my data leaves), or leave it as a prototype somewhere else.*

Three things about this moment matter for problem definition:

1. **It is per-component, recurring, and hits experienced people.** (T7.) The Efficiency Architect is not a persona; it is anyone at the moment of adding their first unfamiliar component. The same person is a Scaler on the components they know.

2. **The default alternative is not Vercel. It is the SaaS version of the component.** Israel left the ELK kit for Betterstack (`09`). David buys Vanta for compliance (`09`). For a knowledge base the alternative is Pinecone or OpenAI's hosted retrieval; for a queue it is a hosted broker. The customer's workaround for Day 2 is to *make someone else own it*. That is T2 and T10 in one move — and DigitalOcean's own managed products (Gradient KB, Managed DB) *are* that move. The competitive set in `Past Work/02` (starter-kit vendors → app builders → coding agents) never names the managed-component SaaS vendors, which is where the churned Launchpad user actually went.

3. **Business problem and customer problem align only after Day 1.** DigitalOcean's business problem is attach, expansion, and retention of SMB spend. The customer's problem is "I can't confidently run the new thing." They coincide only if the new thing *stays running*. A create-only product serves the business metric while solving no customer problem — and Growth's Stack Explorer primary metric is "resource deployment count" (`09`), which rewards creating liabilities (T1). This is the customer-hostile trap the problem-definition discipline warns about.

---

## 3. Cohorts, from the journey rather than from the interviews

The archetypes in `Past Work/01` were cut by skill and AI-maturity. The warehouse segments in `04` are billing tiers. Neither is a journey. Below, cohorts are cut by **what the person is trying to do at the moment they touch infrastructure** and **who performs the work**. Each is matched to where it shows up in the folder's evidence and to the outside pattern that usually serves it.

| # | Cohort | The moment | Who does the work | Where it appears in the record |
|---|---|---|---|---|
| C1 | **Evaluator / Tourist** | "Does this exist? What would it look like? What does it cost?" Not yet committed to anything. | Human, hands-on, ≤1 hour | 62 of 266 RAG apps deleted within an hour of a *working* deploy (`11` V-b). Uma's Google search. The three nav-redesign interviewees who scrolled past the tile. |
| C2 | **Shipper adding an unfamiliar component** | Has an app for real users; needs to bolt on a component they have never run. | Human directing tools; increasingly a coding agent under supervision | The Advanced/Emerging SMB survivors (`04` F6); Israel ("integrate it with my application"); the folder's ICP hypothesis (`06`). |
| C3 | **Operator / Maintainer** | Has things running. Wants to know: is it patched, is it secure, is it about to cost more, is it about to fall over. | Human, reluctantly; wants it done for them | David ("automated maintenance > initial setup"); Israel's unprompted "your system should ping me… time for a security review"; Cursor.io ("who upgrades the droplets"); 37 idle surviving apps nobody has touched (`04` F3). |
| C4 | **Replicator** | Same shape, N clients or N environments. Needs parity, handover, separated billing. | Human with their own artifacts (YAML, compose files, Terraform) | Josie and Scrydex ("creating & replicating own templates"); 8 external teams with 4+ deploys, several retrying failures (`11` V-e). Small. |
| C5 | **Agent-directed builder** | Cannot write infrastructure; an AI tool is the lead engineer. Needs guardrails more than features. | Human prompting, agent executing | Vambrace ("I wouldn't be here without AI"); the "AI-Enabled Builder"; the 43% brand-new accounts (`04` F5). |
| C6 | **The agent as actor** | Not a person. A coding agent (locally, or hosted in MARS) that needs to provision and operate on a human's behalf. | Agent, autonomously or semi-autonomously | Wiplash; MARS (Public Preview 10 Sep, `09`); AgentDeploy's premise; Vik's MCP surface. |

Notes on the cut:

- **C1 is the largest cohort in the data and has no product designed for it.** GCP's Jump Start Solutions **[outside pattern]** made the opposite decision: one-click Terraform deploy into a fresh project, architecture diagram and cost shown, explicitly positioned as *deploy, explore, delete*. Retention was never the metric; downstream resource usage was. Launchpad measured C1 against a retention bar built for C2 and called it churn. Whether C1 is a leak or a funnel (`11` entry 4) is a decision about which cohort the product is for, not a fact to find.
- **C2 and C3 are the same person a month apart.** (T2.) The folder's three drop-offs (`05`) are C1 leaving, C2 not converting, and C3 having nothing to operate with.
- **C5 and C6 share a surface and differ in who holds responsibility.** In C5 the human still reads the plan; in C6 nobody does. The infrastructure need is identical: a machine-legible surface with preview, idempotency, cost-before-apply, structured failure, and scoped credentials (T4). The difference is who the platform is accountable to (T10).
- **Billing segments are not cohorts.** Hobbyist/SMB/Enterprise tells you what someone pays, not what they are trying to do. The 4× Advanced-SMB over-index (`04` F5) most plausibly means "people with an app already" — i.e. C2 — which the segment name obscures.

---

## 4. How each cohort manages today, what breaks, what they do about it

| Cohort | Today's method | Where it breaks | The workaround (the real competitor) |
|---|---|---|---|
| C1 Evaluator | Reads docs, YouTube, asks ChatGPT; clicks a one-click thing; deploys on a free tier elsewhere | Can't see it working *with their own content* fast enough; can't get a price they believe; jargon | Someone else's hosted demo; a SaaS free tier; giving up |
| C2 Shipper | Googles "how to deploy X"; copies a docker-compose; asks a coding agent; reads a reference architecture from a hyperscaler | Doesn't know the reference shape; sizing is a guess (the 1 GB RAM worry); wiring (secrets, private networking, TLS) is the long tail; no one to ask "is this production-ready" | **Buys the component as SaaS** (Betterstack, Pinecone, hosted OpenAI) and keeps the app where it is; or hires |
| C3 Operator | Ignores it until it breaks. Dependabot for code, nothing for infrastructure. Manual OS upgrades. Pays a compliance vendor | No signal that anything is stale, exposed, or about to cost more; upgrades are scary because there's no rollback; every month of not touching it raises the cost of touching it | "Personal recipes" (David's Docker Compose) they trust because they wrote them; don't touch it; rebuild instead of upgrade |
| C4 Replicator | Copy-paste App Platform YAML (Scrydex); their own Terraform when the UI gets heavy; compose files | Parity drift between environments; handing ownership to a client; separating billing | Their own templates, maintained by them — which is why generic kits are acceptable only if "strictly up-to-date" (David) |
| C5 Agent-directed | Claude Code / Cursor + `doctl` + an API token | Agent doesn't know DO specifics; hallucinates flags; no preview of what it's about to do or cost; blast radius (it can delete); the human can't evaluate the plan | Trial and error; retry; smaller scope; ask the agent to explain |
| C6 Agent as actor | Raw API via MCP or SDK | No composite operations ("a working retrieval stack" is twelve calls in the right order); no plan/diff; no cost-before-apply; failures are unstructured; credentials are all-or-nothing | Writes its own orchestration each session; abandons Terraform because "it took forever" (Wiplash) |

Two things stand out from an infra-platform seat:

- **Every cohort's workaround is a form of "make someone else own Day 2."** SaaS for C2, personal recipes they already trust for C3/C4, retry-until-it-works for C5/C6. Nobody's workaround is "learn Terraform." The demand is for *ownership transfer*, not for a nicer creation flow. (T2, T10.)
- **The wiring and the watching are the unsolved parts; the creating is solved several times over.** App Platform, Marketplace, Terraform, the API, a coding agent — all create resources adequately. None of them wires a new component into an existing app and none of them watches it afterward. Launchpad's three generations all reinvested in creation (templates → repo analysis) and left wiring and watching to "Phase 2."

---

## 5. What the record's direction assumed that the truths do not support

`11` audited the assumptions internally. This section applies the truths above from outside and marks the conventions that three product generations carried without deriving them.

| Convention carried through Gen 1 → 3 | Truth it collides with | Note |
|---|---|---|
| The unit of value is "an architecture" | T1, T9 | Nobody wants one; nobody searches for one. The unit the customer holds is *their app*; the unit they are adding is *a component*. |
| The product's job is creation; operations are Phase 2 | T2, T10 | Creation is the solved, low-value, once-only part. A provider's only native advantage is the part that was deferred. |
| Templates, then repo analysis, as the successor to templates | T6 | Both are snapshots; both decay. Repo analysis decays faster (the repo keeps changing — the PRFAQ's own "re-analysis after code changes" risk). Neither is continuously verified. |
| Console as the entry point; agent surface as a later phase | T4 | The actor is already an agent for the two cohorts with the highest stated enthusiasm (C5, C6). The console is the surface for C1 only. |
| Skill-level personas (Builder / Architect / Scaler / Soloist) | T7 | Expertise is per component. The same person is in different personas for different components on the same day. |
| Cost as "transparency, not control" | T8 | For a $46-lifetime customer a variable bill is a Day-0 delete reason, not a Day-2 feature request. |
| Retention of what was deployed as the success measure | T1, C1 | Applied to a cohort (C1) whose successful outcome is deletion. Applied to a cohort (C3) whose activity happens in the agent/KB tier where nothing was measured (`11` entry 7). |
| Terraform as the one-way door | T3 | The door matters only if the state is ever exposed, exported, or acted on. It never was. The actual one-way door was never named: *who is accountable after apply.* |
| "Vibe coders are not the target" | T7, C5 | A positioning instruction inherited as a fact (`02` B13). C5 is the cohort growing fastest under T4, and it is the one with the most acute guardrail need. |

None of this says the direction was wrong. It says the direction rested on conventions that the folder's own evidence, read from the infrastructure side, does not derive.

---

## 6. Vision, stated as the customer's world

Following the discipline: describe the user's world in 5–10 years, no product, no company, no technology of today. Then test it.

> **In the future, a small team that can describe what their application needs can have it running for real users the same day — including the parts they have never run before — knowing what it will cost before it costs them, and never being the only one watching it. Adding a component they have not operated before is as routine as adding a dependency. When something they run ages, weakens, or is about to cost more, they hear about it before their users do, and fixing it is a decision, not a project. Whatever tool does the work for them — a console, a command line, or an agent acting on their behalf — sees and touches the same thing. And on any day they can take the complete definition of what they run and leave.**

**Test against the four criteria (`defining-product-vision`):**

- *Lofty* — "never the only one watching it" and "as routine as adding a dependency" are not true anywhere today for infrastructure.
- *Realistic* — every clause is a known capability somewhere (dependency managers, continuous verification, cost-before-apply, revision-based rollback, IaC export); what is missing is their composition for this customer.
- *Devoid of today's tech* — no Terraform, no console, no MCP, no template, no agent runtime named.
- *Grounded in a potent problem* — the moment in §2, evidenced by the churn to Betterstack, the "who patches this" anxiety, the $12-vs-variable bill, and 62 people gone within the hour.

**Can someone make a decision with only this?** A few tests:

- A creation flow that ends at `apply` with no watcher behind it — violates "never the only one watching it." Not this vision.
- A composition that is not continuously verified against its moving parts — violates "hear about it before your users do." Not this vision.
- A surface that a console user can reach but an agent cannot, or vice versa — violates "sees and touches the same thing." Not this vision.
- A cost that is disclosed after the resources exist — violates "before it costs them." Not this vision.
- A definition the customer cannot export in full — violates the last sentence. Not this vision.
- A metric that counts resources created — measures a liability (T1). Not this vision's metric.

**The emotional state** (Ami Vora's test): the feeling is *a junior engineer with a senior on call* — you can add the thing you don't know how to run, because someone competent will notice if you got it wrong.

---

## 7. What this file does not do, and what it hands forward

It does not choose between the three structures in `12`, and it does not re-audit `11`. It does the following:

- Names ten truths (§1) that any structure in `12`, or any later one, can be checked against before it is tested on customers.
- Replaces skill-based personas with six journey cohorts (§3) that the warehouse can partly see and the interviews can partly reach; `06`'s cohort A is C1, cohort B is C3, cohort C is C4, cohort D is C2. The interview guide should ask C1 "what were you checking," not "what went wrong."
- Names the competitor nobody in three generations named: the managed-SaaS version of the component the customer is adding (§4). One question for every interview: *what did you buy instead?*
- States a vision in the customer's terms (§6) with decision tests that anyone in `07`'s sixteen teams could apply without asking.

The one truth I would press hardest, because it is the one the record never states and the one only a platform can act on: **the product is not what gets created; it is who is accountable afterward.** Everything in the folder that failed, failed on the far side of `apply`.
