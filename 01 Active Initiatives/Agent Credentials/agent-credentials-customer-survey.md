# Agent Credentials — customer survey

23 Oct 2026. A short written survey to send before any moderated session. It does two jobs: it checks that the pain in PRFAQ v10 is real, and it picks who to invite to the 45-minute study.

Reader: the PM sending it. The customer sees only the message and the questions at the end.

This is not a satisfaction survey. The product is not shipped, so NPS, CSAT, and “how likely are you to use this” are the wrong instruments. People answer those about a product they have used. Ask about what they do now.

It also does not replace the study in `agent-credentials-usability/study/`. Fish-food of two teammates, then 8–10 external sessions, is still required before any UX claim. Button copy (“Revoke credential” vs “Stop new requests”) stays in that study. Do not put it in this survey. The October review already set the prototype to pause, not terminate.

## The decisions this survey is allowed to change

| Decision | Question | If the answers disagree with the draft |
| --- | --- | --- |
| Is the FAQ 1 persona real? | Screen 1–3 | Do not take the PRFAQ to ELT on illustrative quotes |
| What do they do today when an agent overreaches? | 4 and 5 | Rewrite the problem paragraph from their answers, not from the press draft |
| Which three limits matter enough to build first? | 6 and 7 | The Phase 1 set is not equally important. Say which three they refused to drop |
| Can GA ship a stop that does not delete resources? | 8 | If they say no, the Phase 3 reversal gap is a launch objection, not a footnote |
| Are count budgets enough, or do they need dollars before they will let an agent create? | 9 | Do not describe Phase 1 as enough for that respondent |
| Who will say this in their own words, on a call? | 10 and 11 | Invite only the yeses who passed the screen |

Do not use the results to set a price, a launch date, or a sample size for the market. Eight qualified responses are enough to read the pick-3. They are not a market measurement.

## Who to send it to

Send it to a person who already has the problem. Profile them before you write. A wide blast will come back from people who have never given an agent a token, and those answers will look like demand.

**Count a response** only when all three are true:

1. They, or their product, call a DigitalOcean API from code, a pipeline, or an agent. Control-panel-only answers stop at the screen.
2. The caller is a product that starts an agent per user task. That is the primary persona in FAQ 1: a coding-agent platform, or an operations vendor whose agent changes a customer’s infrastructure.
3. One response per company, from the person who owns the token or who answers the security review. Not a general user. Not a DigitalOcean employee. Employees are the fish-food pair, and they are not in this tally.

**Keep, but do not let them decide the result:**

- Internal agent fleets, and CI or IaC owners. FAQ 1 calls them secondary. Cap them at 2 of every 10 qualified responses. Read them in their own pile.
- People who asked for a PAT lifecycle API and do not run an agent. [APICLI-5125](https://do-internal.atlassian.net/browse/APICLI-5125) names Glewed/MadConnect, Aiven, Steller, and Team NTC as token-API requesters. Send the survey only if screen 2 says an agent is the caller. A token-API request is not evidence for this product.

**Named places to start.** None of these are enrolled. Token setup is unverified unless the screen says otherwise.

- Great Question shortlist already on the recruit tracker: 113675, 112306, 121688, 124302, plus one or two who have not seen the PRFAQ.
- The same Great Question search, if those IDs bounce: `("agent" OR "coding agent" OR "orchestrator") AND ("DigitalOcean" OR "API token" OR "droplet")` created in 2026.
- Omarchy, from the October review. Candidate only. Current token setup is unknown.
- Hippocratic AI, PCR-939, via Calin Lupa. Ask Vikranth to make the introduction. Do not cold-email past him.

Stop asking for a 45-minute session once four primary-persona respondents have said yes and passed the screen. Leave the survey open until eight primary responses are in, so one company cannot set the pick-3. Then close it. More responses do not make this a baseline.

## What not to ask

- Do not describe Agent Credentials and then ask if they want it. They will say yes.
- Do not ask them to rate every limit as important. Force three, then one.
- Do not ask scope and budget in the same question.
- Do not ask about price. FAQ 14 is directional and unlocked.
- Do not ask about button labels, redeem codes, or RFC 8693. That is the prototype session and the RFC.
- Do not put their words in the PRFAQ until they have approved the sentence and the attribution. The fish-food readout already forbids this.

## The note to send

Subject: How you stop an agent that has a DigitalOcean token

> You run agents or automation against DigitalOcean. I’m not pitching a product. I need ten minutes on what happens when one of them does too much: what it is allowed to hold, and what you can stop.
>
> Twelve short questions. If your answers match the problem we’re testing, I’ll ask for a separate 45-minute session on a prototype. That session is optional and comes after this.
>
> Reply here, or use the form: [link]. One person per company, whoever owns the token or the security-review answer.

Incentive: use the respondent’s own program norm, as the recruit tracker already says. Do not invent an amount.

Do not put the booking link in this note, in the send list, or in the form’s confirmation message. It belongs only on the last section of the form.

The HTML file is `agent-credentials-survey-email.html`. Replace both `{{FORM_URL}}` placeholders with the form link before sending. Send it from a person, so replies come back to you.

## Questions

Scales are labeled choices, not a 0–10. All options fit on a phone without scrolling. One fact per question.

### Screen

**S1. In the last 90 days, has code you own called a DigitalOcean API?**
Yes / No.

Stop if No. Thank them. Do not count them.

**S2. What made those calls?**
Pick one.

- A product we sell that starts an agent for each user task
- An agent our own company runs internally
- A CI pipeline or Terraform
- A person, in the control panel
- I don’t know

Stop if “a person” or “I don’t know.” Tag “CI” and “internal agent” as secondary.

**S3. Are you the person who would answer a customer’s security review about this token?**
Yes / No, someone else owns that.

If No, ask for the name and stop. Do not count this response as the company’s answer.

### What they do now

**1. Where does the token those agents use live today?**
Pick one.

- In a secret manager, and the agent never sees the parent token
- In a config file or environment the agent can read
- One token, shared by every agent and every customer
- A separate token per customer, still long-lived
- Agents are not allowed to call DigitalOcean

**2. In the last 90 days, did a customer’s security review ask what an agent is allowed to do, or how you stop it?**
Yes / No / We have not had that review.

**3. Think of the last time an agent or script changed more infrastructure than you wanted. What did you actually do?**
Pick one. This is behavior, not a preference.

- Revoked a token that other work was also using
- Deleted resources by hand
- Left it until the bill showed up
- Refused to let it run without a person approving each step
- This has not happened

**4. How often does that happen?**
Ask only if question 3 is not “This has not happened.”

Hourly / Daily / Weekly / Monthly / Once.

### What they would refuse to give up

**5. You can put only three limits on the credential the agent holds. Which three?**
They must pick three. They cannot pick all.

- Narrower permissions than the token it is derived from
- It expires when the task ends
- A cap on how many actions it can take
- A cap on how many resources it can leave running
- A dollar cap for that task
- One action that stops that task and leaves every other agent running
- A record that names the person, the agent, and the task

**6. Of those three, which one do you keep if you can only keep one?**

The keep-one answer is the priority. The pick-3 is the set. Do not average them into a score.

### The two GA claims that are easy to overstate

**7. If you stop one task, resources it already created keep running and keep billing until someone deletes them. For a first release, is that acceptable?**
Pick one.

- Yes, if I can see the list of what it left
- No. I need those resources removed when I stop it
- I don’t know yet

**8. Before you let an agent create infrastructure, which limit do you need?**
Pick one.

- Caps on how many actions it can take and how many resources it can leave running
- A dollar cap on that task
- Both. I will not turn it on with only one of them

Question 8 is the Phase 1 vs Phase 2 split. Phase 1 in the draft has counts, not dollars. If primary respondents pick “dollar” or “both,” say that in the PRFAQ. Do not quietly keep the draft claim.

### Their words, and the invitation

**9. When a security reviewer asks what stops this agent, what do you say today?**
Two or three sentences. Empty is an allowed answer. That empty answer is a finding.

Do not edit this into a quote. Ask permission in the session, and keep their title only if they agree.

**10. Will you book a 45-minute session?**
Yes, I’ll book a time above / Not now.

Show this only on the product path, and only after a real incident (question 3 is not “This has not happened”). Internal-agent and CI respondents never see it. The form cannot open a link from an answer, so the link sits in the section description above the question:

> Book 45 minutes here: https://calendar.app.google/sLs1m3fnZ4rmj6ox7
>
> We’ll talk through a recent incident and try a prototype. Pick any slot that works. If none do, answer “Not now” and I’ll follow up.

A “Yes” is not a booking. Add the person to `study/recruit-tracker.md` when the meeting is on the calendar, not when they tick Yes. Stop once four primary sessions have a date. Use `study/session-script.md` for the session.

## How to read it

Write the tally by hand. Do not drop the results into the PRFAQ as percentages.

- Primary pile and secondary pile, separate.
- For questions 5 and 6, list the limits by how often they were the “keep one,” and note any limit that never made a top three.
- For questions 7 and 8, count the answers. If the primary pile splits, the claim stays open.
- Pull question 9 only as raw text for the four sessions. A sentence becomes a quote only after they approve it.
- If eight primary responses are mostly “this has not happened” and “agents are not allowed to call DigitalOcean,” the problem paragraph is ahead of the customers you reached. Say that, and do not recruit a design partner from that pile.

## What this leaves open

The survey cannot validate gateway latency, fail open vs fail closed, coverage of every request path, or whether Managed Agents already injects a per-run credential. Those are the engineering rows in `agent-credentials-signoff.md`. Send the Exauth ask in the same week you send this survey. Neither one closes the other.
