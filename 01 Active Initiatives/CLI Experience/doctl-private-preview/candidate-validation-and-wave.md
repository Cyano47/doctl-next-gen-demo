# Candidate validation and wave-one handoff

Date: 2026-09-22
Decision owner: Vikranth Alapati
Customer-identifying review surface: [doctl private-preview cohort Canvas](/Users/valapati/.cursor/projects/Users-valapati-Documents-Cursor-Projects-01-Active-Initiatives-CLI-Experience/canvases/doctl-private-preview-cohort.canvas.tsx)

This document records the completed evidence review and the gates that remain before customer contact. The Canvas contains the controlled candidate-level slate; do not copy it into GitHub or broadly accessible documents.

## Validation completed

### Data

- reran and validated the stratified cohort logic against current Snowflake schemas
- selected the top 10 Power Automators, top 10 Power Users, and top 10 AI Users
- deduplicated each cohort by ultimate customer parent
- preserved overlap between cohorts to show behavioral depth
- joined account ownership, support plan, support health, and account-state context

### Customer Success

- identified named human owners for every wave-one and backup candidate
- prioritized candidates with an existing CSM relationship
- held telemetry-defined AI candidates whose apparent owner was unassigned or a system account
- treated owner presence as a contactability signal, not approval to contact

### Support

- reviewed available account support health and account-state fields
- excluded the red-health account from wave one
- classified the yellow-health account as ready only with mitigation
- retained unknown-health accounts only as backups pending explicit Support review
- confirmed reviewed accounts were not marked abuse, suspended, or hold in the available account record

The account-level support-ticket count is not a substitute for checking open cases and escalations. That check remains mandatory immediately before invitation.

### Engineering

- classified Power Automators as highest risk for formatting, parsing, pipe, polling, and exit-code regressions
- classified broad Power Users as highest risk for cross-product inconsistency and name/ID behavior
- classified AI Users as the primary group for agent discovery, command description, permissions, and structured-output feedback
- made stable doctl the rollback path for every participant
- required script capture and compatibility checks before enabling automation-heavy users

### Research

- reconciled four named prior-research participants to internal participant profiles
- confirmed interview evidence for automation, platform, and AI-builder workflows
- confirmed three profiles had recorded research consent/opt-in; one did not
- did not treat prior research consent as private-preview consent

Prior-interview screening found:

- the AI-infrastructure participant delegates doctl work to Claude Code, chains authenticated CLIs in reusable skills, and is specifically concerned about controlling agent tool calls; command semantics, confirmation, and least privilege are high-risk areas
- the AI-builder participant runs deployment and operational work primarily through CLI and values explicit control; unexpected interactive behavior would be disruptive
- the platform participant wants templated droplet creation, uses Kubernetes almost entirely through CLI, and asked for pre-execution validation; naming, batch creation, SSH-key handling, and safe dry runs are the relevant tests
- the automation participant generates a daily report from roughly 700–800 doctl, kubectl, curl, and shell commands, transforms JSON, and relies on stable identifiers and historical data; output shape, field stability, exit codes, and non-interactive behavior are release-critical

These interviews validate workflow risk and research suitability. They do not validate current doctl activity or grant private-preview consent.

Owner-validation drafts were prepared in Slack for Merrick Calder, Raph Sirvent, Aravind Anil, Srihari Prabhakar, Reetesh Singh, and Shubh Kohli. They explicitly prohibit customer contact or promises until the gates in this document are closed. Poojitha Mandava did not resolve to an active Slack profile and requires an alternate internal contact path.

## Screening script

Ask each prioritized participant:

1. Which doctl commands run interactively, in scheduled jobs, or in CI?
2. Which outputs are parsed with `grep`, `awk`, `jq`, pipes, command substitution, redirection, or custom code?
3. Which fields, whitespace, ordering, stderr/stdout behavior, and exit codes does the automation rely on?
4. Does the workflow set `CI=true`, request JSON, or detect whether stdout is a TTY?
5. Which long-running commands are polled, retried, or wrapped with timeouts?
6. Which identifiers must remain stable, and where would accepting names instead of IDs help?
7. Which NextGen behaviors would be disruptive even if they are easier for interactive users?
8. Can the participant test a representative workflow and share logs or scripts with secrets removed?
9. Who can approve preview participation and the stated data/feedback terms?
10. Can the participant revert to stable doctl immediately if a regression occurs?

Capture at least one representative example for:

- `grep` or `awk`
- a pipe or redirect
- `CI=true`
- structured output
- exit-code handling
- a long-running or polling workflow

## Decision framework

### Ready

- named human owner
- relationship and Support checks complete
- representative workflow captured
- Engineering compatibility result recorded
- preview-specific consent and feedback commitment recorded
- stable-version rollback tested

### Ready with mitigation

- all Ready criteria, plus an explicit owner and due date for the mitigation

### Hold

- any missing owner, relationship check, Support check, workflow evidence, current-activity validation, consent, or rollback

### Exclude

- ineligible account state, duplicate parent, unacceptable support or compatibility risk, no suitable workflow, or no safe rollback

## Wave decision

A six-participant wave-one review slate and six named-owner backups are conditionally approved in the Canvas.

- wave one balances two automation-heavy accounts, two broad power users, and two AI/prior-research participants
- no invitation or enablement is approved from telemetry alone
- candidates listed as Hold remain backups until their missing gate is closed
- the first participant may be enabled only after all Ready criteria are recorded
- pause the wave on a data-loss risk, credential exposure, unexpected destructive action, rollback failure, or repeated automation regression

## Handoff checklist

- [ ] Customer Success owner confirms relationship and contact
- [ ] Support confirms no open escalation or unsuitable health condition
- [ ] Research completes the screening script
- [ ] Engineering runs the participant's representative automation cases
- [ ] Product records Ready or Ready with mitigation
- [ ] Legal-approved preview terms and preview-specific consent are recorded
- [ ] stable doctl rollback is tested
- [ ] Campaign Operations receives only the approved recipient list
