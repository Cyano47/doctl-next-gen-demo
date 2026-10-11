# How to Build a Company OS in Claude Code

- **Channel:** Product Growth (Aakash Gupta)
- **Guest:** Jiaona Zhang (JZ), CPO at Laurel
- **URL:** https://www.youtube.com/watch?v=qsDX0PMKcaE
- **Watched:** 2026-10-11
- **Why this note exists:** A build guide. Use it when you are designing a company operating system, deciding what to automate, or checking whether a team is actually past chat-mode AI.

Auto-captions mangle a few names. This note uses the names she means: **Laurel** (formerly Time by Ping, founded 2018), **Jiaona Zhang**, **Devin**, and **implementation**. Laurel is an AI timekeeping product. CEO is Ryan. JZ previously led product at Airbnb, Webflow, Dropbox, and WeWork, and teaches at Stanford, Yale, and Reforge.

## How to use this note

| If you are trying to… | Start here |
| --- | --- |
| Build the OS from nothing | [Three build steps](#three-build-steps) |
| Decide what a function should still do by hand | [Work map](#work-map) |
| Get people to actually use what you built | [Deliver it where work already happens](#deliver-it-where-work-already-happens) |
| Let non-engineers ship | [Captain and two tracks](#captain-and-two-tracks) |
| Hire or self-assess | [Four levels](#four-levels) |
| Change a company that is not AI-native yet | [Start without a full transformation](#start-without-a-full-transformation) |

## The problem the OS is for

Every company has a small set of people who tinker with AI until their own workflow is sharp, and a much larger set who do not know which skill to call. At Laurel the ratio she names is about **1%** versus **90–99%**.

Those 1% workflows die in one person's laptop. The company OS is how you take the person who plays with the tools the most and make their method the default for the rest of the function.

The thing you are encoding is the skill, not a particular scheduler or a particular agent product. Scheduled tasks and a separate agent UI are delivery choices. The asset is the shared, opinionated way your company does a piece of work.

## What you are building

One GitHub repo. One folder per function. Inside each function, folders for the activities that function actually does. Inside each activity, a skill file.

Functions she shows: customer success, data science, design, engineering, finance, implementation, legal, marketing, sales, product.

Customer success is the clearest picture:

- Account management → renewals, upsells. The renewal folder holds the skill for walking a renewal with a customer: the assets, the references, the sequence.
- Customer enablement → office hours, rollout, training, onboarding.

A skill is a markdown file that says how *this company* does that activity. It is specific. A renewal skill is not "write a good email." It is the renewal motion Laurel wants every CSM to run the same way, so the customer experience stays consistent. Consistency here is a brand problem, not a productivity trick.

Those files are uploaded into Claude organization skills. Anyone on the team can call them from inside the work they are already doing. Example call: `/morning briefing product`.

Next to the repo sits a work map (she calls it an ontology): every function, the categories of work, the tasks inside each category, and a judgment on which tasks should get more human time and which should be automated.

## Three build steps

She builds this from simple to advanced. Do them in order. An OS starts as one automation.

### Step 1 — Automate one tedious loop

Pick one workflow a person or a team repeats, that eats the day, and that they would be glad to stop doing.

Good first targets:

- The same email, kicked off when a known event happens.
- Data entry into the CRM.
- Meeting prep pulled from several sources before a customer call.
- A back-and-forth intake that always asks the same questions.

**Worked pattern: feature-request intake.** Sales, support, and success drop into an ask-product channel with a feature request. The old loop is a chain of questions: how many times has this been asked, where is the Gong recording, what is the customer impact (that one needs judgment from the person on the account), and what else is going on. Then someone triages it to a team and a PM, and someone has to hit an SLA back to the requester.

The first automation does only this:

1. When a request comes in, require the fields up front: what it is, who it is from, what is going on.
2. Assign it to the person who should look at it.
3. Open a ticket so it can be tracked.
4. Hold the SLA for a response.

She calls this 101. It lives in Slack or Teams. It is still the start of the OS, because the company has decided, in one place, how this motion works.

### Step 2 — Turn a playbook into skills

Take a real playbook for a function or an end-to-end journey. Laurel's GTM success playbook is about 50 pages: implementation, onboarding, and different paths for an admin versus a timekeeper. Their "forward deployed" success people are time consultants inside customer orgs.

Writing the playbook is no longer the hard part. Claude can draft one from existing sources. A first draft can come back in under a minute. Making it true to the business takes hours, sometimes days. It does not take weeks.

The hard part is getting the playbook done. Audit every step into one of three buckets:

| Bucket | What it means | Example |
| --- | --- | --- |
| Stays human | A person has to be in the room | A phone call, an on-site, a real check-in |
| Productize | The product itself should do it | A step customers should never need a human for |
| Agent or skill | A repeatable step a workflow can run | Draft the email, pull the research, fill the brief |

The first version of Laurel's OS came from this audit. Customer success folders (implementation, activation, "talk to them the right way") were the playbooks, cut into skills.

Nobody reads 55 pages. Build one agent or skill per step you marked as automatable.

Examples she names:

- CSM who drafts the same emails → an email agent.
- Salesperson who scrapes LinkedIn, reads the market, or writes prospecting questions → an agent per step.
- RFP work → its own agent.

### Step 3 — One router, delivered in the tools people already open

People will not remember which agent writes the email and which agent does the RFP. Wrap the specialized agents in one router. Laurel's version is a go-to-market agent. Sales or success calls that one agent. It routes the ask to the sub-agent that fits.

Then put the result where the work already is: Slack and email, just in time. A separate agent UI has too much friction. People will not go to another tab to ask Dust a question. They will use the briefing that is already in the morning Slack.

**Dust versus Claude.** Laurel started on Dust in fall 2025 because a specialized agent builder (Dust or Glean) was easier then. She does not think you need to buy one now. The gap closed fast enough that the same agents can be built in Claude. Their current move is to take the skill files out of the agent builder and load them as Claude organization skills, so `/morning briefing product` runs inside Claude.

## Deliver it where work already happens

The daily surface is a morning briefing in Slack for customer-facing teams. It shows the day: calendar, meetings, check-ins, onboarding sessions. Each item points at the skill for that motion (handoff, session prep, renewal). The person does not choose a tool. The briefing tells them which skill applies.

### Do not schedule everything

JZ built a long list of scheduled tasks for herself and pinned only a few. Most of them were "this might be interesting." That produces information overload, and it assumes every person will build and prune their own automations. They will not, and the ones who do will each invent a different stack.

Consolidate into one daily place, shared across the org, so adoption is the same on Monday for a PM and for someone in go-to-market. Push further toward just-in-time: detect what the person is working on and surface the relevant skill then. Laurel can do some of that inside their own product because the product sees what you are working on.

Rule: if a scheduled job does not change what someone does that morning, it does not belong in the OS.

## Work map

Before the folder tree, map the work. For every function, list the categories they are supposed to be in, then the tasks inside each category. The folder structure of the OS is that map.

Then mark each task:

- **More human time.** These numbers should go up. She wants to see named people spending their week here.
- **Stop doing it by hand.** Automate it, or require that the person call an agent every time they do it.

For product, her claim is that the PM work map should start to look like the engineer work map.

Spend more time on:

- Feature work, with agents.
- QA of your own product, including fixing bugs. Not a QA pass you throw back over the wall.
- Direct customer contact. Staying close to customers does not move.

Stop doing by hand:

- Competitive write-ups and daily competitive synthesis. Build the agent that pulls the data. The human moderates it.
- Stakeholder-management writing and long briefs.
- Research logistics: planning the study, doing the outreach, synthesizing the pile. The judgment at the end can stay; the assembly does not.

Do this line by line for any function you lead. Marketing is her other example: copy is edited, not written from a blank page; video does not need the old studio spend if the tooling can carry the production.

The map is also how you run the company. She uses the same idea on her own team: what should a PM's hours be, and what should no longer be a human task.

## What stays human, and how you still encode it

This is not a plan to stop hiring. It is a plan to put people on the work that makes the company distinct.

Relationship work stays human. A real check-in, an on-site, taking a champion to dinner, the feeling of hospitality. Agents do not replace that.

The logistics around it do not stay human. Scheduling the on-site, the back-and-forth, event logistics in marketing. Nobody wants that work, and it is what makes the human moment possible.

**Worked pattern: unreasonable hospitality.** This is a Laurel company value, not a doc people read once. The failure mode of a value-in-a-doc is that the naturally thoughtful person does it and everyone else forgets, especially on day 4 of the job or in a busy week. One person on the team heard a customer was leaving the country for the first time and bought an engraved passport holder. That does not scale.

So the OS runs a check. If you have a check-in, and there has been no in-person touchpoint for a while, the briefing asks how you might surprise them. It pulls ideas from Gong: what this person has said they love. It also takes the errand off the human: figuring out that a passport holder is the gift, and how to get it engraved.

Pattern to copy: name the behavior that makes you special, keep a human in that moment, and build the skill that makes the moment easy to deliver every time.

## Culture and who owns it

The OS fails if it is an engineering project. Leadership has to say it is cross-company.

What Laurel did:

- A company-wide hackathon at an offsite, with the intent to repeat every quarter or every six weeks. Separate hackathons for go-to-market, so those teams show what they built. The point is that "everyone is a builder" is an expectation, not a slogan.
- Training for shipping to production when you are not technical. They wrote an enablement guide for shipping with Devin. Devin started, in their use, near intern level a year or two earlier. By this conversation it is a decent software engineer and not a staff engineer. The guide is how non-engineers use it safely. A customer-success version of that guide is about eight pages; they then broke it into skills so people are not expected to reread the guide.
- Celebration of the 1%. Take that person's workflow and make it the team workflow. Behavior follows what you celebrate.

**AI operations is a job, not a shared hope.** "Everyone should use AI" means nobody owns it. Laurel stood up an AI operations team, which she treats as the new biz ops. Old biz ops wore many hats and stayed high-level. The new job is full-time: play with the tooling, build the workflows, take large pieces of someone's day off their plate.

Who to hire into it: intensely curious, already tinkering with new tools, relentless about finding wasted work.

They started with one person, Sasha, who had been JZ's student and then her TA. He proved the value. Other functions then asked for their own version. That is the buy-in path: one excellent generalist, then an AI ops owner per function (go-to-market, product, finance). Finance, rev ops, product ops, and research ops are all changing fast enough to need a dedicated owner.

**Where the mandate comes from.** Laurel was founded in 2018 as Time by Ping. Ryan rebuilt the product and the company around a different timekeeping model: from manual entry and integrations, to seeing what happens on the computer and running that through a model. She credits that to the CEO. If you do not have that conviction at the top, you can still do it inside a function you run. Color-code your own work map and operate the team that way.

## Start without a full transformation

She expects every company to end up here, because competitors who rebuild will move much faster. Waiting to be forced is the worse position. Most of the block is process and access, not ability.

If you cannot ship to production this month:

1. Find a team in the company that wants product help and build them a tool. There is always one.
2. At the same time, automate one slice of your own week. Meeting prep served to you before the call. The email you rewrite every time, auto-filled.
3. When that feels normal, map one function or one operational journey. Write the playbook, audit it, cut skills.

Leaders: make the hackathon real, celebrate the wins in public, and copy the 1% workflow onto the rest of the team. That is the culture change. The repo comes after people have something worth encoding.

## Captain and two tracks

Laurel stopped treating product, design, and engineering as a handoff chain. Each initiative has one captain: the person whose skill is the one the outcome depends on.

| Hardest part of the work | Captain | Why |
| --- | --- | --- |
| Architecture, such as making the codebase safe for agents to ship in | Engineering | The risk is structural |
| Interaction, such as mobile time insights that have to feel delightful | Design, with data science close | The outcome is the interaction, and it is also a data problem |
| Customer and firm context, such as temporary initiatives or an empty state | Product | Empty-state difficulty was the content: what the user wants, what the firm wants, and what it must not do. That is PM work. Engineering and even design were not the hard part |

The captain is not "whoever is most technical." Before a PM ships a front-end and back-end change, they ask a tool connected to the repo (Devin, Claude Code, Cursor) what state the code is in and what to be careful about. Engineering is pulled in on the contentious or risky parts. Engineers still review risky code. The same move a marketer uses when they hand copy to a model and ask it to attack the draft.

**Two tracks.** Decide the bucket before you build.

**Fast track.** Small enough that one builder can own it end to end. Temporary initiatives did not get a product review. It still goes through an Ask Devin channel, a human looking at the PR, and end-to-end testing by the builder. Cycle time here can be an hour or a day. The builder owns quality and impact. She prefers this to the old loop where PM, design, and engineering each throw the work over a wall and design QA fails because the build is not what was designed.

**Strategy track.** The change alters how the product behaves as a system. Her example: changing how activities are displayed, including how a user zooms in and out of their day. That gets a real product review, which for her is a product strategy review plus an architectural review. The review asks whether the system can support the change and whether the next increase in speed is still possible. She rejects the idea that AI-native means roadmaps and planning disappear. Fast local work with no shared strategy does not produce a new product or a new position. It produces a lot of local maxima.

### Checks when more people can ship

Customer success and sales shipping is useful only if their work does not collide with product work or with someone else's metric. The old glue was the PM. The replacement is visibility plus rules.

1. **A public channel for agent-shipped work.** Laurel uses something like "ask Devin reviewers." Every use of Devin to ship is visible. Tag the front-end engineer or the designer who needs to look.
2. **Ground rules inside the enablement guide**, so the tool itself carries the constraints.
3. **A quick-check post before a small change.** Someone in support posts the idea, people from engineering and success reply, and others play with a first version. That replaces a product review that used to take a calendar hold. Use it on the fast track.
4. **Code review on anything risky.** Non-negotiable.
5. **Name the track first.** Fast-track work should not wait on a strategy review. Strategy-track work should not skip one.

### What "PMs shipping" meant in the examples

These are production changes, not copy tests.

- **Nick, PM.** Shipped delete-temporary-initiatives across front end and back end. Temporary initiatives group time when you do not yet know the project, then submit at the end of the day. The feature touches other systems and has real release rules. He commits the PRs. His background is closer to design than to engineering.
- **Jessica, PM.** Shipped the empty state for a new user. She did not come from a computer science path.
- **Ashley, customer success.** Uses the Devin enablement guide, written with the PMs, to ship in a bounded, reliable way. Less technical than the PMs, still inside the same system.

## Four levels

Use this on yourself, on a candidate, and on a company. Ask which level the *majority* of the org is on. That is the company level.

| Level | What it looks like | Company OS equivalent |
| --- | --- | --- |
| 1 | Chat. You ask ChatGPT or Claude a question and take an answer. Search with a conversational skin. | No shared system |
| 2 | One workflow is automated. A trigger, a template, a handoff that used to be manual. | Step 1 |
| 3 | You build an app because a tedious job should have software around it. | Skills and internal tools from the playbook audit |
| 4 | Shared apps, and shipping through the product life cycle to customers. | The OS is how the company works, and non-engineers ship to production |

Saying "we are AI-native" is cheap. The test she uses in interviews, for every function, is a screen share: show the actual screen. Level 1 is obvious in about a minute. Look for a workflow, an agent, an app, or something they truly shipped. A live build exercise is fine, and it is expensive to standardize, so smaller hiring volumes can skip the heavy loop and spend the time on this look under the hood.

## Who she hires, and how small the team stays

She wants product builders, and she wants that of designers and engineers too, not only of people with the PM title. The captain model is that belief in practice.

For PMs specifically she hires the overlap of:

- Judgment from reps. They have shipped work that failed the first time.
- Curiosity and a wish to be hands-on.
- Excitement about dropping the old chores, rather than fear that the job is changing.
- Closeness to customers. That part of the job does not move.
- Orchestration: big-picture judgment and detailed execution in the same person.

A person who still needs a designer, an engineer, and several other roles wrapped around them adds overhead. The missing craft can often be a workflow. She would rather pay a few seasoned people well than staff an army.

She has watched former CPOs, VPs, and heads of product take builder seats and prefer it, because a lot of the old management job was coordination cost. Her own org went from hundreds of people to **five PMs and four designers**. Adding people adds coordination and makes end-to-end ownership feel less real. The line she wants is lean, and not so lean that the team is starved.

## What does not change

Reforge's AI-leadership curriculum changes by the month. The PM fundamentals she teaches do not. Building faster is a reason to be stricter about them, because you can now build the wrong thing the same day.

Before you build, know:

- Why this exists.
- Who it is for.
- What problem it solves.
- What success looks like, so you can tell you hit it.

Do not jump to the solution because the tool can draft one. A leader's new job is the system around that judgment: culture, team, room to build, the operating system, and a real picture of what people do all day.

## Rebuild checklist

Use this when you start a company or function OS.

1. Name the 1% workflow you are trying to spread. If you cannot name the person and the motion, you are not ready to build a repo.
2. Pick one tedious loop. Specify the trigger, the required fields, the assignee, the ticket, and the SLA. Ship that in Slack or Teams.
3. Write or gather the playbook for one journey. Budget hours to days to make it true.
4. Audit every step: human, productize, or skill.
5. Write one skill file per automatable step. Opinionated, company-specific, short enough to call.
6. Add one router agent so people call a function, not a menu of agents.
7. Deliver through a daily briefing in the tool they already open. Attach the skill to the calendar item.
8. Delete scheduled jobs that do not change the morning.
9. Draw the work map. Mark more-human versus stop-doing-by-hand. Put the human hours on the thing that makes the company distinct, and build the skill that makes that thing easy.
10. Decide the track for each initiative before anyone writes code. Fast track: channel, PR, builder-owned test. Strategy track: strategy review and architectural review.
11. Put ground rules in the shipping guide. Review risky diffs. Keep agent-shipped work in a public channel.
12. Give AI adoption a full-time owner. Start with one. Split by function after other teams ask for their own.
13. Screen-share the result. If the majority of the team is still on level 1, the OS is a repo nobody calls.

## Related

- Books:
- Videos:
