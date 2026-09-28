# doctl private-preview selection rules

Status: approved for candidate discovery and internal review on 2026-09-22. These rules do not authorize customer contact or preview access.

## Purpose

Build a small, diverse, supportable candidate pool that represents:

- sustained automation and CI usage
- broad interactive doctl usage
- AI infrastructure and agent-related usage
- prior research participants with known workflow evidence
- users most likely to be disrupted by formatting or outcome changes

Telemetry is a discovery signal. Final participation requires internal validation, a named owner, preview-specific consent, and tested rollback to stable doctl.

## Base eligibility

- doctl activity in the previous 90 days
- activity within the previous 14 days
- currently billable
- active customer record
- exclude test, employee, admin, abuse, suspended, hold, and archived accounts
- deduplicate by ultimate customer parent within each cohort

## Cohort definitions

### Power Automator

- at least 30 active days
- at least 5,000 requests
- at least 50% of requests concentrated in the most-used product
- daily request coefficient of variation no greater than 1.25

This is an inference from cadence and concentration. Screening must confirm scripts, scheduled jobs, CI, polling, pipes, text parsing, and exit-code dependencies.

### Power User

- at least 20 active days
- at least five product families
- at least 50 write requests

Screen for workflow breadth, Control Panel fallback, progress/error needs, names versus IDs, and interactive/non-interactive behavior.

### AI User

- activity in validated AI product families: Agents, Dedicated Inference, GenAI, or Vector Databases
- at least three AI-active days
- at least 25 AI-related requests

Add prior AI research participants for review even when telemetry thresholds are not met, but label them as research-priority candidates rather than telemetry-qualified candidates.

## Candidate-pool and wave sizes

- retain the top 10 candidates per telemetry cohort for internal review
- permit cohort overlap; overlap is evidence, not an error
- recommend six participants for wave one: two Power Automators, two Power Users, and two AI/research users
- retain six backups with the same diversity
- do not fill a quota with an unsuitable or unowned account

## Ranking

Within each cohort:

1. valid named customer owner
2. cohort-specific activity metric
3. secondary cohort metric

CSM/VIP status affects contactability and supportability, not cohort classification.

## Validation gates

Customer Success:

- validates account relationship, owner, contact path, and suitability

Support:

- checks support health, active escalations, and available coverage

Engineering:

- checks affected commands, output/exit-code risk, CI fallback, and rollback

Research:

- confirms prior evidence, interview suitability, and willingness to provide detailed workflow feedback

Product:

- confirms cohort balance and that the preview addresses the participant's workflow

## Decision states

- **Ready:** owner, workflow evidence, supportability, feedback commitment, and rollback are confirmed
- **Ready with mitigation:** suitable only after a documented compatibility or support action
- **Hold:** missing owner, current-usage validation, consent path, or unresolved health/escalation check
- **Exclude:** duplicate parent, ineligible account state, unsuitable workflow, unacceptable risk, or no safe rollback

## Data handling

- raw candidate data remains in approved Snowflake, Salesforce, research, and Cursor-managed review surfaces
- do not add customer-identifying lists to public repositories, GitHub issues, or broadly accessible documents
- Campaign Operations receives only the final approved recipient list
