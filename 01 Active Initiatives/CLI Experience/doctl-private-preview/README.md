# Next-gen doctl private preview execution pack

Status: **selection slate prepared; customer outreach and enablement remain gated**

This package turns the documented DigitalOcean procedures into executable artifacts without inventing dates, owners, legal language, or release guarantees.

Live coordination:

- Delivery epic: [APICLI-4925 — Next-Gen Doctl, Now Phase](https://do-internal.atlassian.net/browse/APICLI-4925)
- Private-preview coordination: [APICLI-5119](https://do-internal.atlassian.net/browse/APICLI-5119)
- Parent initiative: [APICLI-4924 — Devex Product H2 2026](https://do-internal.atlassian.net/browse/APICLI-4924)
- Slack coordination: drafts for `#doctl` and `#oar` are saved in Vikranth Alapati’s Slack Drafts. They could not be attached directly because the account is not currently a member of either channel.

## What is verified

- DigitalOcean defines Private Preview as invite-only access for selected customers, normally behind a flipper: [Private & Public Previews](https://do-internal.atlassian.net/wiki/spaces/SOL/pages/1366229049/Private+Public+Previews).
- The Private Preview OAR is required for work flowing through the PDLC. Product normally drives it, with TPM or EM as alternatives: [Operational Acceptance Review Process](https://do-internal.atlassian.net/wiki/spaces/RESILIENT/pages/407156664/Operational+Acceptance+Review+Process+OAR).
- Campaign Operations owns one-time beta invitations and customer notices. Requests need a recipient list/cohort, approved copy, and a requested send date at least seven days ahead: [Product Announcement/Survey/Email Requests](https://do-internal.atlassian.net/wiki/spaces/GM/pages/2428370945/Product+Announcement+Survey+Email+Requests).
- The Public API Deprecation Process recommends impact analysis from Edge Gateway user-agent data, targeted notices to users active in the prior 90 days, public migration guidance, and customer-facing-team coordination: [Public API Deprecation Process](https://do-internal.atlassian.net/wiki/spaces/API/pages/413073935/Public+API+Deprecation+Process).
- Recent DO previews collected written consent by email/form, assigned individual customer owners, and used direct onboarding plus a dedicated support channel: [consent precedent](https://digitalocean.enterprise.slack.com/archives/C0ANP6CE7SQ/p1787606844624099), [owner precedent](https://digitalocean.enterprise.slack.com/archives/C0BNVF7511D/p1788387535570739).
- The current product documents require additive changes where possible, migration guidance before defaults change, stable `--format` behavior during the current milestone, and Support readiness before an opt-in release/default flip: [PRD](../doctl-next-gen-prd-v4.0.md), [GTM plan](../doctl-next-gen-gtm-v2.0.md).

The API deprecation page was last updated in 2022. Its three-month default is **not treated here as approved doctl policy**. API/CLI and Legal must set `[NOTICE_PERIOD]`.

## Cohort result

The approved discovery screen uses three behavioral cohorts:

- Power Automators: sustained, concentrated, low-variation request activity.
- Power Users: frequent use across at least five product families with write activity.
- AI Users: repeated doctl activity against validated AI product families.
- Prior research participants are added for review, but are not treated as telemetry-qualified unless they meet the same activity checks.

The review pool retains the top 10 parent-deduplicated candidates per telemetry cohort. A six-participant wave-one review slate and six named-owner backups are conditionally approved. No candidate is activation-ready until owner, Support, workflow, compatibility, preview-consent, feedback, and rollback gates are closed.

Review the controlled customer list in the [doctl private-preview cohort Canvas](/Users/valapati/.cursor/projects/Users-valapati-Documents-Cursor-Projects-01-Active-Initiatives-CLI-Experience/canvases/doctl-private-preview-cohort.canvas.tsx). See [selection-rules.md](selection-rules.md), [candidate-validation-and-wave.md](candidate-validation-and-wave.md), and [stratified-user-cohort.sql](stratified-user-cohort.sql).

Latest 30-day refresh, through 2026-09-26:

- 29,660 accounts used doctl.
- 27,081 remain after excluding non-billable, free-employee/internal, admin, abuse, suspended, hold, and archived accounts.
- Six accounts are recommended for owner review across automation, broad power-user, and AI workflows.

Review the refresh in the [30-day cohort Canvas](/Users/valapati/.cursor/projects/Users-valapati-Documents-Cursor-Projects-01-Active-Initiatives-CLI-Experience/canvases/doctl-private-preview-30d.canvas.tsx) and rerun [active-user-cohort-30d.sql](active-user-cohort-30d.sql).

The expanded [top-100 ranked Canvas](/Users/valapati/.cursor/projects/Users-valapati-Documents-Cursor-Projects-01-Active-Initiatives-CLI-Experience/canvases/doctl-private-preview-top-100.canvas.tsx) combines latest available monthly net billing with 30-day doctl usage. Reproduce it with [active-user-cohort-100-ranked.sql](active-user-cohort-100-ranked.sql).

## Governance record

Known:

- Product Lead: Vikranth Alapati, from the current PRD.
- Interim coordinator for every currently unassigned workstream: Vikranth Alapati, by owner decision on 2026-09-15. Interim coordination does not substitute for Legal, Support, Resiliency, Data, Research, PMM, or Engineering approval.
- Delivery epic assignee: Shivani Sharma, from APICLI-4925. Confirm whether she is also the release Engineering DRI.

Required before launch:

- Engineering DRI: `[ENGINEERING_DRI]`
- TPM/OAR driver: `[OAR_DRI]`
- PMM/Campaign Operations partner: `[PMM_DRI]`
- Support advocate: `[SUPPORT_DRI]`
- Legal reviewer: `[LEGAL_DRI]`
- Research DRI: `[RESEARCH_DRI]`
- Data reviewer: `[DATA_DRI]`
- Final go/no-go owner: `[GO_NO_GO_OWNER]`

## Release boundary requiring approval

- Customer-facing name: `[CUSTOMER_FACING_NAME]`. “Next-gen doctl” is an internal program name in the PRD.
- Preview dates: `[START_DATE]` to `[END_DATE]`.
- Packaging: `[SEPARATE_BINARY_OR_RELEASE_CHANNEL]`.
- Access control: `[GATING_MECHANISM]`.
- Supported OS/install methods: `[SUPPORTED_INSTALL_METHODS]`.
- Support hours and response expectation: `[SUPPORT_BOUNDARY]`.
- Compatibility guarantee: `[COMPATIBILITY_GUARANTEE]`.
- Stable rollback version and command: `[ROLLBACK_VERSION_AND_COMMAND]`.
- Initial and reminder notice periods: `[NOTICE_PERIOD]` and `[REMINDER_PERIOD]`.
- Consent terms and mechanism: `[LEGAL_APPROVED_TERMS_AND_CONSENT]`.

Until these values are approved, customer outreach and preview enablement remain blocked.

## Artifacts

- [Comparable DigitalOcean precedents](precedents.md)
- [Approved selection rules](selection-rules.md)
- [Latest 30-day cohort query](active-user-cohort-30d.sql)
- [Top-100 billing and usage ranking](active-user-cohort-100-ranked.sql)
- [Stratified cohort query](stratified-user-cohort.sql)
- [Candidate validation and wave handoff](candidate-validation-and-wave.md)
- [Original broad cohort query](active-user-cohort.sql)
- [Launch and OAR checklist](launch-checklist.md)
- [Support one-pager](support-one-pager.md)
- [Customer and internal communication templates](communications.md)
- [Measurement and operating cadence](operations.md)

## Safe execution order

1. Product, Data, Research, Support, and Customer Success approve the cohort rules and candidate accounts.
2. Assign an internal owner to every approved account.
3. API/CLI and Legal approve release packaging, compatibility, terms, and notice periods.
4. Clone the Private Preview OAR from [OAR-1](https://do-internal.atlassian.net/browse/OAR-1), link it to [APICLI-5119](https://do-internal.atlassian.net/browse/APICLI-5119), assign tasks, and obtain Resiliency approval in [#oar](https://digitalocean.enterprise.slack.com/archives/C8244GW3C).
5. Complete and rehearse rollback, migration, monitoring, and escalation.
6. Brief Support and publish the support one-pager internally.
7. Submit the Campaign Operations request at least seven days before `[SEND_DATE]`.
8. Obtain written consent before enabling access.
9. Close every gate for the conditionally approved six-participant wave-one slate, then enable one consented account at a time; do not enable the full cohort at once.
10. Run the weekly review and breaking-change notification process in [operations.md](operations.md).
