# doctl private preview support one-pager

Status: **draft; requires `[SUPPORT_DRI]`, Engineering, Product, and Legal approval**

## Safe statements

- This is an invite-only Private Preview.
- Preview behavior can change, including commands, flags, output, prompts, and exit behavior.
- Customers will receive advance notice before an approved breaking preview change.
- Existing stable doctl remains the recommended path for production automation unless `[APPROVER]` explicitly states otherwise.
- Machine-readable output should be used for automation; the supported contract is `[SUPPORTED_OUTPUT_CONTRACT]`.
- Preview access, support hours, duration, and rollback are governed by the approved onboarding terms.

Do not claim:

- general availability, production readiness, or formal SLA coverage
- compatibility for an OS, installer, command, or integration not listed in `[SUPPORTED_SCOPE]`
- that all doctl commands have the new experience
- that a breaking change or migration date is final without an approved release notice
- that rollback is available unless Engineering has tested and documented it

## Support boundary

- Customer-facing name: `[CUSTOMER_FACING_NAME]`
- Preview version/channel: `[VERSION_OR_CHANNEL]`
- Stable rollback version: `[STABLE_VERSION]`
- Preview period: `[START_DATE]` to `[END_DATE]`
- Support hours: `[SUPPORT_HOURS_AND_TIMEZONE]`
- Response expectation: `[RESPONSE_EXPECTATION]`
- Customer route: `[CUSTOMER_ROUTE]`
- Internal coordination: `[INTERNAL_CHANNEL]`
- Engineering escalation: `[ENGINEERING_DRI]`
- Support advocate: `[SUPPORT_DRI]`

## First response checklist

1. Confirm the account ID, operating system, architecture, install method, and exact `doctl version` output.
2. Confirm whether the customer intended to run stable or preview doctl.
3. Capture the exact command with secrets removed, output format, exit code, and timestamp.
4. Ask whether the command is interactive, manually invoked, or part of automation.
5. Capture the request ID from `--trace` only after warning the customer to remove tokens and sensitive payloads.
6. Check `[KNOWN_ISSUES_LINK]`, `[STATUS_DASHBOARD]`, and the internal preview channel.
7. Classify the issue as install/update, authentication, compatibility, output contract, command behavior, API dependency, or documentation.
8. Follow the approved rollback steps if impact is severe and rollback is supported.
9. Escalate using the template below.

## Update and rollback

Approved preview update command by install method:

- Homebrew: `[HOMEBREW_UPDATE_COMMAND]`
- GitHub release binary: `[GITHUB_BINARY_UPDATE_COMMAND]`
- Package manager: `[PACKAGE_MANAGER_UPDATE_COMMAND]`
- Other supported method: `[OTHER_UPDATE_COMMAND]`

Verification:

```text
doctl version
[MIGRATION_VALIDATION_COMMAND]
```

Rollback:

```text
[ROLLBACK_COMMAND]
```

If a rollback command is not approved, do not improvise. Escalate to `[ENGINEERING_DRI]`.

## Breaking-change response

Confirm the customer received release notice `[NOTICE_ID]`, then provide:

- affected command and old behavior
- new behavior and effective date
- required customer modification
- exact update command
- validation command
- rollback or temporary workaround
- support and escalation route

If the customer did not receive the notice, record the account ID and notify `[CAMPAIGN_OPS_DRI]` plus `[PM_DRI]`.

## Escalation template

```text
Private-preview escalation
Account ID:
Preview version:
Stable version, if known:
OS / architecture / install method:
Command or workflow:
Interactive or automation:
Expected behavior:
Actual behavior and exit code:
Request ID:
First observed:
Customer impact:
Known breaking-change notice:
Rollback attempted/result:
Secrets removed: yes/no
Internal owner:
```

## Severity guidance

- Treat unexpected automation breakage, data-loss risk, unauthorized action, credential exposure, or inability to roll back as an immediate escalation.
- Use the standard incident process for customer-impacting incidents.
- Pause preview rollout and scheduled communications during an active major incident unless the incident commander approves an exception.

## Feedback capture

For non-incident feedback, record:

- customer goal and workflow
- task completion result and time
- point of confusion or failure
- stable-versus-preview comparison
- workaround used
- desired behavior
- permission to follow up

Store feedback in `[APPROVED_FEEDBACK_SYSTEM]`; do not copy customer-sensitive details into public GitHub issues.
