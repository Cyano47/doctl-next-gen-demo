#!/usr/bin/env python3
"""
Data layer for weekly recap. Uses mock/sample data by default.
Optional: integrate NSE/BSE, Yahoo Finance, Alpha Vantage, MCX, NewsAPI via env vars.
"""

import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

# Env vars for optional API keys (no keys = use mock data)
NEWS_API_KEY = os.environ.get("NEWS_API_KEY")
ALPHA_VANTAGE_KEY = os.environ.get("ALPHA_VANTAGE_KEY")
YAHOO_FINANCE_AVAILABLE = False  # set True if yfinance installed and desired


def _week_end(date_str: str) -> datetime:
    """Parse YYYY-MM-DD and return week-ending (Friday) if needed."""
    try:
        d = datetime.strptime(date_str.strip()[:10], "%Y-%m-%d")
    except ValueError:
        d = datetime.now().date()
        d = datetime(d.year, d.month, d.day)
    # If not Friday, go to previous Friday
    while d.weekday() != 4:
        d = d - timedelta(days=1)
    return d


def get_indices_data(week_end: datetime) -> Dict[str, Any]:
    """
    Key indices: Nifty50, Sensex, S&P500, Dow Jones.
    Optional: Alpha Vantage or yfinance; else mock.
    """
    # TODO: if ALPHA_VANTAGE_KEY: fetch GLOBAL_QUOTE for ^GSPC, ^DJI, ^NSEI, BSE SENSEX
    # TODO: if yfinance: yf.Ticker("^GSPC").history(period="5d") etc.
    return {
        "Nifty50": {"close": 24250.50, "change_pct": 1.2, "week_high": 24320, "week_low": 23800},
        "Sensex": {"close": 79820.30, "change_pct": 1.0, "week_high": 80100, "week_low": 78500},
        "S&P500": {"close": 5480.20, "change_pct": 0.8, "week_high": 5495, "week_low": 5410},
        "Dow_Jones": {"close": 39120.50, "change_pct": 0.5, "week_high": 39200, "week_low": 38750},
    }


def get_commodity_highlights(week_end: datetime) -> Dict[str, Any]:
    """Gold, Silver, Crude Oil. Optional: MCX/COMEX APIs."""
    return {
        "Gold": {"price": 72850, "unit": "per 10g MCX", "change_pct": 1.5},
        "Silver": {"price": 94500, "unit": "per kg MCX", "change_pct": 2.1},
        "Crude_Oil": {"price": 82.40, "unit": "USD/bbl", "change_pct": -0.8},
    }


def get_narrative_themes(week_end: datetime) -> List[str]:
    """Top 3 narrative themes driving markets (from logic or news)."""
    return [
        "AI and datacenter capex driving semiconductor and memory demand",
        "Rate-cut expectations and bond yields driving risk-on rotation",
        "Indian macros and FII inflows supporting large-cap outperformance",
    ]


def get_emerging_narratives(week_end: datetime) -> List[Dict[str, Any]]:
    """
    Emerging narratives with BENEFICIARIES, MECHANICS, EVIDENCE, OUTLOOK, ACTIONABLE.
    In production, derive from news aggregation + sector returns.
    """
    return [
        {
            "title": "AI Memory Boom: Datacenter Expansion Fuels Storage Demand",
            "beneficiaries": "Micron, Western Digital, Samsung Electronics; Indian IT services (TCS, HCLTech) for implementation.",
            "mechanics": "Hyperscalers are raising capex for AI training and inference. High-bandwidth memory (HBM) and SSDs are in tight supply. Indian IT benefits from system integration and cloud migration deals linked to the same capex cycle.",
            "evidence": "Micron guidance upgrade; NAND contract prices up 15% QoQ; datacenter revenue growth in double digits for major cloud providers.",
            "outlook": "Short-term: memory names volatile on quarterly prints. Medium-term: capacity additions to ease shortage by late 2025; pricing power to stay for HBM.",
            "actionable": "Watch MU, WDC, SK Hynix; in India, TCS, HCLTech, Persistent.",
        },
        {
            "title": "MCX Metal Volumes Surge: Industrial and Jewellery Demand Revival",
            "beneficiaries": "Jewellery exporters, refiners (Hindalco, Vedanta), and MCX/NSE metal derivatives traders.",
            "mechanics": "Domestic gold and silver demand is strong on wedding season and store-of-value demand. Base metal volumes on MCX have picked up on restocking and China policy hopes, signalling cautious industrial pickup.",
            "evidence": "MCX gold option open interest up 20% WoW; silver futures volume 2x 3M average; copper warehouse inventory draw.",
            "outlook": "Short-term: volatility around US CPI and Fed. Medium-term: real rates and USD path drive precious metals; China stimulus and grid build-out support base metals.",
            "actionable": "Gold/silver: track real yields and INR. Base: HINDALCO, VEDL, SAIL; MCX Copper, Zinc.",
        },
        {
            "title": "Green Energy Push: Indian Solar and Renewables on Policy Tailwinds",
            "beneficiaries": "Solar module and inverter makers, renewables developers (ReNew, Adani Green), DISCOMs with green mandates.",
            "mechanics": "Central and state policies are aligning on rooftop solar, PLI for manufacturing, and renewables tenders. Falling module costs and financing availability are improving project IRRs.",
            "evidence": "Solar tender pipeline at record; module import restrictions lifting for projects; capacity addition targets raised.",
            "outlook": "Short-term: quarter-to-quarter execution and tariff bids in focus. Medium-term: execution and funding key; upside for domestic manufacturers from PLI.",
            "actionable": "Watch Adani Green, Tata Power, Suzlon; inverter/components: relevant small/mid caps in the value chain.",
        },
    ]


def get_india_specific(week_end: datetime) -> Dict[str, Any]:
    """Nifty sector rotation, FII/DII, policy, mid/small vs large."""
    return {
        "nifty_sector_rotation": [
            {"sector": "IT", "return_pct": 2.1, "comment": "Deal wins and margin narrative"},
            {"sector": "Realty", "return_pct": 1.8, "comment": "Stable rates, pre-sales"},
            {"sector": "Auto", "return_pct": 1.2, "comment": "PV and 2W volume growth"},
            {"sector": "Banking", "return_pct": 0.5, "comment": "NIM pressure, asset quality stable"},
            {"sector": "FMCG", "return_pct": -0.3, "comment": "Rural demand slow"},
            {"sector": "Metals", "return_pct": -0.8, "comment": "China data soft"},
        ],
        "fii_dii_flows": {
            "FII_net_equity_cr": 4200,
            "DII_net_equity_cr": 3800,
            "FII_comment": "Sustained buying in large-caps; sector rotation into IT and banks.",
            "DII_comment": "Domestic funds continued accumulation; SIP flows resilient.",
        },
        "policy_regulatory": [
            "SEBI extended timeline for compliance on certain MF norms.",
            "RBI kept repo rate unchanged; stance focused on withdrawal of accommodation.",
            "Government clarified tax treatment for certain foreign investors.",
        ],
        "mid_small_vs_large": {
            "Nifty50_return_pct": 1.2,
            "Nifty_Midcap100_return_pct": 0.6,
            "Nifty_Smallcap100_return_pct": -0.2,
            "comment": "Large-caps led; mid/small saw profit-taking after recent outperformance.",
        },
    }


def get_us_specific(week_end: datetime) -> Dict[str, Any]:
    """Fed, mega-cap tech, value vs growth, earnings."""
    return {
        "fed_policy": "Rates held; dot plot still implies one cut in 2025. Data-dependent stance; next focus CPI and payrolls.",
        "mega_cap_tech": [
            {"name": "NVDA", "return_pct": 3.2, "comment": "Datacenter revenue beat"},
            {"name": "AAPL", "return_pct": 1.5, "comment": "AI features and Services growth"},
            {"name": "MSFT", "return_pct": 2.0, "comment": "Azure and Copilot adoption"},
            {"name": "GOOGL", "return_pct": 0.8, "comment": "Search and Cloud stable"},
        ],
        "value_vs_growth": "Growth outperformed on rate-cut hopes and tech earnings; Value lagged with financials under pressure.",
        "earnings_insights": "S&P 500 blended earnings growth positive; beats in tech and healthcare; some misses in consumer discretionary and industrials.",
    }


def get_commodities_corner(week_end: datetime) -> Dict[str, Any]:
    """Gold, Crude, Base metals, Agri."""
    return {
        "gold": "Safe-haven bids on geopolitical risk; strength capped by firm USD and higher-for-longer narrative. Physical demand in India and China supportive.",
        "crude_oil": "OPEC+ extended voluntary cuts; US inventory draw. Prices range-bound; demand outlook and non-OPEC supply in focus.",
        "base_metals": "China PMI and property signals mixed; infrastructure and green energy demand offset weakness. Copper and aluminium supported on smelter cuts and restocking.",
        "agricultural": "Weather in key producing regions improving; supply chain and export flows normalising. Edible oils and grains watched for El Niño impact.",
    }


def get_week_ahead(week_end: datetime) -> Dict[str, Any]:
    """Next week: data releases, earnings, central banks, geopolitics."""
    next_week_start = week_end + timedelta(days=3)  # Monday
    return {
        "economic_data": [
            "US: CPI (Wed), PPI (Thu), Retail Sales (Fri)",
            "India: IIP, CPI (domestic schedule)",
            "China: Industrial Production, Retail Sales",
        ],
        "earnings": [
            "US: Major retail and selected tech names",
            "India: Result season continuing; key large-cap results",
        ],
        "central_banks": [
            "Fed: FOMC minutes; speakers through the week",
            "RBI: Minutes of MPC meeting",
        ],
        "geopolitical": [
            "Trade and tariff rhetoric; regional tensions",
            "Commodity-producing region weather and supply",
        ],
    }


def fetch_news_headlines(week_end: datetime, query: str, limit: int = 5) -> List[Dict[str, str]]:
    """
    Optional: NewsAPI or Google News. Returns list of { title, source, url, publishedAt }.
    Without API key, returns empty or mock.
    """
    if not NEWS_API_KEY:
        return []
    # TODO: requests.get(f"https://newsapi.org/v2/everything?q={query}&apiKey=...")
    return []


def fetch_social_sentiment(symbols: List[str], week_end: datetime) -> Dict[str, Any]:
    """
    Optional: Twitter/Reddit APIs. Returns aggregate sentiment per symbol or theme.
    Without keys, return empty.
    """
    return {}
