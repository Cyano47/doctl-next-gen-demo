# Marketplace plugins for DigitalOcean MCP

**Audience:** Senior product, engineering, design, and GTM. This is a decision pitch, not a PRD.  
**Author:** Vikranth Alapati  
**Date:** 16 October 2026  
**Ask:** Approve one DigitalOcean plugin and a Cursor-first campaign. Do not approve a three-store launch or a DigitalOcean tool marketplace.

## The decision

A developer who already lives in Cursor, Claude, or VS Code should find DigitalOcean the way they find Cloudflare or Vercel: install a plugin, sign in, and deploy. Today they do not. Our docs tell them to paste `https://mcp.digitalocean.com/mcp` into `mcp.json`. That is why marketplace distribution is an acquisition problem, not a packaging exercise.

Ship one plugin. List it in Cursor first. Run campaigns only after a stranger can install it and finish OAuth. Open Claude second. Treat VS Code as a publish-and-confirm step, not a launch.

## Who is stuck, and why

The person we want is already in an agent and is about to create infrastructure. They are not browsing docs.digitalocean.com. They open Customize in Cursor, the Claude directory, or the VS Code extensions view, and they install what is on that shelf.

What they find there today is not us. Cursor’s marketplace launched on 17 February 2026 with a curated set that already includes AWS, Cloudflare, and Vercel for infrastructure, plus Stripe, Figma, Linear, Amplitude, and others. Claude’s marketplace says it has over 2,000 connectors and plugins. VS Code can install MCP servers from a gallery backed by the GitHub MCP Registry.

What we offer instead is a configuration file. The remote docs, last verified 14 October 2026, still say: add the router URL to `mcp.json`, then authenticate with OAuth or a bearer token. Claude, Cursor, VS Code, and Windsurf each get a different set of manual steps. A community page exists on cursor.directory. That is not the Cursor Marketplace.

The cause chain is short.

1. The user never sees DigitalOcean, because we are not in the store they already have open.
2. The user who does find the docs must edit a config file. Many of them also paste a long-lived API token. The docs warn them not to commit it. The warning is the product.
3. A successful paste still does not teach the agent what to do. The router exposes two tools, `search_tools` and `invoke_tool`. Cloudflare’s Cursor plugin ships skills plus MCP servers, so the agent knows when to deploy and which tool to call. A bare URL does not.

Phase 2 of MCP is the access layer: one OAuth connection, one router, observability. As of the 10 August 2026 draft, that work had reached 2,500+ users, 18,000 weekly requests, and 200,000+ cumulative requests. Those figures are from that draft, not a fresh query. Phase 2 also says it will not build a public marketplace for third-party MCP servers. This pitch does not reverse that. We are listing DigitalOcean in other companies’ stores.

## Why we need the plugin

Someone is in Cursor with a repo open. They want it running, they want the monthly cost before anything is created, and they want it on their DigitalOcean account. Four things have to happen in that sitting. A URL in our docs completes none of them.

The client has to offer DigitalOcean as something they can add. Cursor, Claude, and VS Code add capabilities from a catalog inside the product. A doc page is another site and a JSON edit. People mid-task do not do that. AWS, Cloudflare, and Vercel are already in Cursor’s catalog, so they get the attempt. We get the attempt from people who already decided to follow our docs. That is the base Phase 2 already reached. It is not how a new account starts.

Adding it has to sign them in. The result we can count is an account grant: a new signup, or an existing account connected. OAuth on first use is that grant. A bearer token in a file is a secret on disk, and we cannot tell a signup from a reconnect. Install and sign-in have to be the same action. Phase 2 makes the OAuth possible. It does not put the button in the client.

The signed-in agent has to do the job in order. The router exposes `search_tools` and `invoke_tool`. It does not expose “price this app, then create it,” and it does not expose “ask before you delete.” A model with only those two tools will search, call, and skip the price, or it will change the bill. The procedure has to arrive with the install, and it has to run when the user says “deploy this,” because they will not type a command name and they will not go back to the docs. A prompt that lives on our site never reaches the person who clicked Install.

A company has to be able to allow it. The Phase 2 secondary user is the admin who approves production use. A URL on one laptop is invisible to them. They cannot turn it on for the team, and they cannot turn it off. Cursor already lets an admin mark a team plugin Default Off, Default On, or Required. A Claude org owner chooses which directory sources members see. No buyer has told us this is why they said no. The listing still has to be an object an admin can allow, or the team rollout stays a hunt across developer machines.

Four substitutes fail this job.

A procedure with no server. The model will describe a deploy. It will not create one, and no account will be signed in.

The server with no procedure. That is the product we have. The 2,500+ users got through a README. The next user should not have to.

A plugin per service. The Phase 2 draft expects 20–25 servers. Twenty installs recreates the problem that draft was written to end: many endpoints, many credentials, and no single place the model looks. One plugin, pointed at the router. If Claude’s review cannot evaluate a two-tool router, narrow that one listing. Leave the catalog in one place.

A community directory page as the official path. We do not control what it installs, we cannot bind it to our OAuth client, and customers will still treat a broken install as ours.

The cost moves to us. The customer stops keeping a config file alive. We keep the repo, the store review, the procedure, and the OAuth client current when the API or the client’s install format changes. That is the work this pitch funds. A clearer README stays outside the client, and a campaign cannot send someone to a JSON block and call that an onboarded user.

## What we ship

One plugin. Not a plugin per service.

| Piece | What it is | Why it is in v1 |
|---|---|---|
| Remote server | `https://mcp.digitalocean.com/mcp`, OAuth, no token in the file | One install, one sign-in, the catalog the router already fronts |
| Skills | Deploy an app, create a Droplet, create a database, search docs | These are the jobs that create an account or a resource. The agent needs the steps, not only the tools |
| Rule | Ask before delete, resize, or anything that changes the bill | A one-click install must not imply a blank check |
| Listing | Name, one-line job, icon, three screenshots of a real deploy, the first prompt written out | In these stores the listing is the ad |

Leave out of v1: a plugin per product, a local `npx` server, subagents, and hooks. The local package remains a fallback for clients that cannot do remote OAuth.

Cursor can take this shape now. A plugin is a public Git repo with `.cursor-plugin/plugin.json`, skills, and an `mcp.json` that points at the hosted router. Submit at [cursor.com/marketplace/publish](https://cursor.com/marketplace/publish). Every plugin is manually reviewed, must be open source, and updates are reviewed again. The open-source requirement covers the plugin repo. The server stays hosted. Legal should confirm that reading of the publisher terms before we submit.

Claude needs two submissions, not one. A connector is the remote server. A plugin is the skills bundle. Anthropic lists a scanned connector as Community by default. Verified is a later review, and we do not apply for it. The portal requires OAuth 2.0 for anything that acts on a user account, a title and a `readOnlyHint` or `destructiveHint` on every tool, a privacy policy, docs, a support contact, and a populated test account. Reviewers run the tools.

That last point is a product risk. Claude syncs the tools it can see. Our router shows two generic tools and hides the real catalog behind `search_tools`. We do not yet know if that fails review. For the Claude submission, be ready to list a narrower server (App Platform, Droplets, Databases, Docs) with real annotations if the router listing comes back weak. Do not block the Cursor plugin on that question.

VS Code does not take a Cursor plugin. Publish metadata to the GitHub MCP Registry, which powers the `@mcp` gallery, and to the [official MCP Registry](https://registry.modelcontextprotocol.io/) under a `digitalocean.com` namespace we prove we own. The official registry is a metadata source for other stores. Publishing there does not list us in Cursor or Claude.

## Where we show up, in order

| Order | Store | What “listed” means | Why this order |
|---|---|---|---|
| 1 | Cursor Marketplace | Reviewed plugin, install from Customize, OAuth on first tool call | Infra competitors are already on this shelf. Our docs already treat Cursor as a primary client. Team admins can later offer the same plugin as Default Off, Default On, or Required |
| 2 | Claude directory | Connector plus skills plugin, Community at minimum | Largest catalog. A plugin added on claude.ai is also available in Cowork and Claude Code. Useless until OAuth works in Claude |
| 3 | VS Code gallery | Server appears for `@mcp` and install works in Copilot Chat | The gallery has been a preview and was default-off in earlier VS Code builds. Confirm the listing is visible before we tell anyone to search for it |

Windsurf stays on the manual docs path until it has a store with a real install. ChatGPT and other app stores are out of this pitch. We found no self-serve ad product in Cursor or Claude. Do not plan a media buy.

## How we run campaigns

A campaign here is not a budget spread across channels. It is one install link, repeated on surfaces we control, for one week, after the install works.

### Before any announcement

The listing has to stand alone. Someone who has never read our docs should understand the job from the name and the first prompt. Example first prompt, used in the listing, the docs, and the blog:

> Deploy this repo to DigitalOcean App Platform. Tell me the monthly cost before you create anything.

Five people outside DigitalOcean install from the marketplace, not from a gist, and complete that prompt on a fresh account and on an existing account. Fix whatever stops them. That is the soft launch. Do not announce over a broken OAuth screen.

### Cursor week

Run one week, not a drip.

Owned surfaces, all pointing at the same install:

- **Docs.** The remote MCP page leads with Install in Cursor. The `mcp.json` block stays below as the fallback.
- **Control panel.** One card for accounts with no MCP OAuth grant: “Use DigitalOcean from Cursor.” Deep-link to the plugin. No card for people who already connected.
- **Blog.** One post. The story is the install and the deploy, not the protocol.
- **Email.** Active App Platform or Droplet users who have never connected MCP. The existing MCP cohort gets a short migration note, not this campaign. The size of the email slice is not computed.
- **Cursor.** Ask for a marketplace mention or a partner line in their changelog. They may say no. The week still runs.
- **Creators.** Five developers who already publish Cursor workflows. Give each a populated account and the prompt above. The video must use the install link. A token pasted on camera is a failed video.

Cursor install links already exist for a raw MCP config (`cursor://anysphere.cursor-deeplink/mcp/install?...`). Prefer the marketplace install once the plugin is approved, so we also install the skills. Use the raw deep link only as a fallback.

### Claude, only after Cursor

Open Claude when Cursor’s OAuth completion is good enough that we would send a stranger there. “Good enough” is a number we set from the first 14 days, not a guess in this doc.

Submit the connector and the skills plugin together. Staff the reviewer test account before submission. Use the usage metrics Anthropic shows publishers after the listing is up. Do not email or blog a Community listing until someone outside the company has connected from the directory and run a tool.

Push the listing toward Verified by meeting the checklist, not by asking for a badge.

### VS Code, after the listing is real

Publish. Search `@mcp` in VS Code. If DigitalOcean is there and install works, add one docs section and stop. If it is not there, do not campaign. A blog that sends Copilot users to an empty search is worse than silence.

### What we will not do

- Announce three stores on the same day.
- Buy ads. We do not have a placement product to buy.
- Teach `mcp.json` in the campaign. That path remains in docs for clients we do not support yet.
- Mail the people who already use MCP and call it acquisition.

## How we know it worked

We do not have a marketplace-install baseline. Targets wait for 14 days of Cursor data. Until then, the only honest claim is that these counts do not exist yet.

| Measure | What it tells us | Source |
|---|---|---|
| Listing live | We are on the shelf | Store page |
| Installs | The shelf is doing its job | Cursor: not confirmed that publishers get a count. Claude: publisher usage metrics after listing. Mark Cursor installs as unknown until we see the dashboard |
| OAuth starts and completions, by client | Install led to a DigitalOcean sign-in | Onboarding events. Phase 2 already calls for start and completion events. Tag the client |
| New account vs existing account | “Onboarded from the marketplace” means a new account, not a reconnect | OAuth flow. Not computed |
| First successful tool call within 24 hours | They got past sign-in | Gateway telemetry |
| A resource created within 7 days | The session did something we bill | App, Droplet, or database create, tied to the OAuth grant |
| Second session within 7 days | They came back | Same telemetry |

The 90-day read is a ratio, not a vibe: of new MCP connections, how many started in a marketplace client, and how many of those made a successful tool call within 24 hours. Compare that cohort with people who still connect by pasting `mcp.json`. Follow them for 60 to 90 days. That comparison is the reason to continue, fix, or stop.

## Risks

| Risk | What we do |
|---|---|
| OAuth fails or falls back to a token paste | No campaign until a fresh account finishes in the store’s own install flow |
| Claude rejects or buries the router because only two generic tools are visible | Submit a narrower, annotated server for Claude. Keep the router for Cursor |
| One-click install plus destructive tools | The plugin rule asks first. Scopes stay least-privilege. Security reviews the listing before submission |
| Open-source publisher terms vs a hosted server | Legal reads the Cursor publisher terms and the Anthropic directory terms before we apply. Partnership review applies |
| We cannot see Cursor install counts | Do not manage the campaign off installs. Manage it off OAuth completions by client |
| A featured placement never comes | The week does not depend on it |
| This gets mistaken for building a DigitalOcean MCP app store | Out of scope. Say so in the review |

## Out of scope

- A public marketplace of third-party MCP servers. Phase 2 already excludes this.
- Usage-based billing for MCP.
- A plugin for every DigitalOcean product.
- Windsurf, ChatGPT, and any store without a confirmed install path.
- Paid placement we have not been offered.

## Open questions

1. Will Cursor review a cloud plugin that was not in the February partner set, and will they show publishers install counts?
2. Which OAuth client registration does each store require: dynamic registration, a client-ID metadata document, or a client secret we hand to Anthropic or Cursor?
3. Does Claude accept `search_tools` / `invoke_tool`, or do we need the narrower server for that listing?
4. Who is the design partner for the five external installs? Phase 2 still has the hero customer as TBD.

## Sources

- DigitalOcean remote MCP docs, verified 14 October 2026: https://docs.digitalocean.com/reference/mcp/configure-mcp/
- MCP Phase 2 draft, 10 August 2026: `../MCP/MCP-Phase2-PRD-improved.md` (user counts and the third-party marketplace exclusion)
- Cursor marketplace launch, 17 February 2026: https://cursor.com/blog/marketplace
- Cursor plugin submission and review: https://cursor.com/docs/plugins and https://cursor.com/help/security-and-privacy/marketplace-security
- Cursor MCP install links: https://cursor.com/docs/mcp/install-links
- Cloudflare’s Cursor plugin (skills plus MCP): https://cursor.com/marketplace/cloudflare
- Claude marketplace (“Over 2,000 connectors and plugins”): https://claude.com/marketplace
- Claude connector submission requirements: https://claude.com/docs/connectors/building/submission
- Claude plugins, including availability in Cowork and Claude Code: https://claude.com/docs/plugins/overview
- Official MCP Registry, and the note that host apps should use downstream stores: https://modelcontextprotocol.io/registry/about
- VS Code MCP gallery: https://code.visualstudio.com/docs/agent-customization/mcp-servers
