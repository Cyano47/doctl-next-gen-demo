# Marketplace plugins for DigitalOcean MCP

**Status:** Public Preview this week. GA follows once the exit criteria in section 7 are met.  
**Owner:** Vikranth Alapati  
**Engineering:** Rajesh Manem  
**Last updated:** 28 October 2026  
**Related:** `MCP-marketplace-plugins-GTM.md` (launch and campaigns) · `../MCP/MCP-Phase2-PRD-improved.md` (OAuth and router)

## 1. Problem and why now

A developer is in Cursor with a repo open and wants it running on DigitalOcean. To do that today, they leave the editor, find our docs, and paste `https://mcp.digitalocean.com/mcp` into `mcp.json`, often with an API token. Most people in the middle of a task will not do that.

Cursor, Claude, and VS Code now let users add tools from a catalog inside the product. AWS, Cloudflare, and Vercel were in Cursor’s marketplace from its launch on 17 February 2026. No official DigitalOcean listing was found in Cursor on 16 October 2026. A community page on cursor.directory exists, but we do not control it.

MCP Phase 2 gave us one OAuth sign-in and one router. It did not give us an install button inside the client. It also did not teach the agent to show the price before it creates something. The router only exposes two tools: `search_tools` and `invoke_tool`.

The stores are new, and install habits are forming now. If we wait, developers learn to reach for someone else.

## 2. Users

- **Developer in an AI client.** Wants to deploy from the editor, see the cost first, and avoid handling tokens.
- **Team admin.** Wants to allow or remove DigitalOcean for a team without checking each laptop. No buyer has asked for this yet. Cursor already supports it, so the plugin must not block it.

## 3. Pain points

1. DigitalOcean is not in the catalog the developer already has open.
2. Setup means editing a file and often putting a token on disk.
3. After setup, the agent can create resources without stating the cost first.
4. An admin cannot turn a URL in one person’s config on or off for a team.

## 4. Solution

Ship **one plugin**, not a plugin per product. It contains:

| Piece | What it does |
|---|---|
| Router connection | Points at `https://mcp.digitalocean.com/mcp`. Uses OAuth on first use. No token in the file. |
| Four skills | Deploy an app, create a Droplet, create a database, search docs. Each loads from what the user says, not a slash command. |
| Cost and safety rule | State the monthly cost and wait before creating anything. Ask before delete, resize, or any change that raises the bill. |
| Listing | Name, one-line description, three screenshots, and the first prompt to try. |

The rule is an instruction to the model, not a permission check. OAuth scopes still decide what the agent is allowed to do.

## 5. Key flows

**Install and deploy** (shown for Cursor; Claude and VS Code are the same after install)

1. User installs DigitalOcean from Cursor’s Customize panel, the Claude directory, or VS Code’s `@mcp` gallery.
2. User asks the agent to deploy the open repo.
3. Client opens DigitalOcean sign-in. User signs in and approves access.
4. Agent states the monthly cost and waits.
5. User agrees. Agent creates the app and returns the URL.

If sign-in fails, the agent asks the user to try again. It must not ask for a token instead.

**Existing token user**

1. User installs the plugin and signs in.
2. User deletes the old `mcp.json` entry and revokes the old token.

The old entry keeps working until the user removes it. This project does not turn off token access.

## 6. Requirements

The plugin must:

- Live in one public Git repo that passes Cursor review.
- Contain no token, client secret, or refresh token.
- Use the scopes the router already requests. No new scopes.
- Pass this test prompt: *“Deploy this repo to DigitalOcean App Platform. Tell me the monthly cost before you create anything.”* A pass states a real cost and creates nothing until the user agrees. The team runs it on a new account and an existing account in each store. No design partners.
- Pass Legal review of the open-source license before submission. No other sign-off is required.
- Carry a distinct, non-secret source tag per store, so usage can be counted by marketplace. Engineering picks the cheapest way, for example a query parameter on the router URL.

Launch stages:

| Stage | What happens | Moves on when |
|---|---|---|
| Public Preview (this week) | Submit to Cursor, Claude, and VS Code together. Each listing goes live as its store approves it. No announcement. | 20–30 active users and 10 new signups across all stores, excluding hackathon accounts |
| GA | Announcement and start of marketing. The product does not change. | — |

Claude may not accept a router that only shows two generic tools. If review fails, we submit a smaller connector for App Platform, Droplets, Databases, and Docs, just for Claude. Cursor and VS Code stay on the router.

## 7. Success metrics

The goal is more adoption, and more AI-driven adoption in particular.

**Public Preview exit (the only targets in this PRD):**

| Measure | Target | Definition |
|---|---|---|
| Active users | 20–30 | Accounts with 3 or more successful tool calls through a plugin (proposed bar). Installing and leaving does not count. |
| New signups | 10 | New DigitalOcean accounts whose first MCP use came through a plugin |

Both are counted across all stores. Hackathon accounts are excluded. The hackathon promo code or account list is TBD.

**Ongoing, tracked without targets:**

| Metric | What it shows |
|---|---|
| OAuth completion rate, by client | Install led to a sign-in |
| Share of sign-ins that are new accounts | The plugin brings new customers, not just reconnects (not computed today) |
| Successful tool call within 24 hours | The user got past setup |
| App, Droplet, or database created within 7 days | The session led to something we bill (join not yet proven) |

The per-store source tag in section 6 is the minimum needed to count these. At 90 days, compare marketplace users with `mcp.json` users.

## 8. Scope

**In:** one plugin, four skills, the cost and safety rule, Cursor, Claude, and VS Code listings in Public Preview at the same time, and the per-store source tag.

**Out:**

- A DigitalOcean marketplace for third-party MCP servers
- A plugin for each product
- Local `npx` server, subagents, or hooks in the plugin
- Turning off token access (MCP Phase 2 owns this)
- Enforcing the safety rule in the gateway
- Windsurf, ChatGPT, or any store without a working install path

## 9. Risks

| Risk | Mitigation |
|---|---|
| OAuth fails in a store or falls back to a token | Hold that store’s listing until a new account signs in cleanly |
| Claude rejects the router | Submit the smaller Claude-only connector |
| The model skips the cost or the delete check | Catch it in team testing. Do not claim the gateway enforces it. |
| Open-source license conflicts with a hosted server | Legal reviews the license before submission |
| Stores do not share install counts | Count active users and signups through the source tag |
| Exit criteria are not met without an announcement | Point the existing remote MCP docs at the listings. This costs no marketing. |

## 10. Open questions

1. Will Cursor review a cloud plugin that was not in its launch partner set, and how long does review take?
2. Which OAuth client setup does each store require?
3. Will Claude accept the router, or do we need the smaller connector from the start?
4. Which scope names will the sign-in screen show? This is blocked on MCP Phase 2.
5. How do we identify hackathon accounts so we can exclude them?

## Appendix A. Sources

- DigitalOcean remote MCP docs, verified 14 October 2026: https://docs.digitalocean.com/reference/mcp/configure-mcp/
- MCP Phase 2 draft, 10 August 2026: `../MCP/MCP-Phase2-PRD-improved.md`
- Cursor marketplace launch: https://cursor.com/blog/marketplace
- Cursor plugins: https://cursor.com/docs/plugins
- Claude connector submission: https://claude.com/docs/connectors/building/submission
- VS Code MCP gallery: https://code.visualstudio.com/docs/agent-customization/mcp-servers
