# 02 — Assumed Facts

Every claim the Past Work treats as settled, what it actually rests on, and where warehouse data exists (`04_Data_Findings.md`), whether the data agrees. Ordered roughly from most to least load-bearing for the frame in `00_README.md`. Component anchors refer to `01_Decomposition.md`.

**Status vocabulary**
- **Evidenced** — direct evidence in the sources or the data, of a kind that supports the weight put on it.
- **Contradicted** — the data disagrees with the claim as stated.
- **Inference** — a reasonable conclusion someone drew; the sources contain the premises, not the conclusion.
- **Inherited** — a decision, instruction, or convention adopted as a premise; not a claim about the world.
- **Unverified** — asserted; no evidence either way in the accessible material.
- **Unknown** — the claim's truth depends on information nobody in the record has.

---

## A. Claims about what happened (§5)

**1. "Fewer than 100 deployments in recent months."** `[5.4]`
Treated as: Fact, High confidence (05_Synthesis insight 4).
Rests on: Quinn's retrospective, no calculation shown.
Data: **Contradicted as a total.** 467 post-launch stacks, 299 external teams. Consistent only with August alone (33) or September-to-date (17). The sentence is true for the month it was written in and false as a summary of the product's life.
Consequence: every downstream statement of the form "adoption does not demonstrate sufficient demand" was made against a number ~4–5× too low. It may still be the right conclusion; it is not yet the demonstrated one.

**2. "Under 5% still active."** `[5.4]`
Treated as: Fact, High confidence.
Rests on: Quinn's retrospective; "active" undefined.
Data: **Evidenced under one definition, contradicted under another.** RAG apps: 15% still exist; 1.5% exist and were ever redeployed. The number is right if "active" means "being worked on"; wrong if it means "running."
Consequence: the two definitions describe different failures. "Exists but never touched" (37 apps) is a Day-2 story. "Deleted within 24 h" (108 apps) is a Day-0 story. The retrospective's diagnosis is entirely Day-2; the data says the larger cohort never got there.

**3. "The MVP failed specifically because it stopped at provisioning and left Day-2 to the customer."** `[5.5.1, 1.6]`
Treated as: Fact, High confidence, "corroborated by three independent sources."
Rests on: the retrospective's assertion + customers *asking about* maintainability before/at deployment (Cursor.io quotes are from the Customer Feedback Plan, i.e. pre-adoption sentiment, not churn accounts).
Data: **Inference.** 41% of RAG apps were deleted within 24 hours and 93% were never redeployed. Nobody in the data reached a Day-2 problem and abandoned because of it — they abandoned before Day 2. Day-2 anxiety may explain why people did not *commit*; it cannot explain same-day deletion. The "three independent sources" are: one author's diagnosis, interviewees' anticipatory worries, and public reporting about *other* platforms. None is a churned Launchpad user. **Slack (`09`):** the company *did* interview a churned Launchpad user — Israel (Josie), 11 May, ELK kit — and the interviewer's headline was "Core Problem: Post-Deploy Drop-off… he didn't know how to log in… abandoned the stack in favor of Betterstack." That is a first-hour failure, not Day 2. The interview was in `#customer-insights`, not in the Past Work.

**4. "Launch was 28 Apr 2026."** `[5.1]`
Treated as: Fact. Rests on: the rollout plan ("per the MVP rollout plan").
Data: **Evidenced.** First stacks 20 Apr (internal), external volume begins late April. Consistent.

**5. "Despite premium in-console placement" — i.e. distribution was adequate.** `[8.5, 3.2.1]`
Treated as: Fact (used to rule out distribution as the failure cause).
Rests on: the retrospective.
Data: **Unverified, and in tension with the record.** The same document says "customers search for a product or application, not an architecture" — a discovery failure — while ruling out discovery by citing placement. Also: volume was flat May–July then fell 70% in August. **Slack (`09`):** three customers interviewed in May described the home-page Launchpad/AI area as "an ad" they scrolled past; and from 5 Aug the e2e suite began failing on "Dashboard Launchpad starter kits shows three starter kit cards… never did" — the dashboard section appears to have changed the week volume collapsed. Placement was neither as premium nor as constant as the sentence implies.

**6. "High maintenance burden — blueprints rot without a team."** `[8.4, 5.5.1]`
Treated as: Fact. Rests on: the retrospective.
Data: **Evidenced.** Provisioning failure rate 9% (May) → 22% (July) → 71% (September). This is the one failure cause the data confirms directly.

**7. "Static templates couldn't accommodate real-world variation."** `[5.5.1]`
Treated as: Fact.
Rests on: the retrospective. No user asked for something the templates could not do, on the record.
Data: **Unverified.** 21 teams deployed 4+ times, some 36 times — consistent with templates fitting *some* repeated need. Cannot tell from data what they did with them.

**8. "A working prototype with non-trivial repo scanning existed."** `[5.3.6]`
Treated as: Evidence (Low-Medium).
Rests on: one PRFAQ transcript against FreeScout. **Unverified** — could be scripted.

**9. "The PRFAQ tabs are in chronological order; LaunchBot v2 → v3 → AgentDeploy v4."** `[5.3.5, 11.5]`
Treated as: Fact (used to trace a "strategic pivot").
Rests on: tab ordering in a Google Doc. **Inherited.** Tab order is not timestamps. The Past Work also dates the PRFAQ work to "Jun 1–17" in one file and "September 2026" in another (02 §5 vs 05 chronology). Internal inconsistency; see D.

## B. Claims about the customer (§2, §6)

**10. "Efficiency Architect = Very High PMF; AI-Enabled Builder = High; Scaler and Soloist = Low."** `[2.1, 6.1]`
Treated as: Inference, Medium confidence.
Rests on: nine interviews, ~2 per archetype, ranked by the research team's judgment.
Data: **Partially evidenced, directionally.** Launchpad over-indexes 4× on Advanced SMB and 4× on cloud-adoption-advanced accounts, and under-indexes on Hobbyists. Advanced SMB survival is 56% vs 14% for Hobbyists. This is the Efficiency Architect profile behaving as predicted — on n=9 apps. The ranking survives contact with data; the confidence should not yet rise above Medium.

**11. "The MVP's target user was Pre-ANE/DNE, low–medium infra expertise."** `[5.1.6]`
Treated as: Fact (from the proposal). Rests on: the proposal.
Data: **Evidenced as intent, contradicted as outcome.** 89% of matched Launchpad users are `technically_advanced`. The product was built for one user and used by another.

**12. "Nine interviews were a cross-section of DigitalOcean customers."** `[11.3]`
Treated as: Fact. Rests on: the research doc's description. **Unverified.** Sampling method, recruitment source, and what "ANE" denotes are not in the record. The interviewees were reachable, articulate, and willing — which is a sample of a kind.

**13. "Vibe coders are not our target customer."** `[2.1.5, 6.1]`
Treated as: Fact (adopted by all later PRFAQs).
Rests on: one anonymous reviewer's instruction. **Inherited.** It is a positioning decision, not a finding. Data: 49% of matched Launchpad users are Hobbyists and 43% of all users are unsegmented new accounts — a population that includes the people the instruction excludes. Whether to serve them is a choice; whether they show up is not.

**14. "Customers search for a product or use case, not an architecture."** `[6.3]`
Treated as: Fact. Rests on: the retrospective. **Unverified.** No search logs, no console navigation data, no Marketplace query data in the record. Plausible; unmeasured.

**15. "Terraform demand is lifecycle-driven, not persona-driven."** `[6.5, 3.1.4]`
Treated as: Evidence + Inference. Rests on: two anecdotes (Wiplash abandoned it; Scrydex replaced it with App Platform YAML). **Inference** from n=2.

**16. "The ICP is not multi-million-dollar customers."** `[6.2]`
Treated as: Boundary set by Vik (14 Sep).
Data: **Evidenced.** 2 enterprise accounts of 299; 5 accounts over $100k LTV; median LTV ≈ $46. The boundary and the behaviour agree.

## C. Claims about the market (§7)

**17. "No one provides a flexible, experience-first way to deploy full application architectures."** `[7.3]`
Treated as: Fact in the source; flagged as hypothesis by 02_Competitive.
Rests on: desk research of public positioning, 3 Apr 2026, no hands-on trials. **Unverified**, and five months old in a field the Past Work itself describes as repositioning every few months.

**18. "Coding agents cannot close the loop — DNS, SSL, secrets, billing, health checks."** `[1.4, 2.2, 7.1.1]`
Treated as: Fact (AgentDeploy's founding premise).
Rests on: the PRFAQ's assertion. **Unverified, and one interviewee contradicts it.** Wiplash hands an agent an API token and provisions directly. Whether agents can do 1.4 on DigitalOcean today, via the MCP server, is testable in an afternoon and has not been tested in the record.

**19. "Coding agents are rapidly reducing the value of template-based deployment."** `[10.1, 7.2]`
Treated as: a con in the retrospective's pros/cons.
Rests on: one peer's forward-looking read. **Unverified.** Data: 21 teams used templates 4+ times through September, while agents were available. Not decisive; not nothing.

**20. "Thousands of publicly accessible AI-generated apps are exposing sensitive data."** `[7.2.2]`
Treated as: Evidence for the production-readiness gap.
Rests on: public reporting cited in the PRFAQ, not reproduced. **Unverified here**, and about other platforms' users, not DigitalOcean's.

**21. "Hybrid app+infra templates are the least crowded category."** `[7.2.3]`
Treated as: Fact (April). **Unverified** and dated.

## D. Claims about the organisation (§9)

**22. "Quinn's recommendation is the clearest, most senior, most specific internal voice."** `[9.5]`
Treated as: Fact (03_Peer_Feedback).
Rests on: the Past Work's characterisation. **Inference.** Quinn's role and authority are not stated anywhere in the sources. "Most specific" is supportable (it cites numbers); "most senior" is not in evidence. And the numbers it cites are, per A1–A2, understated or undefined.

**23. "Two contradictory tracks: 'kill it' (Aug) vs 'relaunch it as AgentDeploy' (Jun)."** `[9.7]`
Treated as: "the single most important finding."
Rests on: the Past Work's reading. **Inference, and possibly a misreading.** Quinn's sentence is "discontinue Launchpad investment *in favor of integrations with 3p coding tools* and infrastructure abstractions like MARS & App Platform." AgentDeploy *is* an integration with 3p coding tools. The two documents may be the same recommendation — stop the console-template product, pursue the agent-integration product — written by different people at different times. **Slack (`09`):** `agent-launchpad-prototype` repos were created by Scott Miller (5 Aug) and Quinn Eckart (18 Aug) — the people writing the retrospective were building the agent-first successor in the same month. The tracks are one track.

**24. "Launchpad is a live decision for Vik to evaluate."** `[9.1, 9.2]`
Treated as: premise of the entire Past Work. **Unknown.** The record does not say what happened after 27 Aug. Data: stacks are still being created in September (17), and 71% of them fail. The product is live and unattended, which is a fact; whether anyone is deciding about it is not in the record.

**25. "Other DigitalOcean investments have stronger customer pull and clearer distribution."** `[8.6]`
Treated as: a con. Rests on: the retrospective. **Unverified** — the investments are not named.

**26. "MARS is an alternative that could make Launchpad redundant."** `[3.2.4, 7.1.4]`
Treated as: possibility. Rests on: one mention. Was **Unknown** in the record. **Slack (`09`): Evidenced as a different thing.** MARS = Managed Agent Runtime Services — DigitalOcean's hosted coding-agent platform (Public Preview 10 Sep 2026), not an infrastructure control plane. It does not do what Launchpad does; it hosts the agents that would *call* what Launchpad does. Quinn's "in favor of… MARS" is a statement about which surface the customer is on, not about redundant capability.

## E. Claims about the technology (§1, §3, §10)

**27. "Terraform as execution/state layer is a one-way door."** `[10.4, 3.1.4]`
Treated as: Fact, repeated in every PRFAQ. **Unverified.** No reversibility analysis, no alternative considered on the record. Repetition is not evidence.

**28. "Doing it right requires [repo analysis, rollback, state mgmt, secrets, domains, DBs, cost, logs, metrics, scaling, upgrades, troubleshooting, Terraform export, GitHub/agent/Marketplace/console integration, a dedicated team, distribution]."** `[1.1–1.9, 8.3]`
Treated as: Fact (the scope of a real product). **Inherited.** It is the maximal list; it comes from the same authors whose product did not ship most of it. It is a statement of what *they* believe is required, not a derivation from what users did. Data: the users who kept the product never redeployed. Which items on the list they would use is unknown.

**29. "Repo analysis is the right successor to static templates."** `[1.1, 5.3.2]`
Treated as: Fact across Generation 3. **Inherited.** Trades a known maintenance burden (templates — F4 confirms it) for an unknown one (recommendation accuracy on messy repos).

**30. "Each deployment creates a new DO project."** `[1.3, 5.1]`
Treated as: Fact. Rests on: the proposal. Data: `stacks.project_id` has one distinct value across all 637 rows — either the field is unpopulated in the view, or the design was not implemented as described. **Unresolved**; worth one question to the Launchpad engineers.

## F. Internal inconsistencies within the Past Work

These are places where the five files disagree with each other or with themselves. They are not about the world; they are about the record.

| # | Inconsistency | Where |
|---|---|---|
| i | PRFAQ drafts dated "Jun 1–17, 2026" in one place and "September 2026 PRFAQ drafts" in another. | 05 chronology step 5 vs 02 §5 last paragraph |
| ii | "Premium in-console placement" cited to rule out distribution; "customers search for a product, not an architecture" cited as a discovery failure. Both from the same retrospective. | 04 §4; 05 Product Risks |
| iii | "Three independent sources corroborate" the problem — but the sources are internal authors reading each other's work plus public reporting about other platforms. Independence is asserted, not shown. | 05 insight 1 |
| iv | Quinn's recommendation is characterised as "kill it" while its text recommends redirecting to coding-tool integrations — the thing AgentDeploy is. | 03 §1; 05 key synthesis point |
| v | The Past Work says "no quantitative usage data" exists, and the "<100" figure is accepted as High confidence. The warehouse holds per-deployment records nobody in the record queried. | 01 Gaps; 04 Gaps; 05 insight 4 |
| vi | The MVP target user (low–medium expertise) and the recommended focus segment (Efficiency Architect, intermediate–high) are different people; the Past Work notices this but continues to treat the interview PMF ranking as a finding *about Launchpad's users* rather than about a segment Launchpad was not built for. | 04 §2; 05 Product Risks |

---

*Next step: fp-audit takes each of A1–E30 and asks: what breaks if this is removed, what changes if it is inverted. The candidates whose inversion would most change the frame are A1, A3, B13, C18, D23, and E28.*
