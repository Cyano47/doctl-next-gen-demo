# doctl Next-Gen: Product Requirements Document

| | | | |
|---|---|---|---|
| **Status** | Draft v1.2 | **Owner** | Vikranth Alapati (PM) |
| **Audience** | Engineering, Product, Docs | **Target ship date** | Phased by exit criteria, not dates |
| **Sources** | doctl Vision Doc, Next-Gen doctl Proposal (Safari #2, ~25 interviews, v1.155.0 audit, competitive scan, usage data) | **Companion doc** | Engineering RFC covers schema mechanics, agent architecture, model selection — this PRD stays product-level |

> **Changelog v1.1 → v1.2** — Applied consistency fixes from review: (a) moved native-agent-recognition to Next, where MCP-in-binary lands; (b) added DB credential retrieval and CLI-wide **name acceptance** as explicit Now deliverables gating MCP; (c) added JSON field projection / CSV / streaming output as deliverables behind the "Andrew < 50" exit criterion; (d) clarified `doctl init` is auth/context/config setup, not resource-creation wizards (reconciled with Vision out-of-scope); (e) standardized the AI namespace on `doctl gradient` and flagged the rename as an open decision; (f) restored the Evaluator and Platform Engineer personas and fixed the "N/5 personas" denominator; (g) added baselines/assumptions to metrics; (h) tagged competitor claims for sourcing; (i) added two design principles so "every item maps" holds; (j) reframed the quota-overspend risk.

## 1. Why Now

doctl has run a decade without a clear owner, and that debt now collides with strategy: DigitalOcean is positioning as an Agentic Inference Cloud, and the CLI is the surface agents and infra engineers hit first. Competitors have already converged on the answer — per the competitive scan [source: competitive-scan doc, verify product names/dates before circulation], rival cloud CLIs have shipped dual Agent/Human modes with a skills layer and local eval, and multiple agent CLIs now ship deep MCP support and inline AI completions. doctl has none of it, while demand already exists: 32M+ monthly Kubernetes requests, 7,600+ accounts, and customers unprompted asking for native MCP.

## 2. The Problem

Users can't finish core workflows in doctl alone. UX Safari #2 tested five personas end-to-end — App Platform create, GPU provisioning, DB credentials — and zero completed the task without switching to the Console. This is a reliability gap, not an AI gap, and it predates the AI conversation. Sequencing matters: earning back trust in the CLI comes before asking users, or agents, to run it autonomously.

Four patterns recur:

1. **Incomplete workflows** — App Platform, DB credentials, and GPU provisioning all dead-end mid-flow back to the Console.
2. **Brittle UX** — no pricing visibility, single-line errors, silent long-running commands, UUID-only identifiers, JSON output that's costly to parse.
3. **Data gaps** — 15-day bandwidth ceiling, node IDs that reset on cycle, no SSH-key-on-create, no API path to request quota increases.
4. **Imperative-only surface** — no natural language, no inline completions, no plugin framework, no native MCP — while customers already hand-pipe Claude/Cursor output into doctl.

Why now and not sooner: doctl was built as a 1:1 API translation with no dedicated owner for years, and docs were assumed covered by `-h` and went stale (last validated 2020). Both are fixable — and both matter more now that agents, not just humans, will be the ones running these commands.

## 3. Vision

doctl becomes dual-mode: **Human Mode** for deterministic terminal control, **Agent Mode** for a structured, versioned surface machines can drive safely. Reliability comes first; AI layers on top of a base that already works — shipping `doctl ask` before workflows complete would just automate the failure faster.

## 4. Non-Goals

- Building foundation models or training infrastructure — doctl calls DO AI Platform, it doesn't host models.
- Replacing the Console for account, billing, or support flows.
- Specifying model architecture, tool-calling protocol, or eval design (companion RFC).
- Designing the Pricing API or Identity's token infrastructure — this PRD assumes those dependencies (Section 11) and states what doctl needs from them.
- **Interactive resource-creation wizards / questionnaires.** Consistent with the Vision: guided setup for *resources* belongs in the Console. doctl provides `--from-repo` shorthand and sensible defaults instead. The only "wizard" in scope is `doctl init` for **auth/context/config setup** (see Section 8), not resource creation.

## 5. Target Personas

Workflow-completion is measured against the **five human personas** the UX Safari tested end-to-end (the "N/5" denominator in Section 7). The **Agent / MCP consumer** is a sixth surface tracked separately by schema-validation, not by Console-free completion.

| Persona | Core need | Headline metric | Baseline |
|---|---|---|---|
| **Evaluator** (first-run / churn-risk) | Reach first resource without a blank wall | First-session completion | ~30% today (Vision/Safari) |
| **Platform Engineer** | Droplet + K8s lifecycle, SSH-key-on-create | Workflow completion without Console | 0/5 personas today |
| **AI Infra Engineer** | End-to-end GPU + inference provisioning | Time-to-Inference | No baseline yet — instrument this quarter |
| **Vibe Coder** | Intent-based infra, lives in Claude/Cursor | Command success rate | No baseline yet — instrument this quarter |
| **CLI Orchestrator** (automation) | Scriptable, deterministic, multi-account | Nightly command count (Andrew) | 700–800 today |
| *Agent / MCP consumer* (surface, not a completion persona) | A stable surface an LLM can drive safely | Schema validation pass rate | 0% (no versioned schema today) |

## 6. Design Principles

Every roadmap item below maps to one of these — the mechanism, not just the feature:

| Principle | Why it works | Where it shows up |
|---|---|---|
| Make the CLI the default path | Status quo currently favors the Console because doctl dead-ends mid-task | App Platform / GPU / DB workflow completion (Now) |
| Add friction only where it protects | Uniform friction annoys; targeted friction prevents costly mistakes | Confirmation + dry-run on destructive ops; tab-complete and defaults everywhere else |
| Resolve cost uncertainty before commit | Users won't act against an unknown loss | Per-command pricing display |
| Progress is a trust signal, not just info | Silence during provisioning reads as failure | Multi-stage progress TUI |
| Undo lowers the cost of autonomy | Reversibility is what makes delegation to an agent feel safe | `doctl rollback` |
| Every error teaches | Zero-teach errors destroy trust faster than missing features | Structured errors + "did-you-mean"; ghost-path redirects |
| The surface describes itself | Humans and agents shouldn't need out-of-band knowledge | Name acceptance; `--describe`; doc audit; discoverable AI namespace |

## 7. Goals & Success Metrics

**Goals:** close the top-3 Safari blockers (App Platform create, DB credentials, GPU provisioning) by end of Now; ship pricing, progress, and rollback so a Vibe Coder never needs the Console; establish the agent surface (versioned schema, scoped tokens, MCP-in-binary) as the foundation for `doctl ask`.

**Metrics:**

| Metric | Baseline | Target | Notes |
|---|---|---|---|
| Console-free workflow completion | 0/5 personas | 4/5 personas by end of Next | 5 = Safari human personas (Section 5) |
| Time-to-first-resource | 10–15 min *(assumption — validate against usage data)* | < 5 min | First Droplet/App/DB create, auth→ready |
| Time-to-Inference (AI Infra) | Instrument this quarter | < 90s | GPU/inference provision to first token |
| Command success rate (Vibe Coder) | Instrument this quarter | ≥ 85% | Non-error terminal actions per session |
| Schema validation pass rate | 0% (no schema) | 100% on `--output json` mutations | Gates Agent Mode |
| `doctl gradient` inference-verb usage | 0 (verb doesn't exist) | 10× within two quarters of chat/invoke v1 | See Section 8 naming note |
| doctl NPS | Baseline this quarter | +20 by Later | Standard −100..100 NPS; distinct from the Vision's 1–10 power-user rating |

## 8. Roadmap

Phased by exit criteria, not dates.

> **AI namespace naming (open decision).** Today the AI namespace ships as `doctl gradient` (with `ai`/`genai` as aliases), and the audit flags this as a discoverability problem. This PRD standardizes on **`doctl gradient`** for AI-platform *management* commands and **`doctl ask`** for the natural-language surface. Renaming `gradient` → a more discoverable root (e.g. `ai`) is a live decision owned by the CLI team + Docs; if taken, legacy paths must **redirect**, not silently exit 0 (see audit §2.2).

| Phase | Theme | Deliverables | Exit criterion |
|---|---|---|---|
| **Now** | Stop the bleeding | App Platform create end-to-end (incl. `--from-repo`; GitHub OAuth-from-CLI, see dependency note); **DB credential retrieval by name + `--no-secrets` masking**; **CLI-wide name acceptance on `get`/`connect`/`connection`** (gates Next MCP); GPU discovery + SSH-key-on-create; pricing display; progress TUI; structured errors + dry-run; **JSON `--field` projection, `--output csv`, and `--output stream-json` streaming**; versioned JSON schema with a stdout/stderr/exit-code contract; doc audit; `doctl init` (auth/context/config setup); context-aware tab-completion (Section 9) | Top-3 blockers closed; JSON schema validates on all mutations; **doctl help surfaces the AI namespace and structured output is stable enough for hand-piped agent use** |
| **Next** | Make it agent-ready | Scoped TTL tokens; `doctl rollback`; spend caps; `--describe` introspection; additive-only schema policy; MCP-in-binary; `--version-lock`; `doctl skills` | Agent runs a 30-min workflow, hits a cap, rolls back cleanly; **Claude recognizes doctl unprompted (via MCP-in-binary)**; Andrew's 800-command nightly report drops under 50 |
| **Later** | AI surface | `doctl gradient` inference verbs (chat/invoke) + deploy/scale/hot-swap; `doctl ask` (explain/suggest/fix, HITL-gated); local eval before GPU spend; ghost-text suggestions (Section 9) | Vibe Coder ships an inference endpoint from a prompt, with cost guardrails |

## 9. Feature Spotlight: Tab-Completion

doctl already covers two of the four standard completion tiers: shell path completion (native) and command completion (`doctl completion bash|zsh|fish`). It's missing the third — context-aware completion, where the tool returns live data instead of falling through to files (`git checkout <Tab>` lists real branches). For doctl, that means `doctl droplets delete <Tab>` should list actual Droplet names — closing Issue #699 (doctl's most-reacted open request; confirm at ship time) and removing the UUID-lookup step entirely.

| Tier | Example | doctl today | Phase |
|---|---|---|---|
| File/path | `cd Doc` → `cd Documents/` | Native (shell) | — |
| Command | Completes installed program names | Shipped | Done |
| Context-aware | Lists live resource names | Missing | **Now** |
| Inline prediction ("ghost text") | Predicts the full command from history | Not built | Later, with `doctl ask` |

Scope Now to context-aware completion only, backed by a locally cached resource list so it stays fast (sub-200ms) without a live call per keystroke. Ghost-text waits for the AI surface — shipping prediction before the CLI reliably finishes a workflow just predicts the wrong thing faster.

**Acceptance:** `<Tab>` on delete/get/update commands lists live resource names across Droplets, Apps, Databases, K8s clusters, and Registries; candidates come from cache, not a live call; existing shell completion is unaffected. **Cache freshness:** the resource cache refreshes on any mutating command (create/delete/rename) for that resource type and on a TTL fallback (default 60s), so `delete <Tab>` never offers a resource the user just destroyed; a stale-but-nonblocking read is preferred over a per-keystroke API call.

*[clig.dev](https://clig.dev/) · [CLI completion, Wikipedia](https://en.wikipedia.org/wiki/Command-line_completion) · [AWS CLI completion](https://docs.aws.amazon.com/cli/v1/userguide/cli-configure-completion.html)*

## 10. Risks

| Risk | Mitigation |
|---|---|
| Pricing API latency reintroduces brittleness | Local price cache, 24h refresh; degrade gracefully |
| Agent acts on a hallucinated `doctl ask` suggestion | HITL gate on high-cost/destructive ops; dry-run default; spend caps |
| Schema drift breaks pinned agents | Versioned schema + `--version-lock`; additive-only policy |
| Schema-versioning scheme unresolved blocks the Now schema deliverable | Land the stdout/stderr/exit-code contract first (doesn't need the scheme); ship schema behind a provisional version once Platform API picks semver-in-URL/header/envelope (open question, Section 11) |
| Agent overspends once quota-request lands | Quota-request-via-API is a *future* capability (today's gap, Section 2); when it ships, hard spend caps + circuit breakers override agent intent and gate auto-requests |
| Doc debt re-accrues behind `-h` | CI gate: every new flag ships with a doc example, checked nightly |
| Safety friction creeps into the common path | Friction only at destructive/high-cost moments (Section 6) |
| Competitive window closes | Compress Now; parallelize identity + schema work; MCP-in-binary beta in Next |

**Open questions:** Pricing API's handling of regional/committed-use rates (Billing); schema-versioning scheme — semver in URL, header, or envelope (Platform API); where `doctl ask` inference runs (DO AI Platform); rollback model for irreversible ops like a destroyed Droplet (Compute); whether to rename `gradient` for discoverability (CLI + Docs); how to serve non-developer CLI users, an underexplored segment (PM + Research).

## 11. Dependencies

1. **Billing** — public, regional-aware pricing endpoint (blocks Now).
2. **Platform API** — schema versioning + stdout/stderr/exit-code contract (blocks Now/Next).
3. **Identity** — scoped, short-lived token type + audit trail (blocks Next).
4. **DO AI Platform** — inference endpoint contract for `doctl gradient` chat/invoke and `doctl ask` (blocks Later).
5. **Docs** — reference audit + nightly accuracy checks (parallel with Now).
6. **App Platform / GitHub** — GitHub OAuth initiable from the CLI so `apps create --from-repo` completes without a browser hop (blocks the Now App Platform deliverable).
