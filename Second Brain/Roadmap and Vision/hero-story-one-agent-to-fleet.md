---
title: Hero story — One agent, one token, one bad afternoon
owner: Vikranth Alapati, API PM (DevEx & Tokens)
status: draft
last_updated: 2026-08-24
audience: ELT/SVP review; working session with Security, IAM, Accounts, Billing
companion: hero-story-thousand-agents.md
---

# One agent, one token, one bad afternoon

The companion story opens at a thousand agents. This one opens at one, today, on a single documented incident, then grows. The same four questions run through every stage: who acted, what changed, what it cost, how to stop it.

---

## Stage 1 — One agent, today

*The documented fact here: a builder's monthly bill rose roughly sixfold after an AI coding tool provisioned infrastructure unsupervised. The afternoon around it is illustrative.*

A developer needs an environment stood up and hands the job to an AI coding tool. What she gives it is a personal access token, the static credential such a tool takes by default — the same token that governs her Droplets, Kubernetes clusters, and inference calls.

The tool does the job, and more. It provisions, unsupervised, and no one reviews a step. Her bill rises roughly sixfold. The documented outcome tells us what the control model was missing: nothing in the grant bounded the task or its spend.

The agent could make the change; what breaks is the workflow around it. In recent workflow testing, no participant finished the core benchmark journeys on the CLI alone; they fell back to the Control Panel or gave up. Audit logging is a named gap, so who acted and what changed has to be reconstructed, and teams already go outside DigitalOcean for the log and trace access that would show the work end to end. Nothing caps the task's spend or revokes its authority alone. A platform team cannot approve what it cannot see, bound, or stop.

The agent was not malicious; it did what it was asked. DigitalOcean could not answer the four questions any company answers about its employees: who acted, what changed, what it cost, how to stop it.

The credential is why all four fail at once. Scoped PATs improved permission granularity, so this is not a story about excess permissions. Even a well-scoped one is the wrong shape for an agent: long-lived, so it outlives the task; person-shaped, so every action resolves to her and nothing narrower; tied to no task or purpose, so nothing about it ended when the job did. Behind it, no lifecycle control worth the name.

One developer, one agent, one token. This does not need a fleet to be true. It is true at a scale of one.

---

## Stage 2 — One agent you can approve (Now, Q3, and Next, Q4)

Now is Q3 and committed once capacity is confirmed; Next is Q4 and depends on Q3 evidence.

Run the same afternoon with what the roadmap funds. In Q3 the tool never holds her credential. Through the agentic interface — MCP is the protocol, not the product — it authorizes and receives per-action scopes, so what it may do is a property of the task, not of whoever handed it the keys. The Audit Logs API and spend visibility with budget alerts answer the first three questions while the work is still happening rather than at the invoice: who acted, what changed, what it cost. None of this displaces the Control Panel. Headless UX means a Control Panel action is also available programmatically where security, legal, and payment constraints allow.

In Q4 the grant stops being permanent. Short-lived delegated credentials give the agent something that expires with the task instead of something it keeps. Log streaming and OpenTelemetry-compatible tracing arrive alongside them, so the work can be followed end to end. And the fourth question gets an answer with a name in the plan: **emergency revoke**. Not undo — the roadmap does not offer to reverse what an agent already did. It offers to bound it, see it, and stop it, which administrators running more than 10,000 active tokens have no practical way to do today.

---

## Stage 3 — Many agents, and agents calling agents (Later, directional)

Scale enters only now, and only as a direction. The roadmap observes agents becoming principals as well as users. Everything after that is hypothesis.

Later, an agent would be a named machine principal rather than a comment on a token: owned, attributable, held to a budget, and cut off by a circuit breaker.

That is the plain answer to agent-to-agent. When one agent hands work to another, authority only narrows — the second receives less than the first held, for less time, and the chain stays visible. We are not claiming an H2 product. The roadmap gates this: it builds on token governance and short-lived credentials, and demand has to be validated first. Per-agent budgets further depend on near-real-time spend attribution we have not confirmed exists. Until it does, ceilings stay coarse.

This is not only a customer hypothesis. DigitalOcean's own Agent Harness specification already requires a credential vault to broker scoped, single-use handles so an agent pod never sees a raw secret, and records agent-to-agent handoff without creating a child principal or a narrower grant. The authority gap is internal too.

| Stage | Unit of authority | Horizon |
|---|---|---|
| 1 | A person's token | Today |
| 2 | A bounded, expiring grant | Now (Q3) and Next (Q4) |
| 3 | A named machine principal | Later, gated |

---

## Where this grows next

- **Replace the illustrative developer with a real one.** Unlocked by the 8–12 Scaler discovery sessions, testing whether platform leads think in agents or tokens.
- **Make the principal concrete.** Unlocked by an IAM decision that a machine principal is a first-class object distinct from a user, with the token as a binding, not the identity.
- **Give Stage 3 a real ceiling.** Unlocked by Billing confirming whether spend attribution can be enforced near-real-time. If not, per-agent budgets stay out.
