# DevEx usage and retention: January to September 2026

**Run:** 2026-09 (backfill), produced 8 October 2026 · **Definitions:** v1, see [definitions.md](../../definitions.md) · **Data:** [data/](data/) · **SQL:** [sql/](sql/), rendered from the pack in [../../sql/](../../sql/)

**Population:** clean team accounts (no test, abuse, admin-locked, free, free-employee or `@digitalocean.com` accounts). Suspended, hold and deleted accounts are kept, because they are the churners. **Active** = gross billable usage above $0 in the month (`MFD.INVOICE_ITEMS_NET`). **Churned** = active in M with no billable usage in M+1 to M+3. Churn is final for January to June, provisional for July and August, and not yet known for September.

Revenue here is invoice-item gross and net, not GAAP revenue.

## 1. Who the active accounts are

| Month | Active | New or returning | Gross | Net |
|---|---:|---:|---:|---:|
| Jan | 620,237 | 42,776 | $78.0M | $64.6M |
| Feb | 640,222 | 54,782 | $81.3M | $64.6M |
| Mar | 665,916 | 63,760 | $88.8M | $67.5M |
| Apr | 679,000 | 56,969 | $96.4M | $72.1M |
| May | 690,311 | 52,805 | $100.1M | $71.9M |
| Jun | 692,943 | 49,011 | $97.6M | $72.5M |
| Jul | 696,391 | 46,192 | $105.1M | $77.0M |
| Aug | 690,891 | 42,137 | $124.3M | $79.1M |
| Sep | 692,622 | 48,764 | $150.6M | $94.3M |

The base grew 11.3% from January to May, then flattened at about 690K. In September:

- **Spend:** 40% of active accounts spent under $10, and 39% spent $10 to $50. The 1,111 accounts at $5K or more were 0.2% of the base and 69% of gross.
- **Tenure:** 54% are more than two years old. 5.4% were created that month.
- **Email:** 64% use a free email domain. Business-domain accounts carry 86% of gross.
- **Students:** 3.8% (26,171) used the GitHub Student Pack. They carry 0.2% of gross.

## 2. API tokens

**Holding and creating personal tokens** (proxy definition; the application IDs are [UNVERIFIED] with IAM):

| Month | Accounts creating a token | Accounts holding a valid token at month end | Active accounts holding one | Share of active base |
|---|---:|---:|---:|---:|
| Jan | 10,316 | 34,964 | 29,426 | 4.7% |
| Mar | 15,272 | 42,519 | 36,276 | 5.4% |
| Jun | 18,343 | 51,353 | 43,983 | 6.3% |
| Aug | 20,245 | 56,964 | 48,111 | 7.0% |
| Sep | 26,614 | 61,435 | 50,940 | 7.4% |

- Accounts holding a token grew 76% in nine months, against 12% for the base.
- The 90-day expiry is the most common choice: 12,700 accounts created one in September, up from 5,326 in January.
- The no-expiry RBAC token (app 109918) appeared in April. It peaked at 2,811 accounts in June and fell to 1,702 in September.
- The "read write" no-expiry app (30327) jumped from 1,238 accounts in August to 6,166 in September. The cause is unknown [UNVERIFIED].

**Using an API token** (any programmatic API call, excluding internal, Kubernetes-controller, registry and browser traffic; daily table):

| Month | Accounts using one | Share of active | Share of gross | Churn, used | Churn, console only |
|---|---:|---:|---:|---:|---:|
| Jan | 39,612 | 6.4% | 51% | 3.4% | 5.5% |
| Mar | 45,872 | 6.9% | 57% | 3.9% | 6.5% |
| Jun | 49,843 | 7.2% | 61% | 4.2% | 6.1% |
| Jul | 53,774 | 7.7% | 64% | 4.9%* | 6.9%* |
| Aug | 47,109 | 6.8% | 64% | 4.1%* | 7.0%* |
| Sep | 66,250 | 9.6% | 76% | – | – |

\* provisional. May and August are depressed by low daily-table coverage (section 8). Compare September with July (+23%), not with August.

**September snapshot** (`LAST_USED_AT`): 649,844 valid tokens across 61,435 accounts.

- 26,096 accounts used one in September.
- 19,295 accounts hold tokens idle for 90 days or more.
- 284,230 tokens have never been used, and they belong to just 3,067 accounts, about 93 each. That points to scripted token creation.

**Agent endpoint keys:** accounts creating one peaked at 652 in April and fell to 179 in September.

## 3. Churn

Monthly churn rate, all active accounts: Jan 5.3%, Feb 5.7%, Mar 6.3%, Apr 5.9%, May 6.5%, Jun 6.0% (final); Jul 6.7%, Aug 6.8% (provisional).

Reactivation is small. 4.3% of January's churners had come back by September.

**Churn rate by cut**, January to June combined:

| Cut | Churn | | Cut | Churn |
|---|---:|---|---|---:|
| Under $10 | 10.6% | | New this month | 12.7% |
| $10 to $50 | 3.6% | | Under 6 months | 13.8% |
| $50 to $500 | 2.6% | | 6 to 24 months | 6.3% |
| $500 to $5K | 0.9% | | Over 24 months | 2.8% |
| $5K and over | 0.6% | | Student Pack | 9.7% |
| Business email | 5.5% | | Free email | 6.2% |

**Token use vs console only, within each spend band**, January to June combined:

| Band | Churn, used a token | Churn, console only | Average accounts using a token per month |
|---|---:|---:|---:|
| Under $10 | 13.5% | 10.5% | 7,420 |
| $10 to $50 | 3.1% | 3.6% | 12,591 |
| $50 to $500 | 1.9% | 2.7% | 17,980 |
| $500 to $5K | 0.4% | 1.1% | 6,331 |
| $5K and over | 0.2% | 1.4% | 718 |

From $10 up, accounts that use the API churn 14% to 86% less than console-only accounts at the same spend. Under $10 they churn more, likely accounts that script a test and leave. Spend explains most of the headline gap, so do not quote the unbanded 3.4% vs 5.5% as the API effect.

**Churn by client family** (daily table, January to June combined, not controlled for spend):

- Low: CI actions 1.6%, other official SDKs 2.1%, container registry 2.4%, community libraries 2.5%.
- Middle: doctl 3.1%, local MCP 3.3%, pydo 3.8%, Kubernetes controllers 3.8%, remote MCP 4.0%, godo 4.4%.
- High: Terraform 5.2%, curl 5.3%, raw HTTP 5.8%, agent clients 21.9% (small base).

## 4. Revenue scales and what is bought

**Gross share by spend band:** the $5K-and-over band rose from 44% of gross in January to 69% in September, while its account count moved only from 1,002 to 1,111. The under-$50 bands fell from 8% to 5%.

**Gross by product group** ($M):

| Group | Jan | Mar | Jun | Aug | Sep | Sep net | Sep accounts |
|---|---:|---:|---:|---:|---:|---:|---:|
| GPU | 13.8 | 17.7 | 24.2 | 53.0 | 74.2 | 30.7 | 1,548 |
| Droplets | 33.4 | 34.5 | 35.1 | 35.4 | 35.5 | 33.0 | 561,455 |
| Storage and registry | 11.0 | 11.3 | 11.8 | 13.2 | 13.4 | 11.7 | 368,078 |
| Networking | 5.7 | 9.5 | 8.6 | 5.8 | 8.6 | 2.3 | 29,325 |
| Databases | 6.8 | 7.0 | 7.2 | 7.4 | 7.4 | 7.2 | 78,272 |
| Kubernetes | 5.0 | 6.3 | 7.7 | 6.3 | 7.4 | 5.6 | 11,289 |
| App Platform and Functions | 1.8 | 1.9 | 2.0 | 2.0 | 2.1 | 2.0 | 49,332 |
| Serverless inference | 0.01 | 0.12 | 0.34 | 0.39 | 0.97 | 0.81 | 3,193 |
| Agents | <0.01 | <0.01 | <0.01 | <0.01 | <0.01 | <0.01 | 409 |

- GPU drives the growth: $73.7M of September's $74.2M GPU gross came from 137 accounts in the $5K-and-over band. Net is 41% of gross, so most of that is discounted or credited.
- Without GPU, gross grew 19%, from $64.2M to $76.4M.
- Droplet gross is flat at about $35M while Droplet accounts grew 11%. More accounts are buying smaller Droplets.

## 5. Agentic usage

| Signal | Jan | Apr | Jun | Aug | Sep | Churn, final months |
|---|---:|---:|---:|---:|---:|---|
| Any agentic, excluding GPU (accounts) | 1,117 | 2,926 | 4,967 | 5,371 | 8,740 | 5.2% Jan, 14.2% Jun |
| Serverless inference | – | 1,155 | 3,198 | 3,008 | 2,420 | 15.9% to 18.1% |
| Remote MCP | – | 266 | 436 | 1,252 | 4,812 | 1.6% to 7.5% |
| Local MCP | 448 | 610 | 791 | 829 | 1,283 | 2.2% to 4.8% |
| Agents created | 584 | 1,008 | 718 | 280 | 230 | 7.1% to 16.4% |
| Agent clients (user agent) | 91 | 97 | 319 | 291 | 300 | rising to 21% (Jun) |
| Dedicated inference | – | 6 | 14 | 8 | 12 | too small |

- **Serverless inference** has fewer accounts, but they are using more. Accounts fell from 3,320 in July to 2,420 in September. Tokens rose from 89B in June to 3.46T in September, and its own net revenue from $27K to $812K. Its account churn of 16% to 18% is about three times the base rate. The table starts in April, so January to March are missing, not zero.
- **Agent creation is declining:** accounts creating agents peaked at 1,008 in April and fell to 230 in September.
- **Agentic churn rises because the mix shifted** toward serverless inference trials. MCP accounts churn at about the base rate or below.
- **Not billable yet:** 1,935 of September's 8,740 agentic accounts had no billable usage, and 1,796 of them came through remote MCP.

**Adjacent infrastructure** (September, share of each cohort's active accounts):

| Product group | Agentic (6,717) | Everyone else (685,905) |
|---|---:|---:|
| Droplets | 66% | 81% |
| Storage and registry | 63% | 53% |
| Serverless inference | 38% | 0.1% |
| Databases | 29% | 11% |
| App Platform and Functions | 22% | 7% |
| Networking | 8% | 4% |
| Kubernetes | 4% | 2% |

Agentic accounts are about three times as likely to use App Platform and 2.6 times as likely to use managed databases. They are less tied to Droplets.

## 6. Client libraries

**Accounts on the raw-log sample day** (second Wednesday, `api.digitalocean.com`; these are per day, not per month):

| Family | Jan | Mar | May | Jul | Sep | Change | Sep write share |
|---|---:|---:|---:|---:|---:|---:|---:|
| raw HTTP | 7,818 | 8,302 | 9,005 | 9,890 | 10,835 | +39% | 4.0% |
| doctl | 3,089 | 3,715 | 4,433 | 5,176 | 6,965 | +125% | 3.7% |
| curl | 1,254 | 1,654 | 1,948 | 2,424 | 3,053 | +143% | 12.2% |
| community libraries | 2,566 | 2,474 | 2,259 | 2,206 | 2,106 | −18% | 9.5% |
| Terraform | 648 | 734 | 824 | 885 | 1,086 | +68% | 8.2% |
| godo | 949 | 943 | 972 | 997 | 1,081 | +14% | 6.0% |
| remote MCP | – | – | 46 | 102 | 604 | new | 6.0% |
| local MCP | 61 | 123 | 90 | 174 | 218 | +257% | 2.9% |
| pydo | 169 | 187 | 184 | 199 | 211 | +25% | 3.2% |
| other official SDKs | 565 | 575 | 571 | 56 | 58 | −90% in June | 1.2% |
| Kubernetes controllers | 11,422 | 11,359 | 11,324 | 11,148 | 10,866 | −5% | 5.4% |

- doctl and curl doubled. Raw HTTP is still the largest programmatic group, and its requests per sample day rose from 4.7M to 12.4M.
- godo has few accounts but heavy traffic: 6.7M requests a day from about 1,081 accounts, which looks like automation.
- Community libraries are the only family shrinking.
- The other-official-SDK drop in June is in both sources. It is most likely a user-agent change in the dots TypeScript SDK [UNVERIFIED].
- **Inference host:** it appears in the raw log from May. Raw HTTP accounts calling it grew from 154 to 477, and agent clients from 115 to 247. Nearly all of these calls are writes (POST).

**What each library touches** (September, daily table, top products by accounts):

- doctl: account, Droplets, apps, databases, Kubernetes, firewalls.
- Terraform: Droplets, firewalls, account, VPCs, projects, databases. It builds whole environments.
- godo: load balancers (1,434 accounts, 5.2M writes), then domains and Droplets.
- Community libraries: domains, with 4,198 accounts. This is mostly DNS automation for certificates.
- curl and raw HTTP: Droplets, account, domains, databases, apps.
- Remote MCP: Droplets, account, sizes, customers, actions, regions.
- Local MCP: Droplets, apps, databases, account, domains.
- Agent clients: `gen-ai` (141 accounts).

## 7. MCP: remote vs local

| Month | Remote accounts | Remote new | Remote kept from last month | Local accounts | Local new | Local kept from last month | Both |
|---|---:|---:|---:|---:|---:|---:|---:|
| Mar | 132 | 132 | – | 668 | 400 | 237 | 60 |
| Apr | 266 | 200 | 66 | 610 | 358 | 214 | 21 |
| May | 230 | 145 | 79 | 557 | 280 | 235 | 21 |
| Jun | 436 | 310 | 96 | 791 | 406 | 274 | 26 |
| Jul | 1,111 | 851 | 232 | 1,012 | 474 | 428 | 41 |
| Aug | 1,252 | 745 | 477 | 829 | 314 | 439 | 26 |
| Sep | 4,812 | 3,839 | 766 | 1,283 | 522 | 534 | 81 |

- Remote MCP was first seen on 19 March. It passed local in July, and in September it reached 3.8 times local.
- **The September jump is mostly new accounts.** 3,839 of 4,812 were first-time remote users. The cause is not identified [UNVERIFIED]; check the launch and partner calendar.
- **Month-to-month retention** (share of last month's users back this month): remote 53%, 43%, 61% for July, August, September; local 54%, 43%, 64%. The two are similar, and August is low for both.
- **Remote is shallow, local is deep.** Remote averaged 31 requests per account in September, local 95. Remote's write share is higher, 8.4% vs 2.7%.
- **Remote users start by discovering.** Their top September calls were read-only: account, sizes, regions, customers, actions. Droplets is the main product they write to (7,521 writes).
- Few use both: 81 accounts in September.
- **The tool registry is separate.** `TOOL_REGISTRY_MCP_SERVERS` holds 121 customer-registered MCP servers across 31 teams for agents, all streamable HTTP, starting July 2026. It does not track our own MCP server. The `MCP` database shows no tables to this role.

## 8. Data quality notes

- **Daily table coverage.** On the same sample day, `PRODUCT_API_REQUESTS_DAILY` held about 0.69 of the raw log's accounts for doctl, Terraform and both MCP types. On 13 May and 12 August it held 0.33 to 0.46. Every daily-table count for May and August is therefore depressed, including token use, surfaces and MCP. Use the raw-log sample for trends, and the daily table for September cuts.
- **Internal traffic.** `x_internal` (billing and account calls from platform services) grew from 8,157 accounts in January to 96,088 in September in the daily table. The raw log shows the same rise, from 25 to 7,244 accounts per sample day. It is excluded from token use but should be explained [UNVERIFIED].
- **Serverless inference counts disagree.** The revenue table gives 2,420 accounts in September; invoice SKUs give 3,193. They measure different things (net-revenue rows vs any billed SKU).
- **Promo credits.** New accounts in May and June have very low net revenue against gross.

## 9. Open questions

1. IAM owner: confirm which `OAUTH_ACCESS_TOKENS` application IDs are personal access tokens, and what happened to app 30327 in September.
2. Data platform: why did daily-table coverage drop on the May and August sample days, and did the September volume step come from a pipeline change?
3. What drove 3,839 new remote MCP accounts in September, and why do 1,796 of them have no billable usage?
4. Which platform service started calling `billing` and `my` for about 96K accounts?
5. What does `IS_TEST` cover, and does it catch internal load-test accounts?

Source files: [data/base_churn.csv](data/base_churn.csv), [data/token_created.csv](data/token_created.csv), [data/token_use.csv](data/token_use.csv), [data/token_snapshot.csv](data/token_snapshot.csv), [data/surfaces.csv](data/surfaces.csv), [data/revenue_products.csv](data/revenue_products.csv), [data/agentic.csv](data/agentic.csv), [data/agentic_adjacency.csv](data/agentic_adjacency.csv), [data/libraries_sample.csv](data/libraries_sample.csv), [data/library_products.csv](data/library_products.csv), [data/mcp.csv](data/mcp.csv), [data/coverage_daily.csv](data/coverage_daily.csv). Query IDs: [run-log.md](run-log.md).

`02 Strategy and Research/DevEx Usage and Retention/runs/2026-09/report.md`
