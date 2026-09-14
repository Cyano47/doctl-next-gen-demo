# 05 — Why Launchpad Is Not Working Today

A causal account, built from the warehouse (`04`) and the record (`Past Work/`), of why the shipped Launchpad does not close the code-to-trusted-production gap — and how each cause connects to the adjacent DigitalOcean surfaces. This file makes judgments; each is labelled with what it rests on. Component anchors refer to `01_Decomposition.md`.

The retrospective gave six reasons. The data supports two of them directly, reframes two, and adds two the retrospective did not see.

---

## The funnel, as the data shows it

For every 100 external RAG-kit deployments after launch (F3, F4):

```
100  started a deployment
 83  provisioning completed                     (17 failed — rising to 71% by Sep)
 49  still had the app 24 hours later           (41% of completed deleted same day)
 13  still have it today                        (15% of completed)
  6  ever pushed a change to it                 (7% of completed)
  1  still has it AND has changed it            (1.5% of completed)
 <1  put a custom domain on it
```

Three distinct drop-offs, three distinct causes. The retrospective's diagnosis addresses only the third.

## Cause 1 — Provisioning is breaking, and nobody is maintaining it `[1.3, 1.5, 8.4]`

**Evidence:** failure rate 9% (May) → 14% (Jun) → 22% (Jul) → 71% (Sep, 10 of 14). Data, F4. The NFR was "deploy successfully with zero manual edits." The retrospective named "high maintenance burden, no dedicated team" as a cause; the curve is that cause in numbers.

**Mechanism:** the templates pin versions of Gradient agent/KB APIs, App Platform spec, OSS images, and Terraform provider resources. Each of those moves; the template does not. Every Marketplace blueprint has the same disease — which is why Quinn's con "static blueprint maintenance does not scale" is a statement about Marketplace as much as about Launchpad.

**Connection:**
- **Gradient** — the RAG kit provisions a `genai_agent` and a `knowledge_base`. If Gradient's API or defaults changed over the summer, that is the most likely source of the July/September failures. Unverified; one question to Gradient eng.
- **Marketplace** — owns the ELK and Airflow blueprints Launchpad reuses and has a vendor-portal process for keeping images current. Launchpad has no equivalent process.
- **Terraform provider** (Vik) — the execution layer; provider version drift is a candidate cause.

**Status today:** the product is live, promoted or not, failing seven times in ten, with no owner. Whatever the strategic decision, this is a customer-trust problem *now*.

## Cause 2 — The first hour does not convince `[1.9, 4.8, 4.3]`

**Evidence:** 41% of successfully provisioned apps deleted within 24 hours; median life 2 days. Data, F3. Same-day deletion is roughly flat across segments — it is not a hobbyist tourist effect.

**Mechanism (inferred — this is exactly what the interviews must test):** the user gets a provisioned architecture they did not design (Quinn's "abstraction mismatch"), an app whose behaviour depends on documents they have not loaded yet, and a monthly cost estimate for six resources (droplets, LB, DB, app, agent, KB) that is real money for an account with a median lifetime spend of $46. The likeliest first-hour experience is: "It deployed. I don't understand what I have. It costs $X/month. Delete." No document in the record describes what the deployed RAG app shows a user in its first five minutes.

**Connection:**
- **App Platform** already has a first-run experience for a single app; Launchpad's multi-resource first-run has none on record.
- **Gradient** — the agent needs a knowledge base with content before it is useful. If the kit deploys an empty KB, the demo moment is empty too.
- **Billing / cost** — the MVP scoped "transparency, not control." For a $46-lifetime customer, an unexpected multi-resource bill is not a Day-2 problem; it is a Day-0 reason to delete.

**Reframe of the retrospective:** "customers felt confused after deploying infrastructure they did not understand" is right. But the fix the retrospective implies — more Day-2 tooling — does not touch this cohort. They needed *comprehension and a working demo* in the first hour, not a control plane in the first month.

**Slack (`09`):** the mechanism above is no longer only inferred. Israel (Josie), 11 May, ELK kit: "I launched it, it was very simple... but then I had to go and read some additional documentation to actually find out the password" — abandoned for Betterstack; on the RAG kit, "didn't test it because he had no data to seed it with." Uma, 3 Jun, RAG kit: "Documentation cited a $12 price point, but actual costs became variable and difficult to predict once knowledge base indexing began." The interviewer's own headline: "Core Problem: Post-Deploy Drop-off. The most critical finding."

## Cause 3 — There is nothing to come back for `[1.10, 8.2, 1.6]`

**Evidence:** 93% never redeployed; of the 41 apps still alive, 37 untouched since creation. Data, F3. The retrospective's "low repeat value" and "limited scope: stopped at provisioning" — supported.

**Mechanism:** the post-deploy path is "fork our template repo, point App Platform at your fork." That is a *developer* workflow with no product surface behind it. There is no place in Launchpad to see, change, upgrade, or reason about the deployment after the moment of creation. The 37 idle survivors are the purest evidence: they kept it and did nothing, because there was nothing to do *in Launchpad*.

**Connection:**
- **App Platform** owns the redeploy loop (git push → build → deploy). Launchpad hands the app over and vanishes; the user experiences it as "an App Platform app with extra resources I did not ask for."
- **MARS** — Quinn names it as an "infrastructure abstraction." **Slack (`09`) resolves this:** MARS is Managed Agent Runtime Services — a hosted runtime for coding agents (Claude Code, Codex, Cursor, OpenCode), Public Preview 10 Sep. It is not a Day-2 control plane for infrastructure and cannot fill this gap. What it can do is host the agent that *operates* a Launchpad architecture through the API/MCP — which moves the Day-2 surface to the agent, and still requires the capability underneath.
- **Terraform provider / export** — the "eject hatch" the research called for. Absent; a user cannot even get the definition of what was created.

## Cause 4 — Built for one customer, used by another `[5.1.6, 6.1, 4.10]`

**Evidence:** target user per the proposal: low–medium infra expertise, "Pre-ANE/DNE." Actual users: 89% `technically_advanced`, 4× over-index on Advanced SMB and cloud-adoption-advanced, retention 4–7× higher in that group. Data, F5/F6.

**Mechanism:** the NFRs (no spend caps, no compliance, no eject, no Day 2) fit a curious beginner. The people who stayed are small teams already running production, adding an AI component — they wanted the Day-2 answers, the cost controls, and the definition file the MVP explicitly scoped out. The product under-served the people who liked it most and over-served people who left within a day.

**Connection:** this is the same segment App Platform already serves well (~21k SMB accounts with live apps). Launchpad is not finding a new customer for DigitalOcean; it is offering an existing customer a second, harder architecture. That is a strength — the distribution exists — if the product hands them back to the surfaces they already trust (App Platform, Managed DB, Gradient console) rather than into a dead end.

## Cause 5 — Nobody could find it, and in August something stopped `[6.3, 8.5, 3.2.1]`

**Evidence:** total penetration under 0.1% of even the best-fit segment (`06` §2). Monthly volume flat May–July (~100–170), then −70% in August, −50% again in September. Data, F1.

**Mechanism:** unknown. The retrospective says placement was "premium" and that customers "search for a product, not an architecture" — both, in the same document. The August cliff is either a placement change, a marketing stop, the failure rate (users tell each other it's broken), or the internal decision leaking into promotion. **Nobody has asked the Console team (3.d).**

**Slack (`09`):** leading candidate is a placement change. From 5 Aug the `ui-starter-kit` e2e suite fails on "Dashboard Launchpad starter kits shows three starter kit cards in the Dashboard Launchpad section… never did." Separately, three customers interviewed in May called the home-page Launchpad/AI area "an ad" and "irrelevant… takes up prime screen space." The Growth team's own words on 4–9 Sep: "the launchpad did not have meaningful use" and "We know Launchpad wasn't used, but is that because the stacks didn't meet user needs, because users don't want to launch products that way (all at once in the UI), because the product creation flow didn't work well (we know this is at least partially true), or something else?"

**Connection:**
- **Console / growth** — owns placement and would know what changed.
- **Marketplace** — is *how* customers on DigitalOcean look for "a thing to deploy." Launchpad lived beside it, not in it.
- **MCP / coding agents** — the users who bypass the console (Soloists) never saw Launchpad at all and never will; for them the "entry point" is whatever their agent can call.

## Cause 6 — Two products, one problem, no boundary decision `[7.4, 9.4]`

**Evidence:** every PRFAQ carries a paragraph on why this is not App Platform; the retrospective lists overlap with AgentDeploy, App Platform, Marketplace, and MARS as a con; the boundary is unresolved in every document. Record, 02 §6 and 03 §2.

**Mechanism:** Launchpad provisions App Platform apps, Gradient agents, Marketplace-derived droplets, and managed DBs, then leaves. Each of those has an owner with a roadmap. None of them owns "the architecture." So when it breaks (Cause 1), no one is paged; when the user wants Day 2 (Cause 3), no team's backlog contains it; when a PM asks "is this redundant with MARS," no one can answer because no one has defined MARS in relation to it.

**Connection:** this is the dependency map in `07_Team_Dependencies.md`. It is the cause that makes the other five persistent.

---

## What the retrospective got right, wrong, and missed

| Retrospective reason | Data verdict | Note |
|---|---|---|
| High maintenance burden | **Confirmed** (F4) | Strongest single finding |
| Limited scope — stopped at provisioning | **Confirmed** (F3: 93% never redeployed) | But explains the third drop-off only |
| Low repeat value | **Confirmed** (F2/F3) | 80% one-and-done; 21 repeaters are the exception worth studying |
| Weak differentiation vs Cursor/Claude Code/App Platform | **Unverified** | No user on record compared them; C18 untested |
| Low flexibility — static templates | **Unverified** | 21 teams used them 4–36 times |
| Limited discovery | **Half-confirmed** | Penetration <0.1%; but same doc says placement was premium |
| — | **Missed:** first-hour deletion (41%) | Not a Day-2 problem |
| — | **Missed:** target-user mismatch (built for beginners, kept by SMBs) | Visible only with segmentation data |
| — | **Missed:** "<100 deployments" undercounts by ~4–5× | Changes the demand argument |

## What this means for "Launchpad is important"

The data does not say the problem is small. 467 teams tried to deploy a multi-resource AI architecture through a console in four months with almost no promotion, and the best-fit segment kept it at 56%. It says the *product* lost most of them in the first hour, most of the rest in the first month, and is now failing at provisioning for lack of an owner. Those are three fixable things with three different owners — which is what `07` is about.
