# Programmatic OAuth Onboarding

**Status:** Draft  
**Owner:** Vikranth Alapati  
**Engineering:** Aaron's Console team  
**Ticket:** [APICLI-5350](https://do-internal.atlassian.net/browse/APICLI-5350)  
**Design:** Existing onboarding patterns and components; Figma reference pending  
**Reviewers:** Console Engineering, Design, Security (email-validation workflow)

## 1. Problem

Developers who sign up from an agent or marketplace can return to that surface before their DigitalOcean account is ready. Their first resource request may then fail with a generic forbidden error because email verification or payment setup is incomplete. The user must leave the workflow to diagnose and fix the account state.

## 2. Goal

Guide developers through required account setup and return them to the originating interface with a clear account state. Email verification is required; payment setup is optional until an action requires it.

### Non-goals

- Removing or weakening email verification
- Changing core `doctl` authentication or context switching
- Redesigning the general DigitalOcean signup flow
- Changing Stripe payment-method infrastructure
- Introducing MCP-specific onboarding behavior

## 3. Target experience

This programmatic onboarding flow may differ from the standard Console experience. DigitalOcean can select it when an OAuth request includes a recognized origin or referrer in the authorization URL. The value must be validated against an allowlist and preserved with the OAuth state; the browser `Referer` header alone must not determine routing.

### 3.1 New account

1. User authorizes DigitalOcean from the originating surface.
2. DigitalOcean sends the user to a dedicated onboarding destination.
3. The page shows account setup as a short sequence:
   1. Verify email — required.
   2. Add payment method — optional, with a clear explanation that some resource actions require it.
4. The user cannot complete the flow while email remains unverified.
5. After verification, the user may add a payment method or skip that step.
6. DigitalOcean returns the user to the originating surface with a clear success or incomplete-setup state.

### 3.2 Existing account

- Verified account: show payment status, then allow return.
- Unverified account: require verification before return.
- Missing payment method: allow return, but explain which subsequent actions may be blocked and provide a direct path to add payment.

## 4. Requirements

The onboarding destination must:

- Route recognized programmatic origins to this flow without changing the standard Console flow.
- Read the origin or referrer from the OAuth authorization URL and validate it against an allowlist.
- Fall back to the standard Console experience when the value is absent, invalid, or unrecognized.
- Preserve OAuth state and the originating return destination.
- Detect email-verification and payment-method status.
- Block completion until email verification succeeds.
- Refresh verification state without requiring OAuth restart.
- Present optional payment setup through the approved Stripe flow and explain the consequence of skipping it.
- Reuse existing Console components and onboarding patterns.
- Show specific recovery guidance for expired links, failed verification, payment errors, and interrupted sessions.
- Avoid exposing tokens, credentials, or sensitive account details in URLs or analytics.

Programmatic error states must distinguish:

- Email verification required
- Payment method required for the requested action
- Authorization failure
- Other account restrictions

Security must approve changes to the email-validation workflow before launch.

## 5. Success measures

The initial release will establish baselines before setting numeric targets.

- OAuth starts that reach verified-email completion
- OAuth starts that return successfully to the originating surface
- Median time from OAuth start to successful return
- Drop-off by onboarding step
- Payment-method completion and skip rates
- Resource-request failures caused by missing verification or payment

Required events: `oauth_onboarding_started`, `email_verification_prompted`, `email_verified`, `payment_prompted`, `payment_added`, `payment_skipped`, `oauth_onboarding_completed`, and `oauth_onboarding_failed`. Each event must include entry surface, account state, step, and failure reason; it must not include secrets or payment data.

## 6. Delivery requirements

Required:

- Security approval for the email-verification workflow
- Design review using existing Console components
- Validation with supported programmatic entry points
- APICLI-5350 acceptance-criteria update

Not required:

- GTM campaign or launch plan
- Customer migration or backfill
- Pricing or packaging changes
- Changes to `doctl`, MCP, SDKs, or APIs
- Broad Console onboarding redesign
- New customer documentation beyond in-flow guidance

## 7. Risks and mitigations

- **Payment appears mandatory.** Label it optional and explain when it becomes required.
- **Users wait on verification email.** Support resend, status refresh, and explicit expiration guidance.
- **Return routing breaks across integrations.** Validate destinations and preserve OAuth state server-side.
- **Existing signup flows regress.** Gate the new destination to supported programmatic entry points and roll out incrementally.

## 8. Open questions

- At what point is the OAuth token issued, and what capabilities does it have before email verification?
- Which resource actions require a payment method, and can the onboarding copy state this accurately?
- What approved return-state contract will integrations consume?
- Which existing Figma flow and Console components should be reused?
- Does Security require a new threat-model review or only workflow sign-off?

## 9. Decision note

The Oct 28, 2026 meeting decision supersedes the current APICLI-5350 payment criteria: email verification blocks completion; payment setup does not.

## References

- [APICLI-5350 — Improving OAuth Signup Process](https://do-internal.atlassian.net/browse/APICLI-5350)
- “OAuth Signup flow” meeting notes, Oct 28, 2026
