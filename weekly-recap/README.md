# Weekly Market Recap Generator

Produces a **comprehensive weekly market recap** in Markdown for a given week-ending date. Structure includes executive summary, emerging narratives, India/US specifics, commodities, and week-ahead calendar.

## Report structure

1. **Executive Summary (~150 words)** — Nifty50, Sensex, S&P500, Dow Jones; top 3 narrative themes; Gold, Silver, Crude highlights.
2. **Emerging Narratives** — Sector-focused narratives with BENEFICIARIES, MECHANICS, EVIDENCE, OUTLOOK, ACTIONABLE (e.g. AI Memory Boom, MCX metals, Green Energy).
3. **Indian Market Specific** — Nifty sector rotation table, FII/DII flows, policy/regulatory updates, Mid/Small vs Large-cap.
4. **US Market Specific** — Fed policy, mega-cap tech table, Value vs Growth, earnings insights.
5. **Commodities Corner** — Gold, Crude, Base metals, Agricultural (narrative summaries).
6. **Week Ahead** — Economic data, earnings, central banks, geopolitical events.

Output is Markdown with **embedded tables**; charts can be added by integrating chart images or Mermaid in the template.

## Usage

```bash
cd weekly-recap

# Generate for a specific week-ending date (Friday)
python3 cli.py --date 2025-01-24

# Save to file
python3 cli.py --date 2025-01-24 --out recap_2025-01-24.md

# Default: last Friday's date, print to stdout
python3 cli.py
```

From code:

```python
from report_generator import generate_report
markdown = generate_report("2025-01-24")
# write markdown to file or render
```

## Data sources (current vs optional)

**Current (no API keys):**  
The generator uses **mock/sample data** from `data_sources.py` so it runs offline. All sections are populated with realistic structure and example numbers.

**Optional integrations:**  
To use live data, extend `data_sources.py` and set environment variables as below.

| Data | Source | Env / integration |
|------|--------|--------------------|
| **Indices** (Nifty, Sensex, S&P, Dow) | NSE/BSE, Yahoo Finance, Alpha Vantage | `ALPHA_VANTAGE_KEY`; or `yfinance` (e.g. `^NSEI`, `^GSPC`, `^DJI`) |
| **Commodities** (Gold, Silver, Crude) | MCX, COMEX, Yahoo/Alpha Vantage | MCX/NSE APIs or symbol-based (e.g. `GC=F`, `CL=F`) |
| **News / themes** | NewsAPI, Google News, Economic Times | `NEWS_API_KEY`; use `fetch_news_headlines()` and feed into narratives |
| **FII/DII, sector returns** | NSE, BSE, or broker reports | Custom API or CSV ingest → pass into `get_india_specific()` |
| **Social sentiment** | Twitter API, Reddit (e.g. r/IndianStreetBets) | Optional: implement `fetch_social_sentiment()` and wire into narratives |

### Wiring real data

- **Indices:** Implement `get_indices_data(week_end)` using your API (e.g. Alpha Vantage `GLOBAL_QUOTE` or yfinance history for the week).
- **Commodities:** Implement `get_commodity_highlights()` and optionally `get_commodities_corner()` from MCX/Yahoo symbols.
- **Narratives:** Use `fetch_news_headlines()` and/or sector performance data to build or rank narratives in `get_emerging_narratives()`.
- **India:** Replace mock dict in `get_india_specific()` with NSE/BSE sector indices and FII/DII data.
- **US:** Replace mock in `get_us_specific()` with Fed calendar, earnings feed, and index constituents.

### Charts in Markdown

- **Images:** Generate charts (e.g. with Python `matplotlib`/`plotly`) and write to files; in `report_generator.py` add lines like `![Sector rotation](charts/sector_rotation.png)`.
- **Mermaid:** Append Mermaid blocks (e.g. for flow or simple bar) in the report template if your viewer supports it.

## Files

| File | Purpose |
|------|--------|
| `data_sources.py` | Data layer: mock data + stubs for NSE, Yahoo, NewsAPI, etc. |
| `report_generator.py` | Builds all sections and full Markdown. |
| `cli.py` | CLI: `--date`, `--out`. |
| `recap_2025-01-24.md` | Sample output for week ending Jan 24, 2025. |

## Customisation

- **Narratives:** Edit the list in `get_emerging_narratives()` or derive it from news/sector data.
- **Thresholds / themes:** Adjust logic in `get_narrative_themes()` and sector tables.
- **Week-ahead:** Update `get_week_ahead()` from a calendar API or manual input.
