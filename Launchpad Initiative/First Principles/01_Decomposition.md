# 01 — Decomposition

**Problem:** What must be true for Launchpad to close the gap between "application code that works" and "trusted, operated production infrastructure on DigitalOcean" for a specific, data-identified customer — why does the shipped Launchpad not do this today — and how does it connect to the adjacent DigitalOcean surfaces and the teams that own them?

This file shows what the problem is made of. It does not judge which parts matter most, which are true, or what to do. Component numbers are used as anchors by every other file in this folder.

---

## 1. The gap itself — the work between "code works" and "trusted production"

*What it contains:* the sequence of distinct pieces of work that someone or something must perform to turn a working application into operated production infrastructure. Each is a separable unit with its own actor, tooling, and failure mode.
*How it connects:* this is the thing DigitalOcean would or would not be helping to close. Every other component is about who does this work, on what surface, at what cost, and with what evidence.

- **1.1 Interpretation** — reading the application (repo, framework, runtime, dependencies, env vars, background workers, queues, model calls, vector storage) to determine what it needs.
- **1.2 Architecture decision** — choosing which DigitalOcean resources (App Platform, Droplets, Managed DB, Spaces, Load Balancer, VPC, GPU) compose the infrastructure, and how they connect.
- **1.3 Provisioning** — creating those resources, in some order, in some container (Launchpad used one new DO project per deployment).
- **1.4 Wiring** — secrets, environment variables, DNS, SSL, private networking, service-to-service connections, health checks, billing. (The AgentDeploy PRFAQ names this set as what coding agents "cannot close.")
- **1.5 Validation** — confirming the deployed system works: success/failure of the deploy, structured errors vs. silent partial failure, health exposure.
- **1.6 Day-2 operation** — patching/upgrading the OS and components, scaling, monitoring, troubleshooting, swapping components, rollback, drift handling. Recurs for the life of the application.
- **1.7 Cost understanding** — estimating infrastructure cost pre-deploy, tracking variable AI/token cost, avoiding surprises. (The MVP scoped "transparency, not control.")
- **1.8 Ownership and exit** — who maintains the infrastructure definition after handoff (platform or user), and whether the user can take it with them (Terraform export / "eject").
- **1.9 Understanding** — the user's mental model of what was created. Quinn's diagnosis: Launchpad simplified 1.3 without simplifying the user's understanding of the resulting architecture.
- **1.10 Recurrence** — how often each of 1.1–1.9 is performed per application (once at setup vs. ongoing), and per user (one app vs. many clients/environments).

## 2. The actor — who or what performs the work today

*What it contains:* the entities that currently perform the work in §1, and the fact that the performer is increasingly an AI agent acting for a human rather than the human directly.
*How it connects:* the surfaces in §3 are consumed by actors; which actor performs which step determines which surface is in play.

- **2.1 The human user, by archetype** (from the nine interviews):
  - 2.1.1 AI-Enabled Builder — low–intermediate expertise; uses AI tools as a "lead engineer" surrogate; locked out of advanced architectures otherwise.
  - 2.1.2 Efficiency Architect — intermediate–high; agencies/technical founders; already uses App Platform; wants managed multi-resource experience; asks about Day 2.
  - 2.1.3 High-Infra Scaler — high; Kubernetes, custom GPU/driver configs, writes own management software; wary of opinionated defaults.
  - 2.1.4 Autonomous Soloist — high; bypasses UI and IDE; hands an AI agent an API token.
  - 2.1.5 "Vibe Builder" — named by one customer (Josie) as a sub-observation; not independently profiled.
- **2.2 The AI coding agent** (Claude Code, Codex, Cursor) acting on the user's behalf — performs 1.1–1.4 by calling APIs, writing CLI commands, or writing Terraform.
- **2.3 The AI app builder** (Lovable, Replit, Bolt, Base44, v0) — produces the application and often hosts a prototype of it; the user then faces §1 when leaving the builder.
- **2.4 The hired developer** — the "do nothing" substitute named in the PRFAQ community-discussion citation.
- **2.5 DigitalOcean's own product** — Launchpad performing 1.2–1.3 (and partially 1.7) on the user's behalf.
- **2.6 Secondary actors** — sales and solutions engineering, named in the proposal as users of Starter Kits for demo environments.
- **2.7 Actor mix per step** — for each step in §1, which of 2.1–2.6 does it today, and whether the actor is the same across steps or hands off (e.g., agent provisions, human operates Day 2).

## 3. The surfaces — the interfaces through which the work is done

*What it contains:* the DigitalOcean interfaces an actor can use to perform §1 work. Grouped by what they are, not by who owns them — ownership is §9.4 and `07_Team_Dependencies.md`.
*How it connects:* Launchpad is a composition of several of these; the adjacent products bound what "one level above App Platform" means and where overlap lives.

- **3.1 Programmatic surfaces**
  - 3.1.1 Public API — the primitive every other surface is built on; what a Soloist's agent calls directly.
  - 3.1.2 MCP server — the surface a coding agent consumes; Quinn's recommended alternative ("deploying via MCP from coding tools").
  - 3.1.3 CLI (`doctl`) — what an AI-Enabled Builder's AI tool writes commands for; the research team's suggested exposure for Soloists.
  - 3.1.4 Terraform provider — the IaC surface; Launchpad's background execution layer; the "eject" path; the "one-way door" in every PRFAQ.
- **3.2 Product surfaces**
  - 3.2.1 Console — Launchpad's entry point; "premium placement"; the surface the retrospective says mismatches how customers search.
  - 3.2.2 App Platform and its spec YAML — the product every PRFAQ positions "one level above"; Scrydex replaced Terraform with it; the runtime for Launchpad's RAG kit.
  - 3.2.3 Marketplace blueprints — the ELK and Airflow blueprints two of the three starter kits reuse.
  - 3.2.4 MARS — named by Quinn as an alternative "infrastructure abstraction"; no description in the accessible material.
  - 3.2.5 Gradient (GenAI platform: agents, knowledge bases, inference) — the RAG kit provisions a `genai_agent` and a `knowledge_base`; named in the research as the owner of AI cost/performance monitoring.
  - 3.2.6 Managed Databases, Droplets, Load Balancers — the other resource types Launchpad stacks create.
  - 3.2.7 IDE — the long-term-vision entry point (IDE-first, intent-based, persistent agent); an IDE prototype URL exists.
- **3.3 Expressiveness of each surface** — what each of 3.1–3.2 can and cannot represent: a single resource, a multi-resource architecture, state, a plan/diff, a rollback, a Day-2 action, a cost estimate.
- **3.4 Surface-to-actor mapping** — which actors in §2 use which surfaces (Soloist→API/agent; Scaler→Terraform/K8s; Architect→App Platform/console; Builder→AI tool→CLI).
- **3.5 Surface-to-step mapping** — which steps in §1 each surface currently covers.

## 4. Trust — the property that distinguishes "production" from "deployed"

*What it contains:* the attributes that, together, make infrastructure something a user relies on rather than merely something that exists. The frame's word "trusted" is this component.
*How it connects:* §1 is the work; §4 is the quality bar the work must meet. Launchpad's failure diagnosis and the interview anxieties are both statements about §4.

- **4.1 Correctness** — the architecture fits the application (not underpowered, e.g. 1 GB RAM for a workload that needs more).
- **4.2 Security defaults** — secrets encrypted, private networking, no cross-project access, no plaintext exposure. (Compliance controls explicitly out of MVP scope.)
- **4.3 Cost predictability** — pre-deploy estimate, variable-cost flagging, spend caps (out of MVP scope).
- **4.4 Reversibility** — rollback, recovery, ability to undo a Day-2 action without data loss.
- **4.5 Maintainability** — a known answer to "who patches this, how do I upgrade, how do I swap a component."
- **4.6 Observability** — logs, metrics, health, and (for AI workloads) token cost and RAG accuracy.
- **4.7 Ownership clarity** — the boundary between platform-managed and user-managed resources; state ownership; drift semantics.
- **4.8 Comprehensibility** — the user can understand what exists and why (the "abstraction mismatch").
- **4.9 Portability** — the ability to export the definition and leave.
- **4.10 Trust per actor** — what each archetype in §2 needs from 4.1–4.9 differs (Builders: 4.8 and 4.3; Architects: 4.5 and 4.9; Scalers: 4.1 and 4.7).

## 5. The Launchpad record — what was tried and what happened

*What it contains:* the three generations of the idea, the shipped instance's measured outcome, and the diagnoses offered. Treated here as a body of evidence about §1–§4, with each item scoped to the surface it was observed on.
*How it connects:* this is the only direct empirical record in the evidence base of DigitalOcean attempting the problem.

- **5.1 Generation 1 — Launchpad / Starter Kits MVP (shipped 28 Apr 2026, per plan)**
  - 5.1.1 Entry point: console.
  - 5.1.2 Unit of value: static template (3 kits proposed — RAG Knowledge Assistant, Airflow Data Workflow, ELK Observability).
  - 5.1.3 Execution: Terraform in the background, invisible to the user.
  - 5.1.4 Post-deploy editing: fork a published template repo; App Platform deploys from the fork.
  - 5.1.5 Scope boundary: stopped at provisioning (§1.3); 1.4–1.9 left to the user.
  - 5.1.6 Target user as scoped: "AI developers/builders (Pre-ANE/DNE)," low–medium infrastructure expertise.
  - 5.1.7 Non-functional requirements: p95 ≤ 2 s, zero-manual-edit deploy, structured errors, encrypted secrets, cost transparency; no compliance controls, no spend caps.
  - 5.1.8 Planned metric framework: time-to-first-deploy (<15 min), success rate, drop-off, % launching via kits, deployments/user, multi-product attach, post-launch interaction, deploy→continued-usage, scale-up, incremental revenue.
- **5.2 Generation 2 — long-term vision (unbuilt)**: IDE-first, intent-based, persistent agent; NL "describe your application" and "migrate existing infra" paths.
- **5.3 Generation 3 — LaunchBot / AgentDeploy PRFAQs (drafted 2026, dating unresolved — see `02`)**
  - 5.3.1 Entry point: GitHub repo URL (LaunchBot) / coding-agent workflow (AgentDeploy).
  - 5.3.2 Unit of value: repository analysis + dynamic architecture recommendation.
  - 5.3.3 Execution: Terraform as explicit execution and state layer.
  - 5.3.4 Post-deploy: a named control plane ("Deployment Console" / "LaunchKit").
  - 5.3.5 Positioning trajectory: starter-kit vendors → AI app builders' production gap → coding agents' deployment blind spot.
  - 5.3.6 Prototypes: console prototype URL, IDE prototype URL, FreeScout scan transcript.
- **5.4 Measured outcome of 5.1**: fewer than 100 deployments; fewer than 5% still active at retrospective time; "despite premium in-console placement." Planned metrics in 5.1.8 not reported.
- **5.5 Diagnoses offered**
  - 5.5.1 Retrospective (Quinn, 27 Aug): weak differentiation; limited scope; low flexibility; limited discovery; high maintenance burden; low repeat value; abstraction mismatch.
  - 5.5.2 Interviews (Apr–May): Day-2 anxiety; jargon barrier; underpowered defaults; UI irrelevance to agent-driven users.
  - 5.5.3 Peer reviewer notes on LaunchBot v2: reposition post-prototype; differentiate from App Platform; drop "vibecoder"; Day 2 is a big pain point.
- **5.6 Lesson scope** — for each item in 5.5, whether it is a statement about the console surface, about static templates, about the provisioning-only scope, or about the gap in §1 regardless of surface. Each diagnosis has one of these scopes; the scope is a property to be determined, not yet determined in the Past Work.
- **5.7 Constants across generations** — repository interpretation, architecture recommendation, Terraform provisioning/state, a post-deploy control plane, cost visibility, and a stated non-overlap with App Platform appear in every generation's design.

## 6. The customer base — who has this problem on DigitalOcean, and how many

*What it contains:* the population dimension of §2.1 — size, value, reachability, trajectory.
*How it connects:* determines what "a role for DigitalOcean" is worth, and which surfaces reach the population.

- **6.1 Segment composition** — how many DO customers fall into each archetype in §2.1; how the archetypes map onto DigitalOcean's own account segmentation (Hobbyist / Emerging SMB / Advanced SMB / Enterprise; technical aptitude; cloud adoption).
- **6.2 Segment value** — revenue and resource consumption per archetype; attach behaviour. Boundary set by Vik: the ICP is not multi-million-dollar customers.
- **6.2a Actual Launchpad users** — who in fact deployed (see `04_Data_Findings.md`): account segment, lifetime value, account age, repeat behaviour, and which of them kept what they deployed.
- **6.3 Reachability** — where each segment shows up: console, IDE, agent, CLI, Marketplace search; and what they search for (the retrospective: "a product or application, not an architecture").
- **6.4 Trajectory** — whether the AI-native / agent-driven share is growing; whether coding agents shift users between archetypes over time.
- **6.5 Stage over time** — the research team's lifecycle observation: prototype → growth → scale, with IaC demand rising only at scale; a single user moves through stages.

## 7. Alternatives already occupying the gap

*What it contains:* every other way the §1 work gets done today, internal and external, and what each leaves undone.
*How it connects:* DigitalOcean's "role" is defined relative to these; Quinn's recommendation and every PRFAQ FAQ are statements about §7.

- **7.1 Internal**
  - 7.1.1 Coding agent + DO API token via MCP/API (the Soloist's method; Quinn's "deploy via MCP from coding tools").
  - 7.1.2 App Platform directly, including copy-paste spec YAML across environments.
  - 7.1.3 Marketplace 1-click blueprints.
  - 7.1.4 MARS (capabilities undescribed).
  - 7.1.5 Terraform provider used directly by the user.
  - 7.1.6 Self-managed Droplets / Kubernetes.
- **7.2 External**
  - 7.2.1 App platforms — Vercel, Netlify, Render, Railway, Heroku, Fly.io.
  - 7.2.2 AI app builders' own hosting — Lovable, Replit, Bolt, Base44, v0.
  - 7.2.3 Hyperscaler starter packs — GCP Agent Starter Pack + ADK, Azure AI starter kits, AWS Bedrock templates.
  - 7.2.4 Inference / GPU platforms — Modal, Baseten, Together, Fireworks, CoreWeave, Lambda.
  - 7.2.5 IaC tooling — Terraform Cloud, Pulumi, CloudFormation.
  - 7.2.6 Hiring a developer.
- **7.3 Coverage map** — for each alternative, which steps of §1 and which attributes of §4 it covers, and on which surface.
- **7.4 Overlap and boundary** — where a DO role would coincide with 7.1.2, 7.1.3, 7.1.4 (the App Platform non-overlap paragraph; the "overlap with AgentDeploy, App Platform, Marketplace, MARS" con).

## 8. Economics — what DigitalOcean gains and spends

*What it contains:* the value and cost sides for DigitalOcean specifically.
*How it connects:* §1–§7 describe the problem and the field; §8 is why DigitalOcean would care.

- **8.1 Value mechanisms** — incremental resource adoption; multi-product attach; retention of deployments; revenue per deployment; conversion of prototypes into durable production workloads.
- **8.2 Repeat value** — whether value accrues once (setup) or continuously (Day 2); the retrospective names front-loaded value as a failure cause.
- **8.3 Build cost** — team, timeline, and cost for the "do it right" scope; placeholders ("[INSERT]") in the retrospective.
- **8.4 Maintenance cost** — static blueprint upkeep as products/APIs/OSS versions change vs. dynamic recommendation-engine upkeep.
- **8.5 Distribution cost** — console placement was one channel; IDE, agent, CLI, and Marketplace are others; "sustained distribution investment" named as a requirement.
- **8.6 Opportunity cost** — "other DigitalOcean investments have stronger customer pull and clearer distribution" (unnamed).

## 9. The organisation — decision, ownership, and voices

*What it contains:* who decides, who owns which surface, what the initiative's current status is, and whose views are on record.
*How it connects:* determines whether the frame is a live decision or a retrospective, and who Vik's evaluation is for.

- **9.1 Current status** — outcome of the 27 Aug recommendation; whether AgentDeploy/LaunchBot proceeded, paused, or stopped. Not stated in the accessible material.
- **9.2 Decision-maker and mandate** — who decides; what Vik has been asked to produce (evaluation, proposal, recommendation on owned surfaces).
- **9.3 Decision criteria** — what threshold would make a role "worth it"; none documented.
- **9.4 Ownership map** — Launchpad team; App Platform; Marketplace; MARS; Gradient; Managed Databases; Console; API/MCP/CLI/Terraform (Vik); who owns the boundary between them.
- **9.5 Voices on record** — Quinn Eckart (formal recommendation); the ANE customer-insights team (interviews); PRFAQ authors (unnamed); one anonymous PRFAQ reviewer.
- **9.6 Voices absent** — engineering, design, sales/SE, support, leadership, App Platform, MARS and Gradient owners.
- **9.7 Sequence of the two tracks** — June PRFAQ drafting and the August recommendation; their relationship (successive, parallel, or contradictory) is a property to be established.
- **9.8 Dependencies on other teams** — for each step in §1 and each surface in §3, which team must build, maintain, or agree to something for Launchpad to work; enumerated in `07_Team_Dependencies.md`.

## 10. Time

*What it contains:* the temporal dimension — how fast the field moves, when decisions are needed, and which decisions are hard to reverse.
*How it connects:* several components (§7, §5.3.5, §3.1.4) change meaning depending on the date they are evaluated at.

- **10.1 Field velocity** — competitive positioning drafted in April was reframed twice by the latest PRFAQ; coding-agent capability is cited as "rapidly reducing the value of template-based deployment."
- **10.2 Evidence age** — interviews Apr–May 2026; competitive desk research 3 Apr 2026; retrospective 27 Aug 2026; today 14 Sep 2026.
- **10.3 Decision timing** — when a decision on a DO role must be made and what changes if it is deferred.
- **10.4 Irreversibility** — the Terraform-as-execution/state-layer choice is flagged as a one-way door in every PRFAQ; the reversibility of the alternatives is not described.
- **10.5 User stage progression** — a single user's needs shift from console speed to IaC over the lifecycle (§6.5), so the same user is a different actor at different times.

## 11. The evidence base itself

*What it contains:* the sources the Past Work is built from, their type, coverage, and the inference layers added on top.
*How it connects:* every component above is only as good as this one; `02` and `03` are largely about §11.

- **11.1 Accessible sources (5)** — ANE Customer Insights; DigitalOcean Starter Kit (Proposal); Launchpad/Starter Kits Review; LaunchPad PRFAQ – June '26; Launchpad – Future Recommendation.
- **11.2 Inaccessible sources (2)** — Google Doc IDs ending `...Zqs` and `...VEM`; contents unknown.
- **11.3 Evidence types** — nine qualitative interviews; desk-research competitive tables; a single-author retrospective; multi-version PRFAQ drafts; prototype URLs and one demo transcript; two top-line adoption figures; and (added 14 Sep) warehouse tables `DO_TERRAFORM_STACKS`, `DO_TERRAFORM_JOBS`, `DO_TERRAFORM_STACK_RESOURCES`, `APP_PLATFORM_APPS`, `ACCOUNTS`, `ACCOUNT_SEGMENT_TYPES`.
- **11.4 Perspective** — documentary sources are DigitalOcean-internal; no customer-authored, competitor-benchmark, or third-party data. Warehouse data is behavioural, not attitudinal.
- **11.5 Inference layers** — (a) the source authors' own inferences (e.g. the research team's PMF ranking); (b) the Past Work's inferences over the sources (e.g. "two contradictory tracks," "most senior voice," the September vs. June PRFAQ dating); (c) context supplied from outside the documents (Vik's surface ownership and growth area).
- **11.6 Coverage against §1–§10** — which components have any source material at all; enumerated in `03_Missing_Pieces.md`.

---

*This decomposition is the input to **fp-audit**. `02_Assumed_Facts.md` lists the blocks above that the Past Work treats as settled and checks them against `04_Data_Findings.md`; `03_Missing_Pieces.md` lists the blocks that are empty.*
