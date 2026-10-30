# Product Marketing launch FAQ: DigitalOcean MCP plugin

For #marketing-and-comms-public. Filled 28 October 2026. Anything marked TBD or illustrative is not yet decided or validated.

## Basics

**Ship date (ready for release)**  
Public Preview: this week (week of 26 October 2026). Each listing goes live as its store approves it. There is no announcement at Public Preview.  
GA: when the Public Preview exit criteria below are met. GA date is TBD.

**Name of product**  
DigitalOcean MCP plugin (working name). Listed as “DigitalOcean” in the Cursor Marketplace, the Claude directory, and the VS Code MCP gallery.

**Product stage**  
Public Preview now, then GA. The only differences at GA are the announcement and the start of marketing. The product itself does not change. Stage names to be checked against [Product Lifecycle Stages at DigitalOcean](TBD-link).

**Public Preview exit criteria (to move to GA)**  
Counted across all marketplaces, excluding hackathon accounts:
- **20–30 active users.** Accounts that make real requests, not users who install, look around, and leave. Proposed bar: 3 or more successful tool calls.
- **10 new signups.** New DigitalOcean accounts whose first MCP use came through a plugin.

**Risks to timeline**
- Store review queues. Cursor curates its marketplace. Claude reviews connectors and may not accept a router that exposes only two generic tools. VS Code depends on the GitHub MCP Registry.
- Legal review of the open-source license for the plugin repo.
- Reaching the exit criteria without any announcement depends on organic store discovery and the existing docs.
- Counting users per store needs a source tag on each store’s plugin configuration.

**Links**
- PRD: `MCP-marketplace-plugins-PRD.md`
- GTM and campaigns: `MCP-marketplace-plugins-GTM.md`
- MCP Phase 2 PRD: `../MCP/MCP-Phase2-PRD-improved.md`
- Remote MCP docs: https://docs.digitalocean.com/reference/mcp/configure-mcp/

**Product Manager STO:** Vikranth Alapati  
**TPM:** TBD  
**Engineering STO:** Rajesh Manem

## The product

**What is it?**  
A DigitalOcean plugin that developers install from inside their AI tool: Cursor, Claude, or VS Code. One install connects the agent to DigitalOcean’s hosted MCP server. That server covers App Platform, Droplets, Databases, Kubernetes, Spaces, and other services. The plugin also teaches the agent common jobs: deploying an app, creating a Droplet, creating a database, and searching our docs. The agent shows the monthly cost before it creates anything, and asks before it deletes or resizes.

**How does a customer get it?**  
They find DigitalOcean in their tool’s catalog and install it:
- **Cursor:** Customize panel
- **Claude:** directory
- **VS Code:** search `@mcp` in Extensions

The first time they ask for something, they sign in to DigitalOcean in the browser. They don’t paste a token or edit a config file. In Cursor, team admins can also offer the plugin to their team, turn it on by default, or make it required.

**Which layer?**  
Core Cloud. Here the agent is a customer using our cloud, not a workload running on it. It also touches Managed Agents, because this is how coding agents reach DigitalOcean.

## The customer

**Who is it for?**  
Developers who build with AI coding agents and want to deploy without leaving their tool. They are often new to DigitalOcean. A second audience is engineering leads who want to allow DigitalOcean for a whole team.

**Three example companies and titles (all hypothetical)**

| Company type | Title | Why they would use it |
|---|---|---|
| Two-person SaaS startup building in Cursor | Founder and CTO | Ship an app from the editor without learning the console first |
| 20-person agency building client sites with Claude | Senior full-stack developer | Spin up a database and app per client, and see the cost before creating them |
| 150-person software company standardized on Cursor | Engineering manager | Make DigitalOcean available to the team without passing tokens around |

**Customers already using it?**  
Not the plugin, which launches this week. The underlying MCP server is already in use:
- 2,500+ users, 18,000 weekly requests, and 200,000+ total requests as of 10 August 2026 (MCP Phase 2 PRD draft).
- 6,614 accounts used MCP with our API in September 2026, up from 1,415 in June. September figures are provisional (October adoption report).
- 2,777 new accounts used MCP within 30 days of signup in September 2026, up from 444 in August. Also provisional (`sql/44_mcp_signup_incentives.sql`).

There is no named reference customer, and we are not recruiting design partners. GA quotes come from Public Preview users.

## The problem

**What customer problem are we solving?**  
A developer in an AI tool wants their app running on DigitalOcean. Today they have to leave the tool, find our docs, and paste a URL into a config file, often along with an API token. Most people in the middle of a task won’t do that. Those who do still get an agent that can create resources without saying what they cost.

Example use cases:
- “Deploy this repo to DigitalOcean.” The agent proposes an App Platform app, states the monthly cost, and deploys after the developer agrees.
- “I need a Postgres database for this.” The agent picks a size and region, states the cost, and creates the database.
- “Spin up a Droplet to test this.” The agent proposes a size and states the cost before creating the Droplet.
- “How do I configure this on DigitalOcean?” The agent answers from our docs and names the page.
- An engineering manager turns the plugin on for the whole team in Cursor’s admin settings.

**Why are current alternatives not good enough?**
- **Our current setup** is a doc page and a config edit, often with a token stored on disk. It works for people who have already chosen DigitalOcean, and loses everyone else mid-task.
- **The community listing** on cursor.directory is not ours. We can’t keep it current or connect it to our sign-in.
- **Competitor plugins.** AWS, Cloudflare, and Vercel have been in Cursor’s marketplace since it launched in February 2026, so developers who browse the catalog find them, not us.
- **The console and CLI** work, but they take the developer out of the agent session.

**What makes our solution different?**
- **One install covers the cloud.** One plugin and one sign-in reach 20+ DigitalOcean services through a single hosted server, with no per-product setup.
- **No token handling.** The developer signs in through the browser. Nothing secret is stored in a file.
- **Cost before create.** The agent states the monthly price and waits for a yes before it creates an app, Droplet, or database. It asks before deleting or resizing. We have not checked whether competitor plugins do this, so do not claim we are the only ones.
- **Simple, predictable pricing.** This is what lets a developer trust the cost the agent shows up front.

**What happens if we don’t launch?**  
Developers browsing these catalogs keep finding AWS, Cloudflare, and Vercel. MCP growth stays limited to people who already found our docs. The token-in-a-file setup stays our main path. As install habits form in these stores, getting in later gets harder. We give up the adoption, including AI-driven adoption, that these stores are starting to send.

## Messaging

**Three key messages**
1. **Deploy to DigitalOcean without leaving your AI tool.** Install once from Cursor, Claude, or VS Code, sign in once, and your agent can deploy apps, databases, and Droplets. *(Core value proposition.)*
2. **Know the cost before anything is created.** The agent shows the monthly price and waits for your yes.
3. **No tokens to manage.** You sign in through your browser. Nothing secret sits in a config file, and admins can enable it for a whole team.

## Press release (draft, for GA; not committed)

**DigitalOcean brings its cloud into AI coding tools**

*Developers can now install DigitalOcean from the Cursor Marketplace, the Claude directory, and VS Code, and deploy apps, databases, and Droplets from their AI agent, with the price shown before anything is created.*

[CITY], [DATE]. DigitalOcean today made its MCP plugin generally available in Cursor, Claude, and VS Code. Developers install it from their tool’s catalog, sign in once, and ask their agent to deploy. The agent sets up App Platform apps, Managed Databases, and Droplets, and states the monthly cost before it creates anything.

Until now, connecting an AI coding agent to DigitalOcean meant leaving the tool, editing a config file, and often pasting an API token. The plugin replaces that with one install and a browser sign-in. In Cursor, engineering leads can make it available to their whole team through admin settings.

The plugin connects to DigitalOcean’s hosted MCP server, which covers more than 20 DigitalOcean services. It includes guided steps for the most common jobs: deploying an app, creating a database, creating a Droplet, and searching DigitalOcean’s docs. Before it deletes or resizes anything, the agent asks first.

**DigitalOcean quote** *(illustrative; needs an executive owner)*: “Developers now start their work inside an AI agent. We want DigitalOcean to be one install away from that agent, with the price clear before anything is created.”

**Customer quote** *(illustrative; replace with a Public Preview user’s quote before use)*: “I asked my agent to deploy my app, saw the monthly cost, said yes, and it was live. I never opened the console.” — Founder, early-stage SaaS company

**Partner quote** *(illustrative; requires the partner’s agreement)*: “Developers want to go from code to running app without leaving their agent. DigitalOcean in our marketplace makes that one install.” — [Name, title], Cursor or Anthropic

The DigitalOcean plugin is available now. Search for DigitalOcean in Cursor, Claude, or VS Code.

**Proof points**
- **Customers who have seen value:** none from the plugin yet. Public Preview users provide these before GA.
- **Usage of the MCP server today:**
  - 2,500+ users and 200,000+ total requests as of August 2026.
  - 6,614 accounts used it in September 2026, provisional.
- **Business signals.** These are correlation only. Developers who choose agents may spend more anyway.
  - New accounts that used MCP within 30 days reached $100 in spend within 90 days at 29.4%, against 9.4% for other new billing accounts (January–June 2026 signups).
  - Accounts that used MCP in January–March 2026 added a new product by July–September at 21.8%, against 11.3% for comparable API users without MCP.
- **Technical:** one hosted server and one OAuth sign-in across 20+ services. No latency or reliability benchmarks have been published.
- **At GA, add:** Public Preview active users and new signups, from the exit criteria.

## Note for PMM

This is a small launch, and we want to use as few resources as possible. Public Preview needs no PMM work: the listings go live with no announcement. PMM support starts at GA, which means one announcement and the start of marketing. Campaign details are in the GTM doc, including an optional spend-based credit offer that needs Finance approval.
