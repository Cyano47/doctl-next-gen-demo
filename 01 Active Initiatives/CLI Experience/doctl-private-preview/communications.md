# Private preview communications

Status: **draft only; Legal, Product, Support, and Campaign Operations approval required**

Replace every bracketed field before use. Do not send these templates with placeholders.

## Campaign Operations request

Create in the [Campaign Operations board](https://do-internal.atlassian.net/jira/software/c/projects/EMAILMKTG/boards/864) at least seven days before `[SEND_DATE]`.

- Request type: beta invitation and lifecycle notices
- Subject line: `[APPROVED_SUBJECT]`
- Sender name: `[NAMED_OWNER] @ DigitalOcean`
- Sender email: `[SENDER_EMAIL]`
- Reply-to: `[MONITORED_REPLY_TO]`
- Copy document: this file after approval
- Content Marketing review: `[YES_OR_NO]`
- Recipient source: `[APPROVED_CSV_OR_COHORT]`
- Personalization fields: `[FIRST_NAME / COMPANY / OWNER / OTHER]`
- Requested send date: `[SEND_DATE]`
- Test recipients: `[TEST_RECIPIENTS]`
- Legal approval: `[APPROVAL_LINK]`
- Product approval: `[APPROVAL_LINK]`
- Support readiness: `[APPROVAL_LINK]`

## Invitation

Subject: Invitation to help shape `[CUSTOMER_FACING_NAME]`

Hi `[FIRST_NAME]`,

We are inviting a small group of active doctl users to try an early, invite-only preview of `[CUSTOMER_FACING_NAME]`.

The preview focuses on `[VERIFIED_PREVIEW_SCOPE]`. Because it is a Private Preview, behavior may change, including commands, flags, output, prompts, and exit behavior. We will explain known limitations before you enroll and provide advance notice before approved breaking preview changes.

We are looking for participants who can:

- try `[TARGET_WORKFLOWS]`
- share feedback through `[FEEDBACK_METHOD]`
- join `[NUMBER]` short feedback conversations during `[PREVIEW_PERIOD]`

Support is available through `[SUPPORT_ROUTE]` during `[SUPPORT_HOURS]`. You can stop participating at any time and return to stable doctl using `[APPROVED_ROLLBACK_SUMMARY]`.

If you are interested, review `[LEGAL_APPROVED_TERMS_LINK]` and provide written consent through `[CONSENT_MECHANISM]` by `[RESPONSE_DATE]`.

This invitation does not enable access automatically. The team will confirm enrollment and send installation instructions separately.

Thanks,
`[NAMED_OWNER]`
`[TEAM / ROLE]`

## Enrollment and onboarding

Subject: Your `[CUSTOMER_FACING_NAME]` Private Preview access

Hi `[FIRST_NAME]`,

Your account `[ACCOUNT_REFERENCE]` is approved for the Private Preview from `[START_DATE]` through `[END_DATE]`.

Before installing:

1. Review the scope and known limitations: `[PREVIEW_GUIDE]`.
2. Back up any configuration affected by `[KNOWN_CONFIG_CHANGE]`.
3. Confirm that stable doctl `[STABLE_VERSION]` is available using `[ROLLBACK_COMMAND]`.
4. Do not move production automation to the preview unless `[APPROVED_AUTOMATION_GUIDANCE]`.

Install or update using the instructions for your supported method:

```text
[INSTALL_OR_UPDATE_COMMAND]
```

Verify:

```text
doctl version
[FIRST_SUCCESS_COMMAND]
```

Your DigitalOcean contact is `[NAMED_OWNER]`. Ask for help at `[SUPPORT_ROUTE]`.

Please complete `[FIRST_WORKFLOW]` by `[DATE]`. We will follow up on `[FEEDBACK_DATE]` using `[FEEDBACK_METHOD]`.

## Initial breaking-change notice

Subject: Action required before `[EFFECTIVE_DATE]`: update `[CUSTOMER_FACING_NAME]`

Hi `[FIRST_NAME]`,

We are changing `[AFFECTED_COMMAND_OR_BEHAVIOR]` in the Private Preview on `[EFFECTIVE_DATE_AND_TIME_WITH_TIMEZONE]`.

What changes:

- Current behavior: `[OLD_BEHAVIOR]`
- New behavior: `[NEW_BEHAVIOR]`
- Reason: `[CUSTOMER_RELEVANT_REASON]`
- Affected versions/workflows: `[AFFECTED_VERSIONS_AND_WORKFLOWS]`

What you need to do before `[DEADLINE]`:

1. Modify `[CONFIGURATION_OR_AUTOMATION]` as described in `[MIGRATION_GUIDE]`.
2. Update doctl:

```text
[TESTED_UPDATE_COMMAND]
```

3. Verify the change:

```text
[TESTED_VALIDATION_COMMAND]
```

If you are not ready, use the approved temporary option:

```text
[ROLLBACK_OR_WORKAROUND]
```

Expected impact if no action is taken: `[SPECIFIC_IMPACT]`.

Questions or migration help: `[SUPPORT_ROUTE]`. Your contact is `[NAMED_OWNER]`.

## Breaking-change reminder

Subject: Reminder: `[CUSTOMER_ACTION]` required by `[DEADLINE]`

Hi `[FIRST_NAME]`,

This is a reminder that `[AFFECTED_BEHAVIOR]` changes on `[EFFECTIVE_DATE_AND_TIME_WITH_TIMEZONE]`.

Required action:

```text
[SHORT_MODIFICATION_SUMMARY]
[TESTED_UPDATE_COMMAND]
[TESTED_VALIDATION_COMMAND]
```

Full migration guide: `[MIGRATION_GUIDE]`
Help: `[SUPPORT_ROUTE]`
Temporary rollback/workaround: `[ROLLBACK_OR_WORKAROUND]`

## Internal Support and Customer Success notice

Subject: `[CUSTOMER_FACING_NAME]` Private Preview — support and escalation brief

- Preview period: `[START_DATE]` to `[END_DATE]`
- Approved accounts: `[CONTROLLED_COHORT_LINK]`
- Customer owners: `[OWNER_TRACKER]`
- Scope and limitations: `[PREVIEW_GUIDE]`
- Support one-pager: `[PUBLISHED_SUPPORT_ONE_PAGER]`
- Known issues: `[KNOWN_ISSUES_LINK]`
- Dashboards: `[DASHBOARD_LINK]`
- Customer route: `[CUSTOMER_ROUTE]`
- Internal channel: `[INTERNAL_CHANNEL]`
- Engineering escalation: `[ENGINEERING_DRI]`
- Support advocate: `[SUPPORT_DRI]`
- Release/rollback owner: `[RELEASE_DRI]`
- Support hours: `[SUPPORT_BOUNDARY]`
- Next planned breaking change: `[NONE_OR_NOTICE_LINK]`

Do not enable an account or send preview binaries outside the approved cohort. Escalate unexpected automation breakage, data-loss risk, credential exposure, or rollback failure immediately.

## Feedback follow-up

Subject: How did `[WORKFLOW]` go?

Hi `[FIRST_NAME]`,

You recently tried `[WORKFLOW]` with `[CUSTOMER_FACING_NAME]`. We would like to understand:

1. What were you trying to accomplish?
2. Did you finish without switching to the Control Panel or stable doctl?
3. Where did you hesitate, retry, or use a workaround?
4. Did output, progress, errors, cost, or next steps behave as expected?
5. Would this change how you use doctl in production automation? Why or why not?

Share feedback through `[FEEDBACK_METHOD]` or book `[INTERVIEW_LENGTH]` with `[OWNER]` at `[SCHEDULING_LINK]`.

We will use this feedback to decide whether to revise, pause, or expand the preview.
