# Run log: 2026-09 (backfill)

- **Run date:** 8 October 2026. **Run month:** 2026-09. **Window:** January to September 2026. **Definitions:** v1.
- **Warehouse:** Snowflake (DigitalOcean) MCP, `mcp_query_x_small_warehouse_5m_timeout`, read only, database `PRODUCTION`.
- **History:** `scripts/append_history.py append --run-dir runs/2026-09 --run-month 2026-09` wrote 3,834 rows to `history/metrics.csv` and 523 to `history/churn.csv`. That was two passes: the main results, then `coverage_daily`, which the first pass skipped as duplicates.

## Queries

| Result | Rows | Snowflake query ID | Seconds |
|---|---:|---|---:|
| base_churn | 126 | 01c7970b-061f-7637-001b-b501fee68dfb | 18.8 |
| surfaces and token_use (one query, split on save) | 174 + 108 | 01c7970e-061f-7637-001b-b501fee7b113 | 29.0 |
| token_created | 60 | 01c79710-061f-82a2-001b-b501fee8957b | 20.8 |
| token_snapshot | 14 | 01c79711-061f-82a2-001b-b501fee8c4d7 | 11.8 |
| revenue_products | 152 | 01c79712-061f-79f5-001b-b501fee8fd8f | 30.2 |
| agentic | 56 | 01c79714-061f-82a2-001b-b501fee97a83 | 16.0 |
| agentic_adjacency | 22 | 01c79715-061f-79f5-001b-b501fee9a8e7 | 6.6 |
| libraries_sample, 2026-01-14 | 19 | 01c7971b-061f-79f5-001b-b501feebc317 | 18.2 |
| libraries_sample, 2026-02-11 | 19 | 01c7971c-061f-8326-001b-b501feec030b | 36.4 |
| libraries_sample, 2026-03-11 | 19 | 01c7971c-061f-8326-001b-b501feec0487 | 61.3 |
| libraries_sample, 2026-04-08 | 21 | 01c7971c-061f-7637-001b-b501feebdd1f | 60.9 |
| libraries_sample, 2026-05-13 | 27 | 01c7971d-061f-7637-001b-b501feebdf2b | 55.4 |
| libraries_sample, 2026-06-10 | 27 | 01c7971e-061f-82a2-001b-b501feec6ec3 | 57.1 |
| libraries_sample, 2026-07-08 | 28 | 01c7971e-061f-8326-001b-b501feec7dfb | 83.4 |
| libraries_sample, 2026-08-12 | 28 | 01c7971e-061f-8326-001b-b501feecc063 | 81.7 |
| libraries_sample, 2026-09-09 | 28 | 01c7971f-061f-7637-001b-b501feec998b | 74.8 |
| library_products | 73 | 01c79721-061f-82a2-001b-b501feed7353 | 4.6 |
| mcp | 119 | 01c79721-061f-82a2-001b-b501feed741b | 2.6 |
| coverage_daily (all nine sample days) | 33 | 01c7972e-061f-8326-001b-b501fef00907 | – |
| Tool registry counts (not stored) | 4 | 01c79722-061f-7637-001b-b501feedb197, 01c79723-061f-7637-001b-b501feedb513 | 1.3 |

## How the SQL pack was checked

The queries above were run by hand during the backfill, before the `sql/` pack existed. The pack was then built from their exact text, recovered from `INFORMATION_SCHEMA.QUERY_HISTORY`. A word-level diff shows only intended changes:

- The shared `acct` block carries two extra columns.
- September churn is set to null in SQL rather than blanked by hand.
- The surfaces/token_use query is split in two.
- `mcp` blanks new and retained accounts for the window's first month.

To confirm the edited SQL runs and matches, the rendered `token_use.sql` was re-executed (query 01c7972c-061f-82a2-001b-b501feeff41b). All 18 headline rows matched `data/token_use.csv` exactly.

The January raw-log query ran before the host filter was added. Its `api` and `inference` rows use the same host rules, so they are comparable; its other-host rows were not stored.

## Sampling

- **Raw log:** one day per month, the second Wednesday. Hosts are limited to `api.digitalocean.com%`, `%do-ai.run%` and `%inference%`. A three-day query timed out at 300 seconds; one day takes 18 to 83 seconds.
- **Run-month-only results:** `library_products`, `agentic_adjacency`, `token_snapshot` (apart from agent keys) and `revenue_products` by band. Earlier months were not backfilled for these.

## Sanity checks

| Check | Result |
|---|---|
| Active base within ±10% of last month | OK: 690,891 to 692,622 (+0.3%) |
| Every series from August still present | OK, once top-6 product lists (`library_products`, `mcp_product`) were marked as rotating |
| Spend bands add up to the monthly total | OK: the five bands sum to the `all` row in every month, exactly for active accounts and within $1 of rounding for gross |
| Daily table vs raw log (MCP, doctl, Terraform) | WARN: ratio about 0.69 normally, 0.33 to 0.46 on 13 May and 12 August. The plan expected about 0.84 |

## Warnings

1. **Low daily-table coverage in May and August.** Every daily-table count for those months is low, so month-on-month changes into and out of them are overstated.
2. **`x_internal` jumped in September:** 96,088 accounts in the daily table, 7,244 on the raw-log sample day. It is excluded from token use. The source is not identified.
3. **Token app 30327 went from 1,238 to 6,166 accounts creating tokens in September.** It is in the personal-token proxy, so it lifts September's token numbers.
4. **Serverless inference revenue rows start in April 2026.** January to March are missing, not zero.
5. **The `MCP` database exposes no tables to this role.** Tool-level MCP data is not available.
