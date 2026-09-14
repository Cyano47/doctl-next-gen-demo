# First Principles — Launchpad Initiative

This folder is the output of running the **Decompose** step (D of D.A.R.E.: Decompose → Audit → Recombine → Experiment) over the five files in `../Past Work/`, plus two supporting registers the decomposition surfaced.

## Frame

The Past Work states the problem as a Launchpad go/no-go decision and leans on Quinn's Aug 27 discontinuation recommendation. Vik's direction (14 Sep 2026): Launchpad is important; Quinn's recommendation is a counter-signal to be answered, not a conclusion to be inherited; the frame must not be limited to the surfaces Vik owns (API / MCP / CLI / Terraform); the ICP will not be multi-million-dollar customers; use data; customer interviews run next week.

**Frame decomposed:**

> What must be true for Launchpad to close the gap between "application code that works" and "trusted, operated production infrastructure on DigitalOcean" for a specific, data-identified customer — why does the shipped Launchpad not do this today — and how does it connect to the adjacent DigitalOcean surfaces (App Platform, MARS, Marketplace, MCP, Gradient) and the teams that own them?

Launchpad is the vehicle. Its April–September 2026 record is treated as evidence about the problem, not as a verdict on it.

## Files

| File | What it is | D.A.R.E. step |
|---|---|---|
| `01_Decomposition.md` | The problem broken into constituent parts, as a hierarchy. No evaluation, no recommendations. | D — Decompose |
| `02_Assumed_Facts.md` | Every claim the Past Work treats as settled, what it rests on, and — where warehouse data exists — whether the data agrees. | Pre-work for A — Audit |
| `03_Missing_Pieces.md` | Parts of the problem with no material behind them, indexed to `01`, with the artifact that would fill each and where it lives. | Pre-work for A — Audit |
| `04_Data_Findings.md` | What DigitalOcean's warehouse (`PRODUCTION.TRANSFORMED_DATA`) says about Launchpad adoption, retention, failure rate, and who used it. SQL included. Read-only. | Evidence |
| `05_Why_Not_Working_Today.md` | Causal chain for why the shipped Launchpad does not close the gap, built from the data and the record, and how each cause connects to MARS / App Platform / Marketplace / MCP / Gradient. | A — Audit (partial) |
| `06_ICP_and_Interview_Plan.md` | ICP hypothesis derived from the data (not from the nine interviews alone), the recruit lists to pull, and the interview plan for next week. | Evidence → E — Experiment |
| `07_Team_Dependencies.md` | Every team Launchpad depends on, what it needs from them, what the record says about that dependency, and what is unknown. | Pre-work for R — Recombine |
| `08_Grand_Vision_Inputs.md` | The building blocks a grand vision must rest on, which of them are verified, and a draft vision statement marked as hypothesis. | R — Recombine (draft) |
| `10_Briefing.md` | Mid-level narrative of the whole story — idea, what the company concluded, what the data says, why it didn't work, the cast, what's next. Start here if new to this. | Summary |
| `09_Slack_Echoes.md` | Public-channel Slack search (Sep 2025 – Sep 2026): where the problems in `02`–`08` are echoed by other teams and customer interviews; resolves what MARS is, dates the agent-Launchpad prototypes, and identifies a 5 Aug dashboard change as the leading candidate for the August cliff. | Evidence |
| `11_Audit.md` | Red-team of every load-bearing assumption in `01`–`10` — the Past Work's and this folder's own — classified Fact / Convention / Unknown, with what breaks if each is removed or inverted. Includes six verification queries that revise `04` (320 external completed deploys, not 467; 62 of 108 same-day deleters gone within an hour; 8 repeat teams, not 21) and add the missing retention baseline — Launchpad apps are redeployed 7% vs 70% for ordinary App Platform apps. Ends with the list of blocks that survive as facts for Recombine. | A — Audit |
| `12_Recombine.md` | Three structurally different solutions built only from the surviving blocks — *Expires unless claimed* (first hour), *Attach to the app you already have* (app tier), *Verify, don't deploy* (breakage) — each with the convention it breaks, its biggest failure point, and its unverified assumptions. Excludes the repo-analysis / control-plane / rename playbook by rule. | R — Recombine |
| `13_Outsider_Read.md` | Problem definition and vision from an infra-platform (AWS/GCP) seat, independent of `12`. Ten foundational truths of infrastructure management; the struggling moment restated per-component; six journey cohorts (Evaluator, Shipper, Operator, Replicator, Agent-directed, Agent-as-actor) replacing skill personas; how each manages today and what they buy instead; the conventions Gen 1–3 carried that the truths don't derive; a customer-world vision with decision tests. Does not evaluate or solve. | Problem definition / Vision |
| `14_Great_Question_Sources.md` | Inventory of CY2026 research in the Great Question workspace relevant to the problem: the 2026 study list, ~50 transcripts tagged to the six `13` cohorts by study/transcript ID, the OpenClaw churn survey (45 responses) as the closest analogue to Launchpad's same-day deleters, manual search prompts, and what is missing. No customer identifiers. | Evidence |

## How the files relate

`01` defines the anatomy; every other file cites its component numbers (e.g. `[5.4]`). `04` is the only file with new primary evidence. `05`, `06`, `07`, `08` build on `01`–`04` and are explicit about which blocks are verified and which are still assumptions.

## Rules followed

- Documentary material is limited to the five Past Work files plus public Slack channels (`09`). Quantitative material comes from read-only queries against DigitalOcean's Snowflake warehouse, all reproduced in `04`.
- Where the Past Work is an inference layer over the source documents (it frequently is), that is noted rather than collapsed into "fact."
- `01` does not rank, judge, or recommend. Judgments live in `05`–`08` and are labelled.
- No customer names, emails, or account identifiers appear in these files. Recruit lists are provided as SQL to run, not as data.

## What comes next

`11` is the **fp-audit** output over `01`–`10`; `12` is the **fp-recombine** output built from its surviving facts. `11`'s "Corrections" table lists edits owed to `04`, `05`, `06`, `08`, `10` (not yet applied). `06` is executable next week and should absorb the audit's cohort notes (drop C, raise D) and carry one question per `12` solution. Next: **fp-experiment** on `12`. Re-run the audit on entries 4, 5, 7 once interview results land.
