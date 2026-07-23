# Watchlist Monitor

Monitors a list of symbols for price moves, volume spikes, news sentiment, and technical levels. Outputs a **prioritized alert list** with **action recommendations**.

## Tracked signals

| Signal | Condition | Alert priority |
|--------|-----------|----------------|
| **Target price** | Price within ±2% of target | URGENT |
| **Volume + price combo** | Volume >2x average **and** daily move >5% | HIGH |
| **Price movement** | Daily change >5% | HIGH (if ≥7%) / MEDIUM |
| **Volume spike** | Volume >2x average | MEDIUM |
| **Sector movement** | Sector moved >1.5% and stock moved in same direction | MEDIUM |
| **News sentiment (24h)** | Negative → MEDIUM; Positive → LOW | MEDIUM / LOW |
| **Technical breakouts** | Price above resistance or below support | MEDIUM |
| **Approach to S/R** | Price within 3% of support or resistance | LOW |

## Input format

Provide a JSON file or object:

```json
{
  "watchlist_symbols": ["RELIANCE", "TCS", "AAPL"],
  "market_data": {
    "RELIANCE": {
      "current_price": 2480,
      "previous_close": 2410,
      "volume": 12500000,
      "average_volume": 8500000,
      "target_price": 2520,
      "sector": "Energy",
      "support": 2350,
      "resistance": 2550,
      "news_sentiment_24h": "neutral",
      "news_headlines_24h": ["Headline here."]
    }
  },
  "sector_movements_pct": {
    "Energy": 2.1,
    "IT": -1.8
  }
}
```

### Per-symbol `market_data` fields

| Field | Required | Description |
|-------|----------|-------------|
| `current_price` | Yes | Last/today's price |
| `previous_close` | Yes | Prior session close (for daily % change) |
| `volume` | No | Today's volume |
| `average_volume` | No | e.g. 20-day average (for volume spike) |
| `target_price` | No | Your target (triggers URGENT when within ±2%) |
| `sector` | No | For sector-wide movement alerts |
| `support` / `resistance` | No | For breakout and approach alerts |
| `news_sentiment_24h` | No | `"positive"` / `"negative"` / `"neutral"` |
| `news_headlines_24h` | No | Array of headline strings (last 24h) |

`sector_movements_pct` is optional: `{ "SectorName": daily_change_pct }` for sector-aligned alerts.

## Usage

```bash
# With your data file
python3 watchlist_monitor.py sample_watchlist_data.json

# No args: runs with built-in demo data
python3 watchlist_monitor.py
```

From code:

```python
from watchlist_monitor import run_monitor

result = run_monitor(
    watchlist_symbols=["RELIANCE", "TCS"],
    market_data=market_data_dict,
    sector_movements={"Energy": 2.0, "IT": -1.5}
)
# result["alerts_prioritized"]  # list of alerts, sorted by priority
# result["alerts_by_priority"]  # { "URGENT": [...], "HIGH": [...], ... }
# result["summary"]             # total_alerts, urgent, high, medium, low
```

## Output structure

- **alerts_prioritized**: List of alert objects, sorted URGENT → HIGH → MEDIUM → LOW. Each has `type`, `priority`, `symbol`, `message`, and **action_recommendation**.
- **alerts_by_priority**: Same alerts grouped by `URGENT` / `HIGH` / `MEDIUM` / `LOW`.
- **summary**: Counts for total and per-priority.

Each alert includes a short **action_recommendation** (e.g. review target, avoid FOMO, confirm breakout with volume).

## Thresholds (configurable in code)

| Parameter | Default |
|-----------|---------|
| Daily move alert | >5% |
| Volume spike | >2x average |
| Target hit band | ±2% of target |
| Technical approach | Within 3% of S/R |
| Sector move | \|sector move\| >1.5% |

## News sentiment (24h)

The monitor reads `news_sentiment_24h` and `news_headlines_24h` from your `market_data`. To feed real-time news:

- Use a news API (e.g. NewsAPI, Alpha Vantage News, or broker APIs) and run it every 24h or intraday.
- Map API results to `news_sentiment_24h` (e.g. from a sentiment model or provider) and `news_headlines_24h`.
- Pass the updated `market_data` into `run_monitor()`.

No API calls are made inside the script; you supply all data.
