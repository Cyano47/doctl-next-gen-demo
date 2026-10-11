# Judgment

Use this when you are about to trust a story, a study, a dashboard, or a single result. The product decision the number serves is in the other files. This one is whether the number, and your read of it, deserve that trust.

## How a person decides in the moment

Kahneman (*Thinking, Fast and Slow*) distinguishes a fast system that jumps and a slow system that can check the jump and often does not. The patterns that keep mattering in product decisions:

- **Anchoring.** The first number in the room frames every number after it. Roadmap debates, pricing, and "how big is this market" all inherit the first slide.
- **Availability.** A vivid customer, a loud deal, or a recent outage stands in for the distribution.
- **Loss aversion.** Giving up an existing feature or a promised date hurts more than an equal gain, so backlogs only grow.
- **The planning fallacy.** The inside view of a project is a best case wearing a schedule. Take an outside view: how long similar work actually took.
- **What you see is all there is.** A persona, a funnel, or a competitor grid feels complete because it is the file in front of you.

Some famous studies in that literature, especially social priming, did not replicate. Kahneman said so about behavioral priming. Use the patterns above as risks in your own meeting. Do not cite a charming experiment from the book as if it were a law.

Ariely (*Predictably Irrational*) pushes the same family of results at pricing and norms: arbitrary anchors stick, "free" pulls people into worse bundles, and social relationships break when you pay for them as if they were a transaction. Several of his specific findings have been contested. Treat the book as a list of hypotheses about your users. Test the one that would change your design. Do not ship a default because a chapter was memorable.

Thaler and Sunstein (*Nudge*; the PDF had no extractable text, so this is that book’s published argument): every interface is already a choice architecture. Defaults, order, feedback, and the number of options change what people do. Their standard is libertarian paternalism: arrange the choice toward what people would want if they were attending, and keep the opt-out cheap. That is the line [Getting adopted](getting-adopted.md) uses against a habit loop or a points system. A dark pattern is a nudge that fails the opt-out test or aims at the seller’s goal against the user’s.

Cialdini (*Influence*) names levers that work on you and on your users: reciprocity, commitment and consistency, social proof, liking, authority, scarcity, and, in later editions, unity. They are how a launch creates urgency, and how a stakeholder meeting manufactures "everyone agrees." Social proof inside a discovery interview ("teams like yours all do this") is not evidence. Chaudhary’s *User Psychology Playbook* is a short tour of brain, decision, purchase obstacles, and persuasion. When it and Cialdini or Kahneman differ in emphasis, use the longer book. The pamphlet is a map, not a second literature.

Norman belongs with discovery, but his error rule belongs here too: when users "do it wrong," the first hypothesis is the design, not the person. Training and tooltips are often loss aversion about a design the team does not want to change.

## Decision quality is not the outcome

Duke (*Thinking in Bets* and *How to Decide*) names resulting: judging the decision by how it turned out. A good decision can lose. A bad one can pay off. The fix is to write, before the outcome, what you believe, how sure you are, and what would change your mind. Separate luck from skill when you review. Run a pre-mortem. *How to Decide* adds a time rule she illustrates with ordinary life: people spend hours a week choosing meals, shows, and clothes, which is analysis paralysis on low-stakes repeats. Spend the slow system where the decision is hard to reverse or easy to get badly wrong. Look for freerolls, where the upside is real and the downside is trivial. Stop polishing a choice that cannot change what you do on Monday.

This is the reading rule for every experiment in [What to build](what-to-build.md). One failed test is not automatically a pivot. One win is not automatically product-market fit. Ask whether the test was noisy, whether the sample was the beachhead, and whether you are resulting. Then pivot or persevere against the disconfirming line you wrote first, not against the mood of the debrief.

Grove’s indicators and Doerr’s grades fail in the same way when a red score is treated as a moral verdict on the team. Grade the bet. Then ask if the bet was sound.

## What to measure

Hubbard (*How to Measure Anything*; title page only in the file, so this is that book’s published argument): measurement is a reduction in uncertainty, not a precise number for its own sake. If a quantity matters to a decision, some observation can reduce your uncertainty about it. Decompose the thing until a piece of it is observable. Estimate the value of the information before you commission the dashboard. More precision than the decision can use is waste. "We can’t measure that" is usually "we have not defined the decision."

Heap’s *Book of Questions* is the day-to-day version. Try to disprove the hypothesis, and let that intention sharpen the hypothesis before you query. Their example: people who read the blog may convert because the blog persuaded them, or because people who were going to buy also read the blog. Those are different decisions. An A/B test that withholds the blog, or a cut of people who only read it after they bought, can tell them apart. Correlation is the default state of a product warehouse. Retention has stages; a launch-day chart is the wrong stage. Read a launch at 30 days and again around six months, which is their structure, not the announcement week.

Product School and Heap’s *Product Analytics Economy* contains a chapter framed as how to make product analytics useless. That is the failure mode Hubbard prices and Heap tries to prevent: more events, no decision, causality assumed from a sequence. Track the observation that would change a decision you are actually facing. Delete the rest from the meeting, even if you keep them in the warehouse.

| You are about to… | Use |
| --- | --- |
| Say a thing is unknowable | Hubbard. Define the decision and the observation that would move it. |
| Add a metric to the dashboard | Heap’s disproof. What result would make this metric a lie? |
| Scale a test that "worked" | Duke. Was the decision good, or did it get lucky? |
| Copy a bias from a book into the UI | Ariely and Kahneman as hypotheses. Thaler and Sunstein as the ethical test. Then a pretotype or an experiment, not a launch based on the citation. |

## Attention, skill, and the story you tell about talent

Rock (*Your Brain at Work*) is a practical constraint: working attention is small, switching costs are real, and a calendar of five parallel hard problems is a way to do none of them. Fabritius and Hagemann (*The Leading Brain*) make the sharper institutional point: leadership advice is a fashion cycle, and a claim about how groups work should sit on a mechanism you can name. Use both as scheduling and meeting design. A strategy day that asks for forty decisions after lunch will be running on Kahneman’s fast system and calling it alignment. Do not use a neuroscience chapter as an org redesign.

Dweck (*Mindset*) argues that treating ability as fixed changes what people attempt, and that a growth stance treats difficulty as training. The popular version over-promises. School replications have been smaller and messier than the keynote. Use it as a stance toward feedback: skill can move. Do not use it as a guarantee that the right kind of praise causes performance.

The disagreement with Grove is in [How the team works](how-the-team-works.md) and it is practical. Task-relevant maturity says a novice sometimes needs the concrete instruction. A growth mindset misread as "let them figure it out" abandons that novice. A fixed mindset misread as "only hire people who already did this exact job" means you never build the skill Grove’s maturity scale assumes can increase.

## Before you believe the readout

1. What decision changes if this number moves?
2. What would disprove the story you are about to tell with it?
3. Which shortcut is in the room: anchor, vivid example, loss, inside-view schedule?
4. Did you write the bet down before the outcome?
5. Is anyone being judged for a result that luck could have produced?

## Sources

Kahneman, *Thinking, Fast and Slow*. Ariely, *Predictably Irrational*. Thaler and Sunstein, *Nudge* (no extractable text). Cialdini, *Influence*. Chaudhary, *User Psychology Playbook*. Duke, *Thinking in Bets* and *How to Decide*. Hubbard, *How to Measure Anything* (title page only). Heap, *The Heap Book of Questions*. Product School and Heap, *The Product Analytics Economy*. Rock, *Your Brain at Work*. Fabritius and Hagemann, *The Leading Brain*. Dweck, *Mindset*.
