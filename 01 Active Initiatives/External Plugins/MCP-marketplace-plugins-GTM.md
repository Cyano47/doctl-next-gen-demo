# GTM and campaigns: DigitalOcean MCP marketplace plugin

**Status:** Public Preview this week; GA after exit criteria  
**Owner:** Vikranth Alapati  
**Last updated:** 28 October 2026  
**Product spec:** `MCP-marketplace-plugins-PRD.md`

## 1. Goal

Get more adoption, and more AI-driven adoption, by putting DigitalOcean in the catalogs developers already use: Cursor, Claude, and VS Code. Success means real use and new accounts. Installs alone do not count. This is a small launch, so use as few resources as possible.

## 2. Principles

- **Public Preview is quiet.** Listings go live with no announcement and no PMM work.
- **GA is the announcement.** GA changes nothing in the product. It means we announce and start marketing.
- **One link per store.** Every surface points at that store’s listing.
- **No design partners.** The team tests the install itself, and Public Preview users supply the proof.
- **No ads.** We found no paid placement product in Cursor or Claude.
- **Never teach `mcp.json` in a campaign.** It stays in the docs as a fallback.

## 3. Public Preview (this week)

- Submit to Cursor, Claude, and VS Code together. Each listing goes live as its store approves it.
- The team runs the test prompt in each store on a new account and an existing account before that listing is public:

> Deploy this repo to DigitalOcean App Platform. Tell me the monthly cost before you create anything.

- Update the remote MCP docs to link each listing. This is the only promotion at this stage.

**Exit to GA.** Counted across all stores, excluding hackathon accounts:
- 20–30 active users, meaning accounts with 3 or more successful tool calls through a plugin (proposed bar).
- 10 new signups, meaning new DigitalOcean accounts whose first MCP use came through a plugin.

## 4. GA launch week

Run it as one concentrated week. Keep it small.

| Surface | Action | Audience |
|---|---|---|
| Docs | Remote MCP page leads with the three install links. The JSON setup moves below as a fallback. | Anyone reading MCP docs |
| Blog | One post about the install and a real deploy, not the protocol. Use a Public Preview user’s quote if we have one. | Public |
| Control panel | One card linking to the listings | Accounts with no MCP sign-in yet |
| Email | One send | Active App Platform or Droplet users who have never connected MCP (audience size not computed) |
| Cursor and Anthropic | Ask for a marketplace or changelog mention. The week still runs if they say no. | Their users |

Optional if resources allow: the control panel card, the email, and creator videos. The docs and blog are the minimum.

## 5. Store notes

- **Claude:** have the reviewer test account ready before submitting. If the router is rejected, submit the smaller connector. Do not ask for a Verified badge.
- **VS Code:** after publishing, search `@mcp` in VS Code. If DigitalOcean does not appear, leave it out of the docs and the GA post.

## 6. Measurement

| Measure | Source |
|---|---|
| Active users and new signups, by store | Per-store source tag on plugin traffic, joined to account creation date |
| OAuth completions by store | MCP Phase 2 onboarding events |
| Resource created within 7 days | Create events tied to the sign-in (join not yet proven) |

Do not rely on store install counts, which stores may not share. Exclude internal, free, abuse, locked, and hackathon accounts.

## 7. What we will not do

- Announce during Public Preview
- Recruit design partners
- Buy placement we have not been offered
- Send acquisition emails to people who already use MCP
- Mention a store listing in marketing before a new account has signed in through it

## 8. Effort

Small. The work is engineering on the plugin repo and the source tag, Legal on the license, a docs update, and one GA post. Everything else is optional.

## 9. Incentives

**Proposal.** Two offers for new users who arrive through the plugin:

1. A $50 signup bonus on Knowledge Bases or Memory.
2. A $500 credit once a new user from the Claude plugin has spent $500. Nothing is given at signup. The user becomes a billing account first, and the credit rewards spend.

### What the data shows

New clean team accounts created January to June 2026 that became billing accounts within their first three invoice months. “MCP signup” means the account made an MCP API request within 30 days of signup. Spend is net revenue after discounts and credits. Source: `03 Data and Analysis/Data Analysis/sql/44_mcp_signup_incentives.sql`, run 28 October 2026.

| Measure | MCP signups | Other new accounts |
|---|---|---|
| Billing accounts | 527 | 199,038 |
| Spent $100+ in 90 days | 29.4% | 9.4% |
| Spent $250–499 in 90 days | 7.4% | 1.3% |
| Spent $500+ in 90 days | 3.8% (20 accounts) | 0.6% |
| Median spend in 90 days | $54 | $18 |
| Spent $500+ in 180 days (Jan–Mar signups) | 14.5% of 227 | 2.4% of 102,156 |
| Still paying in months 4–6 (Jan–Mar signups) | 78.9% | 62.0% |
| Used Agent Platform in 90 days | 2.5% | 0.3% |
| Used Serverless or Dedicated Inference in 90 days | 4.0% | 0.7% |
| Received the $200 free-trial credit | 6.8% | 7.7% |

Volume is rising fast. MCP signups were 73 in January, 223 in June, 444 in August, and 2,777 in September, almost all remote. From January to August, 59% to 82% of them became billing accounts within a month, against about 1 in 5 of all signups. September looks lower at 37%, but October invoices have not closed and September traffic is provisional.

### What this means

**Billing is not the bottleneck.** Most MCP signups already add billing. Giving the credit after billing, not at signup, is the right structure. It costs nothing for users who never pay.

**$500 is too far away.** The median MCP signup spends $54 in 90 days. Only 3.8% reach $500 in 90 days and 14.5% in 180 days. A reward ten times typical spend changes behavior for almost no one. It mostly pays users who would have spent $500 anyway. At the 180-day rate, that is about $73 per billing account (14.5% × $500), nearly all on revenue we would have earned regardless. A 100% match also halves the price of a user’s first $1,000. Finance has to approve that margin.

**The $50 bonus targets a product this group barely uses.** Only 2.5% of MCP signups touched Agent Platform in 90 days. The median Agent Platform spend among them was $0.24. Knowledge Bases are not billed as their own product, and no Memory product appears in billing, so we cannot measure the bonus directly today. It is cheap, because unused credit expires, but it will tell us little. If we keep it, the plugin needs a Knowledge Base skill. None of the four v1 skills covers it. Measure product adoption, not credits issued.

**We cannot target Claude users yet.** Remote MCP traffic uses the same user agent for every client. Until the `client` field from the PRD ships, we can neither give the offer only to Claude plugin users nor measure it for them.

**None of this proves cause.** MCP signups are developers who chose to use an agent. They would likely spend more without any credit.

### Recommended shape

- **Add a nearer first step.** For example, spend $100 in the first 60 days and earn $50. Then spend $500 in the first 180 days and earn $250. These amounts are illustrative; Finance sets the real ones. The first step sits where 29% of MCP signups already land. The second targets the 7% who reach $250–499 and stall.
- **Pay only on cleared payment.** Hold the credit until the charge settles, expire it after 90 days, and exclude flagged accounts. Credit-after-spend still invites stolen-card spend.
- **Tie the signup bonus to what the plugin teaches.** That means App Platform or Managed Databases, or Knowledge Bases only if a Knowledge Base skill ships.
- **Run it as a test, after GA, and only if resources allow.** Randomly split eligible plugin signups into an offer group and a no-offer group. Detecting a lift from 29% to 34% on “spent $100 in 90 days” needs about 1,400 billing accounts per group (5% significance, 80% power). At September’s pace of about 1,000 MCP billing accounts a month (provisional), that takes about three months. The spend window adds another 90 days before the read.

## 10. Open questions

1. How do we identify hackathon accounts so we can exclude them?
2. Will Cursor or Anthropic mention the plugin at GA?
3. Can the control panel card and docs link be tagged so we can see which one drove a sign-in?
4. How large is the email audience? This needs a query.
5. What credit amounts and margin will Finance approve?
6. Do we add a Knowledge Base skill to justify the $50 bonus, or move the bonus to App Platform or Managed Databases?
7. What drove September’s jump in MCP signups, and does it hold in October?
