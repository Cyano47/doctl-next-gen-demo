---
title: Hero story — A thousand agents, one kill switch
owner: Vikranth Alapati, API PM (DevEx & Tokens)
status: draft
last_updated: 2026-08-24
audience: ELT demo narrative; working session with Security, IAM, Accounts
companion: digitalocean-devex-strategy-roadmap-elt.md
grounded_in: "DigitalOcean DevEx — Strategy & Roadmap (Now/Next/Later), July 2026"
---

# A thousand agents, one kill switch

The customer is the hero. DigitalOcean is the lightsaber. The story we want ELT to repeat is this:

> When a customer has a thousand agents, the product is not more tools. The product is the ability to issue, bound, attribute, and kill machine authority the way they already do for employees.

That future is Later as a shipped product. It is Now as a design constraint on tokens, the agentic interface, and the teams we build with.

---

## 1. The customer's world in 18 months

Harborline is a composite customer, not an account. Every fleet and team number below is an illustrative demo prop, and should be said out loud as one.

The premise is not illustrative. The roadmap states it: agents are becoming principals as well as users, a transition evidenced by the rising volume of agentic-interface requests. Scaling that to a thousand-agent fleet is a hypothesis, not an observation.

Harborline runs inference as the product and DigitalOcean as the cloud. Everyone who needs the Control Panel still uses it, and nothing here takes it away from them. The agent fleet is net-new work that never had a surface of its own: roughly 1,200 agents (illustrative) running nightly backups, cost-rightsizing, eval loops, on-call triage, and agents that call other agents. It arrived with no identity model at all.

Priya Chen is Head of Platform. She wants the four questions she already asks about employees.

1. Who is this agent, and which team owns it?
2. What is it allowed to do, for how long, and at what spend?
3. What did it just change, and what did that cost?
4. Can I stop this one, this team, or this class of work without rotating every human credential?

Today she cannot answer any of them. The documented condition behind that is credential sprawl: the roadmap records organizations already managing more than 10,000 active tokens without adequate inventory, attribution, rotation, or emergency revocation. Illustratively, Harborline's agents inherit whatever long-lived credentials were nearest to hand — developer tools, CI, internal harnesses — with no record of which agent holds which.

**The documented incident, in the roadmap's own words:** a builder's monthly bill rose roughly sixfold after an AI coding tool provisioned infrastructure unsupervised. That is the whole of the DigitalOcean evidence. The roadmap does not give an account name, a dollar amount, the product or resource involved, how long it ran, or a timestamp, so this story does not either.

**The illustrative scene built on it:** the sixfold month surfaces on a Friday afternoon, when someone finally reads the bill. Security cannot name the agent. IAM cannot see a principal. Accounts cannot say which team paid. The only remedy is rotate every credential and take the weekend down.

That Friday — where the only kill switch is "rotate everything" — is the five-second moment. The demo is the same Friday, after the machinery exists.

### The agent succeeds. The operating workflow does not.

This is the sharp version of the problem. The failure is not that agents cannot call us. They can. The failure is what the customer cannot do afterwards.

1. **Finishing.** In workflow testing, no participant completed our core benchmark journeys using the CLI alone; they fell back to the Control Panel or gave up. A person can do that. An agent hitting the same seam cannot ask for help.
2. **Proving.** Security leaders in enterprise accounts tell us audit logging gates their compliance sign-off, and with it their ability to expand. Even when a change lands correctly, Priya cannot reliably prove who acted and what changed. The Audit Logs API is Now / Q3 — the gap it closes, not one we have closed.
3. **Seeing.** Teams already run observability outside DigitalOcean, then ask us for the log and trace access that would bring it back. Log streaming and OpenTelemetry-compatible tracing are Next / Q4. Today an agent's work is visible mainly where the customer pays someone else to look.
4. **Bounding and stopping.** Cost is not bounded per caller, and task-scoped authority cannot be emergency-revoked, because the authority is a person's long-lived token. Spend visibility and budget alerts are Now / Q3. Delegated credentials and emergency revoke are Next / Q4.

The agent works, and the company still cannot operate, prove, see, or stop it. That is the gap.

---

## 2. What good feels like

Priya opens one view: the agent registry — Later, and gated by the roadmap on validating customer demand first. What follows is the job it has to do, not a Q3 screen.

She issues an agent the way she issues a laptop.

1. **Name it.** `nightly-backup`, owned by Team Data, purpose "snapshot production Postgres."
2. **Bound it.** A 30-minute credential, `droplet:read` and `backup:write`, no inference, a $50 ceiling, no destroy.
3. **Attribute it.** The job runs, and one audit line answers all four questions: who acted, what changed, what it cost, and how to stop it.
4. **Delegate it.** When the backup agent needs an eval run, it mints a narrower grant for `eval-runner` — inference only, $10, ten minutes. The chain is visible: Priya → `nightly-backup` → `eval-runner`.
5. **Stop it.** `eval-runner` approaches $10 and a circuit breaker pauses it. Priya can emergency-revoke Team Data's agents (84, illustrative) in one action. No human credential is touched.

She grants production access to automation the way she grants it to a new hire: scoped, time-boxed, attributable, and reversible. That is the inference-cloud difference. The Control Panel is still there, unchanged, for everyone who works in it. What changes is that the fleet stops running on their tokens.

---

## 3. The authority substrate

Your lane is how a machine is allowed to call DigitalOcean, how that call is attributed, and how it is stopped — not the agent runtime, the human identity provider, or the bill. You own the thing in the middle that makes a thousand agents a fleet instead of a leak.

| Capability | What it gives Priya | Horizon |
|---|---|---|
| Scoped agent access | Per-action scopes, and only the tools the task needs, on the agentic interface (MCP is the protocol) | Now |
| Audit | Who acted, on whose behalf, what changed, and what it cost | Now |
| Spend visibility and budget alerts | Cost has a line and a warning | Now |
| Short-lived delegated credentials | An agent never holds a person's long-lived token | Next |
| Emergency revoke | Stop one agent, one team, or every machine grant, without touching human access | Next |
| Machine principals | A named machine identity, not a token with a comment | Later, gated |
| Narrowing delegation | Agent-to-agent, where authority can only shrink | Later, gated |
| Circuit breakers and per-agent budgets | A ceiling that pauses rather than reports | Later, gated |

Two honest limits. **Undo is not in the promise set:** Q4 commits dry-run or plan mode, idempotency, predictable retries, and agent-safe quotas, not a rollback. And **Later means Later:** the roadmap gates machine principals, per-agent budgets, and circuit breakers on validating customer demand first.

Priya already understands employees, laptops, and offboarding. The form factor is that **an agent looks like an employee in the access model** — tokens become an implementation detail, the way a password hash is an implementation detail of a user.

---

## 4. What we cannot decide alone

Four decisions, one per partner team. The rest is sequencing.

1. **IAM — the machine principal.** IAM owns who a principal is; you own what credential that principal may present. The decision: an agent principal is a first-class object, distinct from a human user, and a token is a binding rather than an identity. This is the one hard dependency, needed before Q4 delegated credentials lock.
2. **Security — audit semantics and revoke policy.** You ship the Audit Logs API in Q3, so audit is not a dependency. The open question is which fields Security accepts as sufficient in a live incident and for compliance sign-off — actor, on-behalf-of, delegation chain, action, resource, cost, credential ID — and who co-owns the emergency-revoke runbook.
3. **Billing — enforceable attribution.** You ship spend visibility and budget alerts in Q3. The open question is genuinely unresolved: is attribution near-real-time enough to *enforce* a per-agent ceiling, or only to report against it? If only reporting, per-agent budgets stay Later, coarse team and project ceilings are what we claim, and we say so.
4. **Accounts — machine ownership.** Team and project must attach to a machine credential, not only to a human. Offboarding a person must transfer or pause the agents they minted, never silently orphan them.

**Who does this work.** Holding four partner teams to one schema across three quarters is not a ticket. The roadmap notes the team consists primarily of IC2s and would benefit from adding a senior IC or Engineering Manager to drive systemic thinking and execution. This is that work.

---

## 5. Press release (working backwards)

**Headline.** DigitalOcean lets enterprises treat agents like employees: named, scoped, budgeted, and offboarded in one action.

**Solution.** Every agent is a named principal with a short-lived credential, a team owner, a purpose, a spend ceiling, and an audit trail. Agents may delegate a narrower grant to other agents. A platform lead can pause or revoke one agent, one team, or a class of work without rotating human access.

**Customer quote.** "Friday used to mean find the token. Friday now means revoke `eval-runner`. The rest of the company kept working." — Priya Chen, Head of Platform, Harborline

---

## 6. FAQ ELT will ask

1. **Is this an H2 commitment?** No. The fleet product is Later. H2 ships the primitives that do not block it: scoped access, audit, spend visibility, token governance, and short-lived delegated credentials. "Agent registry" does not go into Now.
2. **Is this Gradient-only?** No. The same credentials govern Droplets, Kubernetes, and inference. Inference is why the story is urgent; the control plane is the whole cloud.
3. **Why isn't this IAM's product?** IAM owns the principal. You own the credential and the enforcement points on the programmatic surfaces. Neither works if the other treats agents as a comment on a token.
4. **What if we cannot attribute spend in real time?** Then per-agent budgets stay Later. We still ship spend visibility and revoke on credentials. We do not pretend to a ceiling we cannot enforce.

---

## 7. ELT demo — ten minutes, eight beats

Arrow, said at the top and again at the end: *issue, bound, attribute, kill — like employees.* Start in the middle of the action. Priya is the hero; we are the lightsaber.

| Beat | Clock | What they see | What it proves |
|---|---|---|---|
| 1. The incident | 0:00–1:30 | A roughly sixfold bill. A credential list with no names. | Today is ungovernable at fleet scale. |
| 2. What still breaks | 1:30–2:30 | The change succeeded. Nobody can prove who did it, see it, or stop it. | The gap is operating, not calling. |
| 3. The registry | 2:30–3:30 | Roughly 1,200 named agents — illustrative — with owners, last-seen, spend. | Identity is the product. |
| 4. Issue and bound | 3:30–5:00 | Mint `nightly-backup`: 30 minutes, two scopes, $50, no destroy. | Scoped, short-lived authority, not a copied token. |
| 5. Attribute | 5:00–6:30 | One audit line: who acted, what changed, what it cost. | The answer Security needs in an incident. |
| 6. Delegate | 6:30–8:00 | `nightly-backup` mints `eval-runner` with a narrower grant. The chain is visible. | An agent-to-agent stance without an H2 product claim. |
| 7. Stop | 8:00–9:00 | A circuit breaker pauses `eval-runner`. Emergency-revoke Team Data's agents. Humans stay logged in. | The five-second moment. |
| 8. The ask | 9:00–10:00 | One slide, one decision. | ELT decides rather than agrees in principle. |

**Beat 8, in full.** Fund and staff the authority substrate, and name an accountable partner in IAM, Security, Billing, and Accounts. The roadmap carries the dated asks and the funding detail; the decision this demo needs is who owns the authority model, because today nobody does.

### What you must not demo

1. A large tool catalog as the win.
2. MCP as the product name. Say agentic interface. MCP is the protocol.
3. Console displacement. Everyone who works in the Control Panel keeps it. The fleet is net-new work that never had a surface.
4. Undo. Q4 commits dry-run or plan mode, idempotency, predictable retries, and agent-safe quotas, not a rollback.
5. A live agent-to-agent product if the grant is a hardcoded token. Fake the registry if you must. Do not fake the narrowing.

---

## 8. Monday

1. **Write the joint one-pager with IAM, Security, Billing, and Accounts.** Title it "Agent principal, credential, team, audit." If those four words do not have owners, the hero story is fiction.
2. **Design emergency revoke now**, even if it first ships as revoke-by-team in Next. The Friday story dies if revoke still means "rotate everything."
3. **Carry one question into the Scaler discovery sessions the roadmap already asks ELT to fund:** is "agent as employee" how platform leads talk, or do they still think in tokens? If tokens, the form factor is token governance with owner and last-used, and the registry is the later skin.

The vision is Priya's Friday. The strategy is trust before autonomy. The plan is the substrate already written into Now / Next / Later.

---

## 9. Sources and open divergences

Grounded in **DigitalOcean Developer Experience: Strategy & Roadmap (Now / Next / Later), July 2026**, including its reviewer comments. Two divergences with the August rewrite `digitalocean-devex-strategy-roadmap-elt.md` need reconciling before both documents are in the same room.

1. **Undo.** The August rewrite commits undo for the last mutating operation in Next / Q4. The July roadmap does not. This story treats undo as unfunded.
2. **Segment naming.** July still uses Orca / Humpback / Blue; reviewer feedback says those terms are no longer in use and should be updated. The August rewrite uses Testers / Learners / Builders / Scalers.
