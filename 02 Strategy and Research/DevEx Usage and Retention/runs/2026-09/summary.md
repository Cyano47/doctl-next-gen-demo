# DevEx usage and retention: September 2026 summary

Clean team accounts, January to September 2026. Active = billable usage that month. Churn = no billable usage for the next three months (final to June). Definitions v1. Full tables: [report.md](report.md).

1. **The base stopped growing in May; revenue did not.** Active accounts went from 620K in January to 690K in May, and stayed there (692,622 in September). Gross rose from $78.0M to $150.6M. GPU accounts for $60M of that rise, and 137 GPU accounts spending $5K or more made up $73.7M of September. Without GPU, gross grew 19%.

2. **About 7% of active accounts hold an API token, and the share is rising.** Active accounts holding a valid personal token grew from 29,426 (4.7%) to 50,940 (7.4%). Accounts making programmatic calls reached 66,250 in September, 9.6% of the base and 76% of gross.

3. **API users churn less at every spend level from $10 up.** Accounts spending $50 to $500 churn at 1.9% when they use the API and 2.7% when they use only the console. At $5K and above it is 0.2% vs 1.4%. Under $10 the pattern reverses (13.5% vs 10.5%), likely accounts that script a test and leave.

4. **Churn is a new-account problem.** Accounts under six months old churn at 13% to 14% a month, against 2.8% for accounts over two years old. Overall monthly churn drifted from 5.3% in January to 6.0% to 6.5% in May and June.

5. **doctl and curl doubled; community libraries shrank.** On the raw-log sample day, doctl accounts rose from 3,089 to 6,965, curl from 1,254 to 3,053 and Terraform from 648 to 1,086. Community libraries fell 18%.

6. **Remote MCP took off in September, mostly with new and unbilled accounts.** Remote MCP accounts went from 1,252 in August to 4,812 in September; 3,839 were first-time users and 1,796 had no billable usage. Remote passed local MCP (1,283) in July. Remote users mostly read (account, sizes, regions) and make about a third as many requests as local users. Month-to-month retention is similar for both, at about 60%.

7. **Agentic usage is concentrated in fewer, heavier accounts.** Serverless inference accounts fell from 3,320 in July to 2,420 in September, while tokens grew 39 times from June and its net revenue reached $812K. Those accounts churn at 16% to 18% a month, about three times the base rate. Agent creation fell from 1,008 accounts in April to 230.

**Watch:** daily API counts for May and August are undercounted. On those sample days the daily table held about 0.4 of the raw log's accounts, against 0.69 normally. September's rise over August is partly recovery, so compare it with July.

**Open:** confirm the personal-token application IDs with IAM, and explain the September jumps in remote MCP, token app 30327 and internal billing calls. Details in [report.md](report.md) section 9.

`02 Strategy and Research/DevEx Usage and Retention/runs/2026-09/summary.md`
