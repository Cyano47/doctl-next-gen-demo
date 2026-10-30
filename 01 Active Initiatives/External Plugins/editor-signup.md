# Sign up in the editor

**Audience:** Senior product, engineering, design, and GTM, deciding whether to fund this on top of the 16 October plugin pitch.  
**Author:** Vikranth Alapati  
**Date:** 23 October 2026  
**Ask:** Approve one plugin that creates or connects an account inside Cursor, deploys the open app, and only then offers inference. Do not approve an AI-attach campaign, a credit drop, or ads until that path works for a stranger.  
**Build spec already written:** `mcp-marketplace-plugins-pitch.md` and `MCP-marketplace-plugins-PRD.md`. This doc changes the goal and the go-to-market gate. It does not open a second plugin project.

## The decision

A developer who is already in Cursor, Claude, or VS Code should install DigitalOcean, sign up or sign in, and have the open repo running, with the monthly cost stated before anything is created. Inference is a later step on that app, behind a spend ceiling.

The lower-tier gap is real, and it is a discovery and signup gap. It is not an AI-attach gap. Accounts that show up as AI-only in their first month keep the worst retention on the platform. Accounts that use MCP in month one keep the best, and they are mostly running core cloud, not Gradient. A campaign that counts “came to AI” will fill the cohort we already know churns.

## Where the idea does not hold

Four claims in the brief need a correction before anyone builds or briefs marketing.

**“Lower tiers do not use MCP.”** The rate is lowest there, and it is low everywhere. In September 2026, MCP reached 0.4% of paying accounts under $50, 1.1% at $50–$500, 1.9% at $500–$5k, 2.9% at $5k–$50k, and 3.5% at $50k+ (`tiered-gaps-stickiness-foundation.md`, from `snowflake-usage-revenue.md` §4). Entry is 556,173 paying accounts and 7.3% of net revenue. A higher rate at the top is a few dozen extra accounts, not a mature motion we failed to copy downward. The shelf is empty for everyone. Cursor’s marketplace already lists AWS, Cloudflare, and Vercel. We still tell people to paste a URL into `mcp.json`.

**“Get them to AI attach.”** Adding AI Platform barely separates growers from stallers: 1.9% against 1.6%, a 1.25× ratio (`product_adoption_scaling_2026-10.md` §2). AI-added AI Platform is about 4,217 accounts and $49k a month, roughly $12 an account, and 93% of them already had Droplets. Of accounts first billed in 2022–2025, AI products are under 1% of starts (0.4% AI Platform in partial 2026). The revenue in “AI” is not this population. In September, 52 accounts were 96% of AI revenue (`snowflake-usage-revenue.md` §1, §3). Serverless inference accounts fell from 3,320 in July to 2,420 in September while tokens rose from 89 billion in June to 3.46 trillion and its own net revenue rose from $27k to $812k. Those accounts churn at 16–18% a month, about three times the base rate (`report.md` §5). Invoice SKUs count 3,193 inference accounts in September. The two counts measure different things.

The strict month-one cut is sharper. Among 168,827 clean accounts first billed January–April 2026, 708 that were AI-only in month one (core spend at or under $50, some AI spend) kept 33.05% of logos at month six. The 324 that used MCP in month one kept 70.37%. Console-only kept 47.46%. Only 85 accounts started month one as hybrid (more than $50 of core spend and any AI). By September, hybrid AI plus core was 1,921 accounts and $35.59M net, and 78.8% of them were acquired before 2026 (`programmatic-and-ai-growth-loops-plan.md`, query `01c7d66b-041f-e6bb-001b-b50209a77a43`). Hybrid is how an existing host expands. It is not how a new developer should arrive. Of AI users in January–March 2026, 77–81% of AI-only accounts had stopped paying by July–September, against 14–22% of AI accounts that also hosted or stored data (`product_adoption_scaling_2026-10.md` §5).

**“The plugin should lead with inference.”** The servers already exist. Docs list 22 remote MCP URLs, including seven GenAI servers, and OAuth is on those authenticated servers as of the 1 October 2026 docs update. Almost nobody adds them. Of 6,614 MCP accounts in September, 5,383 called Droplets (81.4%) and 1,166 called Apps (17.6%). Spaces was 189 accounts. The GenAI URLs are under 0.1% (`programmatic-and-ai-growth-loops-plan.md` §2.4). A new inference skill on a second URL repeats that miss. One plugin, pointed at one router, with a skill the agent runs when the user asks, is the distribution fix. The skill order is host, then model.

**“Run ads and credits in the marketplaces once we launch.”** Paid search is 1.9% of serverless-inference last-touch conversions (276 of 14,347 attributed accounts). GitHub organic is larger: 701 last-touch, inside 2,320 organic-link conversions. Direct or unknown is 55.7% (`GEN_AI_SERVERLESS_INFERENCE_ATTRIBUTION` in the same plan). On 16 October we found no self-serve ad product in Cursor or Claude (`mcp-marketplace-plugins-pitch.md`). A credit for signing up also fights the payment gate: 71.9% of 808,091 clean H1 2026 signups never added a payment method, and 84% of those who did built on day 0–1 (`snowflake-activation.md`). How much of the 72% is fraud is `[not computed]`. September already showed what unpaid MCP looks like: remote MCP went from 1,252 accounts in August to 4,812 in September, 3,839 of them first-time, and 1,796 of the month’s agentic accounts had no billable usage (`report.md` §5, §7). Of the 2,526 MCP accounts that were brand-new September signups, median requests were 8 and 22.1% were billable, for $10,457 net (`programmatic-and-ai-growth-loops-plan.md` §2.4).

MCP use is still a good sign when it is real. Accounts that used MCP in January–March 2026 added a product by July–September at 21.8%, against 11.3% for matched API users without MCP, and churned at 17.4% against 22.8% (`product_adoption_scaling_2026-10.md`). Month-one MCP users above are the best logo cohort we have measured. That is an association. People who already automate keep their accounts. A matched cohort inside the spend band has not been run (`NOW.md`; `ecosystem-gaps-2026-10.md`). Do not brief this as “MCP causes retention.”

## Who this is for

The person is in an agent with a repo open. They will not leave for docs.digitalocean.com. They install what the client already shows. External studies raised DigitalOcean in 25 sessions and chose it in none. Treat that study as weak: the same set of studies gave AWS, GCP, and Azure about zero picks, because agents default to Vercel and Render for web apps (`programmatic-and-ai-growth-loops-plan.md`, claim C6). Our own four-model test ranked DigitalOcean first for a VM plus storage plus a database. The honest job is that prompt, plus “deploy this repo and tell me the cost,” not “become an AI customer.”

This does not reach most Entry customers. About 60% of Droplet accounts spending $50+ with no managed database made no API call in the quarter. Email and the console are their channel. App Platform and AI gap accounts are 80%+ active on the API, so a plugin can talk to them (`product_adoption_scaling_2026-10.md`). Under $10, accounts that used a token churned at 13.5% against 10.5% for console-only (`report.md` §3). A plugin that helps someone script a test and leave will make Entry churn worse.

Two stores are different things. Cursor Marketplace, the Claude directory, and the VS Code `@mcp` gallery (fed by the GitHub MCP Registry) are where this plugin is installed. GitHub Marketplace, where people list apps, is not that shelf. GitHub.com is a referrer we already see in inference attribution. We do not ask developers to publish their app into Cursor.

## What we ship

Phase 1 is the plugin in the 16 October PRD, plus account creation on the OAuth screen.

| Piece | Phase 1 | Why it is in |
|---|---|---|
| One plugin on the router | Cursor first. Claude second. VS Code after the gallery actually returns the listing | Competitors are on the Cursor shelf. A URL in our docs only reaches people who already chose us |
| Skills | Deploy the open repo to App Platform. Create a Droplet. Create a database. Search docs. State the monthly cost and wait | These create a resource we can bill. The router’s `search_tools` and `invoke_tool` do not carry this order |
| Rule | Ask before delete, resize, or anything that changes the bill | A one-click install is not a blank check |
| Sign-up on the same screen as sign-in | The OAuth redirect can create an account, take payment, and return to Cursor, Claude, or VS Code | Phase 2 OAuth assumes an account exists (`MCP-Phase2-PRD-improved.md`). The brief’s “sign up there” is the part that is not specified |

Phase 2 of this initiative, after Phase 1 completions are real: one inference skill on the same plugin. It runs when the user asks to call a model from the app that was just deployed, or when they explicitly ask for a trial. It uses the router. It does not add `genai-*.mcp.digitalocean.com` to the install. It states the price and stops at a ceiling. The default trial is a credit on the first successful deploy, not a credit for creating an account and not an open inference balance.

Leave out: a plugin per product, a DigitalOcean store for other people’s MCP servers, Windsurf and ChatGPT until they have an install we have tested, and any announcement of three stores on the same day.

App Platform MCP still cannot fetch build, deploy, or run logs (`ecosystem-gaps-2026-10.md`). Until that exists, the deploy skill has to say when the user must open the console. Shipping “the agent hosts it” over a logs gap will produce support tickets, not a campaign.

Account creation needs Identity, Payments, and Trust. The plugin repo cannot invent it. If the OAuth screen can only connect an existing account, Phase 1 still ships, and new signups stay on the normal DigitalOcean registration with a return URL. Say that in the listing. Do not fake in-client signup with a pasted token.

## How we go to market

Product marketing owns one week, after five people outside DigitalOcean install from the store and finish the prompt on a new account and an existing account: “Deploy this repo to DigitalOcean App Platform. Tell me the monthly cost before you create anything.”

The week uses one install link on surfaces we control: the remote MCP docs, one control-panel card for accounts with no grant, one blog post, and email to App Platform or Droplet users who have never connected MCP. The existing MCP cohort gets a migration note. Creator posts use the same link. A token pasted on camera fails the post. GitHub and YouTube are the organic surfaces that already show up in inference attribution. Use them for the deploy story.

Credits, if Legal and Trust approve them, attach to the first successful deploy, expire, and cap the balance. They do not attach to account creation. They do not attach to inference tokens alone. An inference-only credit recreates the 33% month-six cohort.

Ads wait. Ask Cursor and Claude for a changelog or directory mention. If they have no paid placement, do not plan a buy. Revisit paid social only after the week’s OAuth-completion and seven-day deploy rates are known, with Trust in the review because the fraud share of signup drop-off is still open. Do not mail people who already use MCP and call it acquisition.

## How we know

No marketplace-install baseline exists. Cursor publisher install counts were unconfirmed on 16 October. Manage the work off our events.

| Measure | What it tells us | Gate |
|---|---|---|
| Listing live and five external deploys | A stranger can finish | Required before any post |
| OAuth completions by client, split by account created vs existing | The shelf produced a grant | Baseline for 14 days. No numeric target until then |
| Resource created within 7 days | The session billed something | App, Droplet, or database tied to the grant. Join path still unproven in the PRD |
| Still paying at 90 days, with hosting or data | We did not buy an AI-only trial | Compare marketplace grants with `mcp.json` grants |
| Inference calls among those grants | The model skill is used | Report it. Do not make it the goal |
| Share of those inference users who still have hosting or data at 90 days | Inference rode a host | This is the only AI number that matches the churn data |
| Credit redemptions that never deploy, and abuse flags | The offer was farmed | Kill the credit if this shows up in the first week |

The 60-to-90-day read on the September MCP cohort is still open (`NOW.md`). Do not set a retention target from the month-one association until that read, or a matched cohort, exists.

## Risks and gaps

These are the reasons to stop, narrow, or refuse a piece of the brief. They are not a appendix.

| # | Risk or gap | What we do |
|---|---|---|
| 1 | The goal metric is wrong. AI-only month-one accounts keep 33% of logos at month six. Inference account churn is 16–18% a month. A win on “AI attach” is a loss on retention | Goal is a hosted resource and still paying at 90 days. Inference is reported, not targeted |
| 2 | MCP’s retention premium is selection. n=324 in month one. Matched cohort inside band is not run. September MCP counts jumped with a 67% jump in all API-active accounts and are provisional | Quote the association with the caveat. No retention promise in the PMM brief |
| 3 | In-client signup is unspecified. Phase 2 is connect, refresh, and revoke for an account that exists. Payment, team pick, and terms sit outside the plugin | Identity, Payments, and Trust sign the flow before build. If they cannot, ship connect-only and say so |
| 4 | 72% of signups never pay. Fraud vs low intent is `[not computed]`. Credits and ads buy the top of that funnel. September remote MCP is already full of unbilled first-time users | No credit on signup. Trust reviews the offer. Kill switch in week one |
| 5 | GenAI MCP servers exist and are invisible. Seven URLs, under 0.1% of MCP accounts. A skill that adds another URL fails the same way the docs fail | One router. Inference skill only in Phase 2, after a host exists, with a ceiling |
| 6 | Deploy is not finished. No App Platform logs in MCP. Limits, region, capacity, and cost arrive when create fails (37 of 75 interviews). The agent will report success the console does not show | Skill must show cost first and must send the user to logs when the tool cannot. Do not campaign “fully in the editor” |
| 7 | A model call plus create-on-install can run the bill up. No per-session harness limit. One interviewed founder’s agent went from under $100 to about $600 (`GQ 122248`) | Confirm-before-bill rule in Phase 1. Spend ceiling before any inference skill. Security reviews the listing |
| 8 | The plugin does not reach the Entry majority. Most Droplet-gap accounts never call the API. Under-$10 token users churn faster than console-only | Do not forecast Entry logo or revenue lift from this. Console and email stay the Droplet-attach channel |
| 9 | Store mechanics can bury it. Cursor reviews a public plugin repo and may not have been in the February partner set. Claude may reject a router that shows two generic tools. VS Code’s gallery has been default-off. We are absent from the official MCP registry and from Stripe Projects | Legal reads publisher terms first. Narrow server ready for Claude. No VS Code post until search returns us. Registry publish is part of Phase 1, not a campaign |
| 10 | We may not see installs. New-vs-existing is not on the completion event yet. Grant-to-create join is unproven. Cursor and Claude user agents are barely in the daily table (22 and 123 accounts on 15 September 2026) | Client and entry point on onboarding events before launch. Manage off OAuth and deploys |
| 11 | Two programs can be briefed as one. This file, the 16 October PRD, and Launchpad all touch “deploy from an agent.” Launchpad’s problem is life after create: Launchpad-created apps redeployed 7% of the time against 70% for an ordinary App Platform app | This initiative stops at install, grant, first deploy, and a bounded inference skill. Launchpad owns the ongoing app |
| 12 | GTM has no named owner. The plugin PRD still has Design, Docs, Analytics, Identity, Security, Legal, and GTM as TBD | Name PMM, Identity, and Trust before the five-person test. A social calendar with those seats empty does not start |

## Out of scope

- Raising Gradient or serverless-inference attach as the success metric.
- A credit or ad budget in the same decision as the plugin.
- A DigitalOcean marketplace of third-party MCP servers.
- GitHub Marketplace as an install surface for this plugin.
- Replacing the console for the 60% of Droplet-gap accounts who never call the API.
- Usage-based billing for MCP access.

## Open questions

1. Will Identity put account creation and payment on the MCP OAuth redirect and return the user to the client that started it? Which OAuth client registration does each store require?
2. Will Trust approve a deploy-tied credit, and what cap and expiry keep it off the fraud side of the 72%?
3. Does the router already front the seven GenAI servers, or does a skill still need those URLs? Claude’s review of `search_tools` / `invoke_tool` is the same open question as in the plugin PRD.
4. Who in product marketing owns the week, and has either store offered a paid placement since 16 October?

## Sources

- MCP rate by spend, September 2026: `02 Strategy and Research/DevEx Roadmap and Vision/supporting/tiered-gaps-stickiness-foundation.md` (from `snowflake-usage-revenue.md` §4). Entry headcount: same file, §3.
- Adoption and AI paths: `03 Data and Analysis/Data Analysis/docs/product_adoption_scaling_2026-10.md`.
- Retention, inference, remote MCP: `02 Strategy and Research/DevEx Usage and Retention/runs/2026-09/report.md` §3, §5, §7.
- Month-one cohorts, MCP URL mix, inference attribution: `02 Strategy and Research/DevEx Research/2026-10-run-04/programmatic-and-ai-growth-loops-plan.md`. Query `01c7d66b-041f-e6bb-001b-b50209a77a43`.
- Payment gate: `snowflake-activation.md` via `tiered-gaps-stickiness-foundation.md` and growth-loops claim C5.
- Plugin shape, store order, no ad product as of 16 October: `mcp-marketplace-plugins-pitch.md`, `MCP-marketplace-plugins-PRD.md`.
- OAuth scope of Phase 2: `01 Active Initiatives/MCP/MCP-Phase2-PRD-improved.md`.
- Logs gap, 25-of-25 study caveat, credentials: `02 Strategy and Research/DevEx Research/2026-10-run-04/ecosystem-gaps-2026-10.md`.
- Strategy spine this should not override: `02 Strategy and Research/DevEx Roadmap and Vision/why-these-initiatives.md`.
