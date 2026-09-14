# 08 — Grand Vision: Inputs and Draft

This is a Recombine-step draft written before Audit and before the interviews. It is here because Vik asked for a grand vision now; it is labelled so that nothing in it is mistaken for a finding. Section 1 lists the building blocks a vision could rest on and marks each as **Verified**, **Directional**, or **Assumed**. Section 2 is the draft vision, built only from Verified and Directional blocks. Section 3 lists what would have to become true for the Assumed blocks to be admitted.

Component anchors refer to `01_Decomposition.md`; F-numbers to `04_Data_Findings.md`; letter-numbers to `02_Assumed_Facts.md`.

---

## 1. Building blocks

### Verified (data or direct record)

| # | Block | Source |
|---|---|---|
| V1 | Several hundred small, technically advanced teams per quarter will click "deploy a multi-resource AI architecture" on DigitalOcean with near-zero promotion. | F1 — 467 stacks / 4.5 months |
| V2 | The ones who keep it are small businesses already running production on DigitalOcean (Advanced/Emerging SMB, $100–10k LTV, App Platform users). Not enterprise. Not $0 accounts. | F5, F6; Vik's boundary |
| V3 | Almost nobody changes what was deployed. The product's value ended at the moment of creation. | F3 — 93% never redeployed |
| V4 | Static templates rot within months without an owner. | F4 — 9% → 71% failure |
| V5 | The first hour loses 41% of successful deployments. | F3 |
| V6 | The same job recurs for a minority — 21 teams deployed 4–36 times. | F2 |
| V7 | DigitalOcean already owns every resource in the architecture — App Platform, Gradient agents/KBs, Managed DB, Droplets, LBs — and already has ~21k SMB accounts with live apps who are the ICP. | Stack resources; `06` §2 |
| V8 | The recurring hard problems are stable across three product generations: repo interpretation, architecture choice, provisioning + state, Day-2 operations, cost visibility, export/ownership. | Past Work 04 §6–7 |
| V9 | The product is live today, unowned, and failing. | F4 (Sep), 5.a unknown |

### Directional (consistent data + qualitative, small n)

| # | Block | Source |
|---|---|---|
| D1 | The Efficiency Architect archetype (agency / technical founder, wants managed services, asks about Day 2) is the customer who stays. | B10 — interview ranking matches F6 on n=9 apps |
| D2 | For this customer "trusted" means: who patches it, what does it cost, can I swap a component, can I take the definition with me. | Interviews; §4.5, 4.3, 4.9 |
| D3 | Demand for Terraform is a lifecycle stage, not a persona — wanted at scale, avoided at prototype. | B15 — n=2 |
| D4 | Users who bypass the console (agent + API token) exist and will not be served by any console product. | Interviews (Wiplash, Josie); C18; Slack `09` — Israel wants "a DigitalOcean Claude skill," Adam runs agents on a local Mac Mini |
| D5 | Customers look for a product or use case, not "an architecture." | B14 — asserted, plausible; Slack `09` — Uma found the RAG kit via Google search for "cloud-based RAG models"; Growth team sourcing stacks from `/solutions` |
| D6 | The first hour is where most users are lost, and the mechanism is credentials/next-steps not surfaced, empty knowledge base, and cost that does not match the docs. | F3; Slack `09` — Israel and Uma interviews, "Post-Deploy Drop-off… the most critical finding" |

### Assumed (in the record, untested)

| # | Block | Why it is not yet admitted |
|---|---|---|
| A1 | Repo analysis + dynamic recommendation is the right successor to templates. | E29 — trades a confirmed maintenance burden for an unknown accuracy burden |
| A2 | Coding agents cannot close the deployment loop on their own. | C18 — untested; one interviewee contradicts it |
| A3 | Terraform must be the execution/state layer and this is a one-way door. | E27 — asserted five times, analysed zero |
| A4 | The Day-2 gap is why users left. | A3 — data says most left before Day 2 |
| A5 | MARS does / does not already solve part of this. | D26 — MARS undescribed |
| A6 | Renaming to LaunchBot/AgentDeploy changes retention. | 05_Synthesis assumption 1 — no evidence |
| A7 | "Vibe coders" should be excluded. | B13 — a positioning instruction, not a finding; 49% of matched users are Hobbyists |

---

## 2. Draft vision (hypothesis — built from V and D blocks only)

### The gap Launchpad exists to close

A small team on DigitalOcean can ship a web app in an afternoon. The same team, asked to ship an AI feature — agent, knowledge base, vector store, workers, GPU inference — faces six resources, four consoles, a Terraform module they did not write, and no one to ask "is this production-ready." They either spend a week, hire someone, or leave it as a prototype on someone else's platform. (V1, V7, D1)

### What Launchpad becomes

**Launchpad is the way a DigitalOcean customer turns a working application into an operated production architecture — and keeps it that way.** Not a template gallery; not a one-time provisioner. Three commitments:

1. **You understand what you got.** Every deployment is explained in the customer's terms — what each resource is for, what it costs per month, what talks to what — and demonstrated working with the customer's own content before they are asked to keep it. Addresses V5; requires Gradient (KB content at deploy) and Billing (whole-stack cost as one number). (`07` #1, #10)

2. **It stays working without you.** Launchpad owns the architecture after creation: it knows when a component is out of date, tells the customer what will change, applies it on approval, and can roll it back. The definition is always exportable — the customer can leave with the Terraform. Addresses V3, V4, D2, D3. Requires App Platform (redeploy loop), Managed DB / Droplets (upgrade hooks), Terraform provider (state + export), and a boundary ruling on MARS. (`07` #2, #3, #6, #9)

3. **Every surface, same architecture.** The same architecture object is reachable from the console, from `doctl`, from the Terraform provider, and from a coding agent through the MCP server. A Soloist's agent and an Architect's console click produce the same thing and can operate the same thing. Addresses D4, D5 (entry from a product or use case, not "an architecture"), V6 (repeaters get replication as a first-class action). Requires API/MCP and Console. (`07` #4, #8)

### Who it is for

Small teams already in production on DigitalOcean — the ~21k App-Platform-active SMB accounts and the ~240k SMB accounts behind them — at the moment they add an AI-shaped component. Not enterprise. Not the $0 account (they may arrive; the product is not tuned for them). (V2, D1, Vik's boundary)

### How it connects to the rest of DigitalOcean

- **App Platform** is the runtime for the application tier and owns the code→deploy loop; Launchpad composes it, never replaces it, and the boundary is: App Platform owns *an app*, Launchpad owns *an architecture*. (V7)
- **Gradient** is the AI tier; Launchpad is Gradient's on-ramp for customers who need infrastructure around an agent. (V7, `07` #1)
- **Marketplace** is where customers look for "a thing to deploy"; Launchpad architectures are discoverable there as use cases, and Marketplace's image-maintenance process is reused for Launchpad's components. (D5, V4)
- **MARS** — resolved by Slack (`09`): MARS is the hosted runtime for coding agents, not an infrastructure control plane. So Launchpad does not create *into* MARS; a MARS-hosted agent *calls* Launchpad (via MCP/API) to provision and operate the infrastructure its code needs. Commitment 2 is Launchpad's to build; commitment 3 is what makes it reachable from MARS. This also reconciles Quinn's recommendation with the vision: the surface moves to the agent, the capability stays. (A5 → admitted)
- **API / MCP / CLI / Terraform** are how commitment 3 exists at all; they are also the surfaces where the agent-native customer lives. (D4)

### What it is not

- Not a template gallery — templates are one way to *start*, never the product. (V4)
- Not a replacement for App Platform, Gradient, or Marketplace. (V7)
- Not for enterprise. (V2)
- Not "AgentDeploy" as a rename — the name is not what failed. (A6)

### How we would know it is working (12 months)

Drawn from the metric framework the original team defined and never reported (§5.1.8), with thresholds set against today's numbers:

| Metric | Today (F3/F4) | Target |
|---|---|---|
| Provisioning success | 83% (71% in Sep) | ≥ 98%, alerting on regression |
| Survives 24 h | 59% of completed | ≥ 85% |
| Survives 30 d | ~30% | ≥ 60% |
| Changed after day 1 (redeploy, upgrade, swap, scale) | 7% | ≥ 40% |
| Exportable definition downloaded | n/a | tracked |
| Penetration of App-Platform-active SMB accounts | <0.1% | 2–3% |
| Recurring architectures per team (repeaters) | 6% of teams | tracked; replication is a first-class action |

---

## 3. What would have to become true to admit the Assumed blocks

| Block | Test | Where |
|---|---|---|
| A1 repo analysis | Prototype fidelity check (5.f) + accuracy on 20 messy private repos | Launchpad eng |
| A2 agents can't close the loop | Half-day MCP bench test (1.c) | Vik's team, this month |
| A3 Terraform one-way door | Two-page reversibility memo vs App Platform spec / Pulumi / custom (10.b) | Vik |
| A4 Day-2 is why they left | Cohort A interviews (`06`) | Next week |
| A5 MARS | Resolved via Slack (`09`): coding-agent runtime, not a control plane | Done |
| A6 rename changes retention | Not testable without shipping; drop from the argument | — |
| A7 exclude vibe coders | Cohort A segment mix + interviews; decide as positioning, not as fact | After interviews |

---

## Sequence

1. This week: 5.a (is it alive), 3.a (what is MARS), 3.d (what happened in August), 1.c (MCP bench) — four conversations and one afternoon.
2. Next week: interviews (`06`).
3. Week after: fp-audit on `01`+`02` with interview results; revise this draft into a vision with only Verified/Directional blocks and a named boundary with MARS and App Platform.
4. Then: fp-recombine → options; fp-experiment → the cheapest test of commitment 1 (first-hour comprehension + demo with own content) on the live product, because it is live, and because V5 is the largest leak.
