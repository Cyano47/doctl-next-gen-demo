# Comparable DigitalOcean precedents

This review separates observed practice from the choices still required for doctl.

## Managed Agents / MARS Private Preview

Evidence:

- Preview client features used beta doctl/pydo releases rather than the general release: [Slack](https://digitalocean.enterprise.slack.com/archives/C0B99AP0W9X/p1784111956551809).
- The external guide was checked against live production before being sent: [Slack](https://digitalocean.enterprise.slack.com/archives/C0B4P1MPMMJ/p1787873516864499).
- The launch sequence combined terms acceptance, candidate validation, a warm introduction, a partner guide, and follow-up around day five: [Slack](https://digitalocean.enterprise.slack.com/archives/C0BQWAHBZ33/p1787205441991289).
- Private-preview consent was collected by email or form: [Slack](https://digitalocean.enterprise.slack.com/archives/C0ANP6CE7SQ/p1787606844624099).
- After generic outreach underperformed, the team narrowed to 15–20 customers, assigned one owner per account, and used personal outreach: [Slack](https://digitalocean.enterprise.slack.com/archives/C0BNVF7511D/p1788387535570739).
- The sign-up implementation stored an explicit `preview_consent` field and routed submissions to a review list: [Confluence](https://do-internal.atlassian.net/wiki/spaces/GO1/pages/3385851940/MARS+Managed+Agents+Private+Preview+Sign-up+Form+GMO-2514).

Applied to doctl:

- Use a separate beta/pre-release channel as the precedent, but do not finalize packaging until API/CLI approves it.
- Validate every install, update, and rollback instruction against the release artifact before sending.
- Start with personally owned accounts, not a broad unowned campaign.
- Capture written consent in an approved system before enabling access.

## Open Harness doctl migration notice

Evidence:

- A planned infrastructure migration told users what was changing, why, the exact UTC cutover time, the affected doctl build, the minimum replacement version, expected interruption, UI impact, and the support route: [Slack](https://digitalocean.enterprise.slack.com/archives/C0B6UC7Q44S/p1787085238702339).

Applied to doctl:

- Every breaking notice uses the same order: what, why, when, action required, no-action behavior, expected impact, tested version/command, and help.
- Do not use “brief downtime” or “works immediately” unless Engineering has measured and approved those statements.

## High Performance Spaces Private Preview

Evidence:

- The preview is not publicly promoted. Account teams and Solutions Architects identify candidates; Product and Engineering qualify workload and regional capacity; TAM/SA monitors the enabled workload: [Confluence](https://do-internal.atlassian.net/wiki/spaces/CSAS/pages/2729639940/High+Performance+Spaces+-+Private+Preview+Guide).
- Eligibility captures concrete workload characteristics, and DigitalOcean can return the customer to standard limits if preview behavior threatens shared infrastructure.

Applied to doctl:

- CLI activity alone is a discovery signal, not final eligibility.
- Customer Success, Research, Product, and Engineering validate the account’s workflow, automation risk, and supportability before enrollment.
- Access must be revocable independently of the stable doctl release.

## v5 Droplets Private Preview

Evidence:

- The preview began with four gated customers and a dedicated support channel.
- The Support one-pager documented unavailable functionality, API/UI constraints, migration limits, pricing, escalation, and the fact that preview resources did not carry into GA; customers were told to back up and delete them first: [Confluence](https://do-internal.atlassian.net/wiki/spaces/CSAS/pages/3366060085/v5+Droplets+-+Support+One-Pager).

Applied to doctl:

- Begin with a smaller first wave than the full approved cohort.
- State what does not carry forward, what can be rolled back, and what customers must preserve before a transition.
- Brief Support before enrollment.

## Product Catalog breaking-change rollout

Evidence:

- The team enumerated each breaking asset, classified the type of break, stated the user action and earliest action date, published a list of users who had accessed affected models since a fixed date, and moved the cutover when readiness required it: [Confluence](https://do-internal.atlassian.net/wiki/spaces/DNA/blog/2026/07/24/3186753555/Product+Catalog+rollout).

Applied to doctl:

- Maintain an affected-command inventory for each release.
- Generate the affected-user list from telemetry rather than emailing every doctl user.
- Treat the effective date as movable until migration readiness and approvals pass.

## Node.js Flexible Private Preview

Evidence:

- The deployment plan required QA, Design, InfoSec, Product, rollback, staffing, and deployment-checklist sign-off; gated access by a private-preview tag; sequenced deployment and validation; and separated contained preview issues from regressions affecting all users: [Confluence](https://do-internal.atlassian.net/wiki/spaces/CWENG/pages/3116367875/NodeJS+Deployment+Plan+Private+Preview).

Applied to doctl:

- Use explicit go/no-go ownership and staged enablement.
- Test that non-preview customers cannot see or invoke preview behavior.
- Roll back immediately when a regression escapes the preview boundary; do not assume a hotfix is sufficient.

## Resulting doctl rollout pattern

1. Review the eight shortlist accounts that already have named CSM ownership.
2. Select `[WAVE_ONE_SIZE]` consented accounts for the first wave.
3. Keep the remaining candidates on hold until each has a named owner and account/workflow validation.
4. Ship only through `[APPROVED_BETA_CHANNEL]`; keep stable doctl available.
5. Validate customer instructions against the exact release artifact.
6. Collect written consent, then enable access.
7. Follow up around `[FEEDBACK_DAY]`; day five is precedent, not a requirement.
8. Notify only affected active users before a breaking release.
9. Pause or move the cutover when OAR, migration, Support, or incident readiness is not green.

No precedent supports sending customer outreach, accepting terms on a customer’s behalf, or choosing release dates without named approvals. Those actions remain blocked until the placeholders in [README.md](README.md) are resolved.
