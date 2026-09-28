# Private preview launch and OAR checklist

Interim coordinator: `Vikranth Alapati`
OAR approver/driver: `[OAR_DRI]`
Initiative Jira key: `APICLI-4924`
Delivery epic: `APICLI-4925`
Coordination task: `APICLI-5119`
Target launch: `[START_DATE]`
Final approver: `[GO_NO_GO_OWNER]`

Use this checklist to populate the official Private Preview OAR cloned from [OAR-1](https://do-internal.atlassian.net/browse/OAR-1). This file does not replace OAR approval.

## Scope and release contract

- [ ] Customer-facing release name approved: `[CUSTOMER_FACING_NAME]`
- [ ] Included commands/behaviors listed: `[SCOPE_LINK]`
- [ ] Excluded commands/known limitations listed: `[LIMITATIONS_LINK]`
- [ ] Packaging and install channel approved: `[RELEASE_CHANNEL]`
- [ ] Access-control mechanism approved and tested: `[GATING_MECHANISM]`
- [ ] Stable and preview versions can coexist or rollback is verified: `[EVIDENCE_LINK]`
- [ ] Supported operating systems and install methods documented: `[SUPPORTED_INSTALL_METHODS]`
- [ ] Stable machine-readable output contract verified
- [ ] Interactive behavior has a non-interactive automation path

## Breaking-change control

- [ ] API/CLI owner approved `[NOTICE_PERIOD]` and `[REMINDER_PERIOD]`
- [ ] Legal approved the notice and consent language
- [ ] Every breaking change has an owner and affected-command inventory
- [ ] Migration guide contains old/new examples and exact update commands
- [ ] Preview release notes identify breaking changes explicitly
- [ ] Release is blocked until notices are sent and migration steps are tested
- [ ] Default behavior cannot flip with unresolved severity-one or severity-two migration defects

## Reliability and rollback

- [ ] Preview environment represents the production path closely enough for end-to-end validation
- [ ] Pre-release end-to-end suite passes: `[TEST_EVIDENCE]`
- [ ] Post-release smoke suite is defined: `[SMOKE_TEST_LINK]`
- [ ] Rollback owner and command are documented: `[ROLLBACK_OWNER_AND_COMMAND]`
- [ ] Rollback was rehearsed on `[DATE]`: `[EVIDENCE_LINK]`
- [ ] Dashboards cover adoption, command failures, latency, and version mix: `[DASHBOARD_LINK]`
- [ ] Alerts and thresholds are documented: `[ALERT_LINK]`
- [ ] Incident and bug workflows are approved for Private Preview
- [ ] A release freeze/pause applies during active major incidents

## Support readiness

- [ ] Support advocate assigned: `[SUPPORT_DRI]`
- [ ] [Support one-pager](support-one-pager.md) reviewed and published internally
- [ ] Dedicated internal channel created: `[INTERNAL_CHANNEL]`
- [ ] Customer feedback/support route created: `[CUSTOMER_ROUTE]`
- [ ] Escalation owner and engineering backup named
- [ ] Support hours and response expectation approved
- [ ] Known limitations, safe statements, and troubleshooting steps validated
- [ ] Ticket tags/routing and weekly support-volume report configured

## Cohort and consent

- [ ] Data owner reviewed [active-user-cohort.sql](active-user-cohort.sql)
- [ ] Product/Research approved eligibility and exclusion criteria
- [ ] Customer Success validated every selected account
- [ ] Duplicate parent accounts removed
- [ ] Every account has one named internal owner
- [ ] Legal approved terms and written-consent mechanism
- [ ] Campaign Operations ticket created: `[EMAILMKTG_KEY]`
- [ ] Final recipient list is stored only in `[APPROVED_SYSTEM]`
- [ ] Consent captured before access enablement

## Go/no-go

Record one decision for every area; unresolved items are no-go.

- Product scope and claims: `[GO_OR_NO_GO]` — `[APPROVER]`
- Engineering and migration: `[GO_OR_NO_GO]` — `[APPROVER]`
- Security: `[GO_OR_NO_GO]` — `[APPROVER]`
- Legal and consent: `[GO_OR_NO_GO]` — `[APPROVER]`
- Support: `[GO_OR_NO_GO]` — `[APPROVER]`
- Campaign Operations: `[GO_OR_NO_GO]` — `[APPROVER]`
- Data and measurement: `[GO_OR_NO_GO]` — `[APPROVER]`
- Resiliency/OAR: `[GO_OR_NO_GO]` — `[APPROVER]`

Final decision: `[GO_OR_NO_GO]`
Decision time: `[TIMESTAMP]`
Decision owner: `[GO_NO_GO_OWNER]`

## Launch sequence

1. Enable `[INTERNAL_TEST_GROUP]`.
2. Verify install, authentication, representative commands, structured output, errors, and rollback.
3. Enable the first `[WAVE_ONE_SIZE]` consented customers.
4. Observe for `[WAVE_OBSERVATION_PERIOD]`.
5. Continue, pause, or roll back based on `[HEALTH_THRESHOLDS]`.
6. Enable later waves only after the final approver records a go decision.
