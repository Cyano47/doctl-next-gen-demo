# Portfolio Analyzer

Analyzes a portfolio using holdings, current prices, and risk tolerance. Outputs metrics, issues, recommendations, and a **portfolio_health_score (0–100)** as structured JSON.

## Input format

Pass a single JSON file or object with:

| Key | Type | Description |
|-----|------|-------------|
| `portfolio_json` | array | List of holdings (see below). |
| `current_prices_json` | object | Map of `symbol` → current price (number). |
| `risk_tolerance` | string | `"Conservative"` \| `"Moderate"` \| `"Aggressive"`. |

### Holding object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `symbol` | string | Yes | Ticker (e.g. `RELIANCE`, `AAPL`). |
| `quantity` | number | Yes | Units held. |
| `cost_price` | number | Yes | Price per unit at purchase. |
| `sector` | string | Yes | e.g. IT, Energy, Financials, Commodity, Crypto. |
| `geography` | string | Yes | `India` \| `US` \| `Other`. |
| `asset_type` | string | Yes | `equity` \| `commodity` \| `crypto`. |
| `name` | string | No | Display name. |
| `purchase_date` | string | No | `YYYY-MM-DD` (used for dormant >12 months). |

## Usage

```bash
# With your data file (e.g. sample_data.json)
python portfolio_analyzer.py sample_data.json

# No args: runs with built-in demo data
python portfolio_analyzer.py
```

From code:

```python
from portfolio_analyzer import run_analysis

result = run_analysis(portfolio_json, current_prices_json, risk_tolerance)
# result["portfolio_health_score"]  # 0-100
# result["metrics"], result["issues"], result["recommendations"]
```

## Output structure

- **portfolio_health_score**: 0–100.
- **metrics**: Total value, unrealized gain/loss (absolute and %), sector allocation %, geographic distribution %, asset type breakdown %, position-level details.
- **issues**: Sector over-concentration (>30%), Herfindahl index, under-diversification note, assets with >20% loss, dormant positions (>12 months).
- **recommendations**: List of `{ "priority", "action", "rationale", "risk" }` (High/Medium/Low; Buy/Sell/Hold/Rebalance/Review or Exit).

## Thresholds

| Item | Default |
|------|--------|
| Sector over-concentration | >30% |
| Significant loss (review/exit) | >20% loss |
| Dormant position | Held >12 months |
| Herfindahl “concentrated” | >0.25 |

## Example (sample_data.json)

Run:

```bash
python portfolio_analyzer.py sample_data.json
```

to get full JSON: health score, metrics, issues (e.g. INFY ~-25% loss, IT sector concentration, dormant INFY), and recommended actions with priority and risk.
