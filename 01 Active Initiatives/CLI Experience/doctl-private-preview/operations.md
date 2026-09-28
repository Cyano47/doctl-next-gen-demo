# Private preview operations

Owner: `[OPERATIONS_DRI]`
Dashboard: `[DASHBOARD_LINK]`
Internal channel: `[INTERNAL_CHANNEL]`
Feedback system: `[APPROVED_FEEDBACK_SYSTEM]`

## Measurement definitions

Instrument and report these measures by account and preview version:

- **Invite acceptance:** consented accounts / invited accounts
- **Activation:** consented accounts completing `[FIRST_SUCCESS_EVENT]`
- **Time to first success:** elapsed time from preview enablement to first successful target workflow
- **Weekly active use:** accounts with at least `[MIN_WEEKLY_COMMANDS]` preview commands in a calendar week
- **Retained use:** activated accounts active in week four
- **Upgrade completion:** affected active accounts observed on `[REQUIRED_VERSION]` before the breaking-change deadline
- **Task success:** completed target workflows / attempted target workflows
- **Automation breakage:** workflows failing because of an incompatible command, flag, output, prompt, or exit-behavior change
- **Fallback:** workflows requiring stable doctl or the Control Panel
- **Support rate:** preview-attributed tickets / weekly active preview accounts
- **Severe incidents:** severity-one/two incidents attributable to preview behavior
- **Qualitative feedback:** findings grouped by workflow, severity, frequency, and customer outcome

Do not set numeric success thresholds after observing results. Approve these before launch:

- Minimum activation: `[ACTIVATION_THRESHOLD]`
- Minimum four-week retention: `[RETENTION_THRESHOLD]`
- Minimum task success: `[TASK_SUCCESS_THRESHOLD]`
- Maximum support rate: `[SUPPORT_RATE_THRESHOLD]`
- Maximum breaking-change failures: `[BREAKAGE_THRESHOLD]`
- Severe security/policy incidents: `0`
- Referenceable participants required for the relevant GA motion: `[REFERENCE_THRESHOLD]`

## Weekly operating review

Cadence: `[DAY_AND_TIME]`
Facilitator: `[OPERATIONS_DRI]`

Required attendees:

- Product
- Engineering
- Support
- Research
- Data
- Customer Success
- PMM
- Security/Legal when scope or terms change

Agenda:

1. Cohort changes, consent status, and owner coverage
2. Activation, retained use, task success, fallback, and version adoption
3. Support volume, incidents, and highest-severity feedback
4. Upcoming releases and migration notices
5. Account-by-account blockers and owner actions
6. Decision: continue, revise, pause, roll back, or expand

Record decisions in `[DECISION_LOG]` with owner and due date.

## Breaking-change gate

No breaking preview release proceeds until all items are true:

- Affected behavior and accounts are identified.
- Additive or backward-compatible alternatives were considered.
- Product and Engineering approved the need for the break.
- API/CLI and Legal approved the effective date and notice period.
- Migration guide, release notes, exact update commands, validation, and rollback/workaround are published.
- Support received the one-pager update and tested the response path.
- Initial customer notice was sent `[NOTICE_PERIOD]` ahead.
- Reminder was sent `[REMINDER_PERIOD]` ahead.
- Named owners directly contacted managed/VIP accounts.
- Pre-release end-to-end and migration tests passed.
- Rollback was rehearsed and remains available.
- No active major incident or release freeze blocks the rollout.
- `[GO_NO_GO_OWNER]` recorded approval.

After release:

1. Run `[POST_RELEASE_SMOKE_SUITE]`.
2. Monitor `[DASHBOARD_LINK]` for `[OBSERVATION_PERIOD]`.
3. Contact accounts with failed migrations or old versions.
4. Roll back when `[ROLLBACK_THRESHOLD]` is reached.
5. Publish an internal outcome update in `[INTERNAL_CHANNEL]`.

## Feedback workflow

For each approved participant:

1. Assign one owner.
2. Confirm first-use date and target workflow.
3. Follow up on `[FEEDBACK_DAY]`; recent DO precedent used approximately day five.
4. Tag findings by command family and problem type.
5. Link evidence without copying secrets or customer content.
6. Confirm whether the participant is willing to discuss public referenceability; obtain separate approval before any public use.

## Expansion criteria

Expand only when:

- OAR remains approved and operational health is within thresholds.
- All current participants have an owner.
- Support capacity is available for the next wave.
- Migration and update completion meet the approved threshold.
- Severe security/policy incidents remain at zero.
- The weekly review records a go decision and next-wave size `[NEXT_WAVE_SIZE]`.

## Pause or stop criteria

Pause enrollment or releases when any of these occurs:

- unresolved severity-one or severity-two migration defect
- security, privacy, policy, or credential-handling incident
- rollback is unavailable or fails
- customer notices did not reach affected accounts
- support demand exceeds `[SUPPORT_RATE_THRESHOLD]`
- preview scope diverges from approved terms or claims
- active major incident or incident commander requests a pause

Stopping the preview requires:

- customer notice and effective date
- stable migration/rollback instructions
- access-disable plan
- retention/deletion treatment for preview data
- Support and Customer Success briefing
- final feedback and incident review
