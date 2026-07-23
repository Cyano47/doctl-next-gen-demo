#!/usr/bin/env python3
"""
Watchlist Monitor — Tracks price, volume, news sentiment, and technicals.
Produces prioritized alerts (URGENT / HIGH / MEDIUM / LOW) with action recommendations.
"""

import json
import sys
from typing import Any, List, Dict, Optional

# Thresholds
DAILY_MOVE_ALERT_PCT = 5.0           # >5% daily change → alert
VOLUME_SPIKE_MULTIPLIER = 2.0        # >2x average volume → volume spike
TARGET_HIT_BAND_PCT = 2.0            # within ±2% of target → URGENT
TECH_LEVEL_APPROACH_PCT = 3.0        # within 3% of S/R → LOW (approach)
SECTOR_MOVE_THRESHOLD_PCT = 1.5     # |sector move| > this → sector-wide


def _pct_change(current: float, previous: float) -> Optional[float]:
    if not previous or previous == 0:
        return None
    return ((current - previous) / previous) * 100


def _within_pct(value: float, target: float, pct: float) -> bool:
    if not target or target == 0:
        return False
    return abs(value - target) / target * 100 <= pct


def check_price_movement(symbol: str, data: dict) -> List[dict]:
    """>5% daily change triggers alert."""
    alerts = []
    curr = data.get("current_price")
    prev = data.get("previous_close")
    change = _pct_change(curr, prev) if (curr is not None and prev is not None) else None
    if change is not None and abs(change) >= DAILY_MOVE_ALERT_PCT:
        alerts.append({
            "type": "price_movement",
            "priority": "HIGH" if abs(change) >= 7 else "MEDIUM",
            "symbol": symbol,
            "daily_change_pct": round(change, 2),
            "message": f"Daily move {change:+.2f}% (threshold ±{DAILY_MOVE_ALERT_PCT}%).",
        })
    return alerts


def check_volume_spike(symbol: str, data: dict) -> List[dict]:
    """>2x average volume."""
    alerts = []
    vol = data.get("volume")
    avg = data.get("average_volume")
    if vol is not None and avg is not None and avg > 0:
        ratio = vol / avg
        if ratio >= VOLUME_SPIKE_MULTIPLIER:
            alerts.append({
                "type": "volume_spike",
                "priority": "MEDIUM",
                "symbol": symbol,
                "volume_ratio": round(ratio, 2),
                "message": f"Volume {ratio:.2f}x average ({vol:,.0f} vs avg {avg:,.0f}).",
            })
    return alerts


def check_volume_and_price_combo(symbol: str, data: dict, price_alerts: List[dict], volume_alerts: List[dict]) -> List[dict]:
    """HIGH: Unusual volume + price movement combo."""
    alerts = []
    has_vol = any(a["symbol"] == symbol and a["type"] == "volume_spike" for a in volume_alerts)
    has_price = any(a["symbol"] == symbol and a["type"] == "price_movement" for a in price_alerts)
    if has_vol and has_price:
        curr = data.get("current_price")
        prev = data.get("previous_close")
        change = _pct_change(curr, prev) if (curr is not None and prev is not None) else None
        alerts.append({
            "type": "volume_price_combo",
            "priority": "HIGH",
            "symbol": symbol,
            "message": "Unusual volume and significant price move together; possible breakout or news-driven move.",
        })
    return alerts


def check_target_price(symbol: str, data: dict) -> List[dict]:
    """URGENT: Stock hits target price ±2%."""
    alerts = []
    curr = data.get("current_price")
    target = data.get("target_price")
    if curr is not None and target is not None and _within_pct(curr, target, TARGET_HIT_BAND_PCT):
        alerts.append({
            "type": "target_price",
            "priority": "URGENT",
            "symbol": symbol,
            "current_price": curr,
            "target_price": target,
            "message": f"Price {curr} within ±{TARGET_HIT_BAND_PCT}% of target {target}. Review take-profit or trailing stop.",
        })
    return alerts


def check_sector_movement(
    symbol: str, data: dict, sector_movements: dict
) -> List[dict]:
    """MEDIUM: Sector-wide movement affecting watchlist stock."""
    alerts = []
    sector = data.get("sector")
    if not sector:
        return alerts
    sector_move = sector_movements.get(sector)
    if sector_move is None:
        return alerts
    curr = data.get("current_price")
    prev = data.get("previous_close")
    stock_change = _pct_change(curr, prev) if (curr is not None and prev is not None) else None
    if stock_change is None or abs(sector_move) < SECTOR_MOVE_THRESHOLD_PCT:
        return alerts
    same_direction = (sector_move > 0 and stock_change > 0) or (sector_move < 0 and stock_change < 0)
    if same_direction:
        alerts.append({
            "type": "sector_movement",
            "priority": "MEDIUM",
            "symbol": symbol,
            "sector": sector,
            "sector_move_pct": round(sector_move, 2),
            "stock_move_pct": round(stock_change, 2),
            "message": f"Sector '{sector}' moved {sector_move:+.2f}%; {symbol} moved {stock_change:+.2f}% (aligned).",
        })
    return alerts


def check_technical_levels(symbol: str, data: dict) -> List[dict]:
    """Breakouts and approach to support/resistance. LOW: gradual approach."""
    alerts = []
    curr = data.get("current_price")
    support = data.get("support")
    resistance = data.get("resistance")
    if curr is None:
        return alerts

    # Breakout above resistance
    if resistance is not None and curr > resistance:
        alerts.append({
            "type": "breakout_resistance",
            "priority": "MEDIUM",
            "symbol": symbol,
            "current_price": curr,
            "resistance": resistance,
            "message": f"Price {curr} above resistance {resistance}. Confirm breakout with volume.",
        })
    # Breakout below support
    elif support is not None and curr < support:
        alerts.append({
            "type": "breakout_support",
            "priority": "MEDIUM",
            "symbol": symbol,
            "current_price": curr,
            "support": support,
            "message": f"Price {curr} below support {support}. Potential breakdown; review stop-loss.",
        })
    else:
        # Approach to levels (LOW)
        if resistance is not None and resistance > 0:
            dist_pct = (resistance - curr) / resistance * 100
            if 0 < dist_pct <= TECH_LEVEL_APPROACH_PCT:
                alerts.append({
                    "type": "approach_resistance",
                    "priority": "LOW",
                    "symbol": symbol,
                    "current_price": curr,
                    "resistance": resistance,
                    "message": f"Approaching resistance {resistance} (within {dist_pct:.1f}%).",
                })
        if support is not None and support > 0 and curr > support:
            dist_pct = (curr - support) / support * 100
            if 0 < dist_pct <= TECH_LEVEL_APPROACH_PCT:
                alerts.append({
                    "type": "approach_support",
                    "priority": "LOW",
                    "symbol": symbol,
                    "current_price": curr,
                    "support": support,
                    "message": f"Approaching support {support} (within {dist_pct:.1f}%).",
                })
    return alerts


def check_news_sentiment(symbol: str, data: dict) -> List[dict]:
    """Scan last 24h sentiment; optional integration with news API."""
    alerts = []
    sentiment = (data.get("news_sentiment_24h") or "").strip().lower()
    headlines = data.get("news_headlines_24h") or []
    if not sentiment and not headlines:
        return alerts
    if sentiment == "negative" and headlines:
        alerts.append({
            "type": "news_sentiment",
            "priority": "MEDIUM",
            "symbol": symbol,
            "sentiment": sentiment,
            "headlines_sample": headlines[:3],
            "message": "Negative news sentiment in last 24h. Review headlines and impact on thesis.",
        })
    elif sentiment == "positive" and headlines:
        alerts.append({
            "type": "news_sentiment",
            "priority": "LOW",
            "symbol": symbol,
            "sentiment": sentiment,
            "headlines_sample": headlines[:3],
            "message": "Positive news in last 24h. Confirm if already priced in.",
        })
    return alerts


def priority_rank(p: str) -> int:
    order = {"URGENT": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    return order.get(p.upper(), 4)


def action_recommendation(alert: dict, symbol: str) -> str:
    """Suggest action based on alert type and priority."""
    t = alert.get("type", "")
    pri = (alert.get("priority") or "").upper()
    if t == "target_price":
        return "Review target; consider partial profit-taking or trailing stop. Do not chase."
    if t == "volume_price_combo":
        return "Confirm move with trend; avoid FOMO. Wait for pullback or consolidation before adding."
    if t == "price_movement":
        return "Check for news/catalyst. If no position, wait for pullback; if holding, consider tightening stop."
    if t == "volume_spike":
        return "Monitor for follow-through. Spike alone is informational; combine with price action."
    if t == "sector_movement":
        return "Sector-driven move; align with sector view. Rebalance sector weight if needed."
    if t in ("breakout_resistance", "breakout_support"):
        return "Validate breakout with close and volume. Trail stop on breakouts."
    if t in ("approach_resistance", "approach_support"):
        return "Plan entry/exit around level; avoid placing orders exactly at level (slippage)."
    if t == "news_sentiment":
        return "Read headlines; adjust thesis only if material. Avoid impulsive trades on sentiment."
    return "Review position and risk; no default action."


def run_monitor(
    watchlist_symbols: List[str],
    market_data: Dict[str, dict],
    sector_movements: Optional[Dict[str, float]] = None,
) -> dict:
    """
    Run full watchlist scan. Returns prioritized alert list with action recommendations.
    market_data: { symbol: { current_price, previous_close, volume?, average_volume?, target_price?, sector?, support?, resistance?, news_sentiment_24h?, news_headlines_24h? } }
    sector_movements: { sector: daily_move_pct } optional.
    """
    sector_movements = sector_movements or {}
    all_alerts: List[dict] = []
    price_alerts: List[dict] = []
    volume_alerts: List[dict] = []

    for symbol in watchlist_symbols:
        data = market_data.get(symbol) or {}
        # 1) Price movement
        pa = check_price_movement(symbol, data)
        price_alerts.extend(pa)
        all_alerts.extend(pa)
        # 2) Volume spike
        va = check_volume_spike(symbol, data)
        volume_alerts.extend(va)
        all_alerts.extend(va)
        # 3) Target price (URGENT)
        all_alerts.extend(check_target_price(symbol, data))
        # 4) Volume + price combo (HIGH)
        all_alerts.extend(check_volume_and_price_combo(symbol, data, price_alerts, volume_alerts))
        # 5) Sector movement
        all_alerts.extend(check_sector_movement(symbol, data, sector_movements))
        # 6) Technical levels
        all_alerts.extend(check_technical_levels(symbol, data))
        # 7) News sentiment
        all_alerts.extend(check_news_sentiment(symbol, data))

    # Dedupe by (symbol, type, priority) and sort: URGENT > HIGH > MEDIUM > LOW
    seen = set()
    unique = []
    for a in all_alerts:
        key = (a.get("symbol"), a.get("type"), a.get("priority"))
        if key in seen:
            continue
        seen.add(key)
        a = dict(a)
        a["action_recommendation"] = action_recommendation(a, a.get("symbol", ""))
        unique.append(a)
    unique.sort(key=lambda x: (priority_rank(x.get("priority")), x.get("symbol", "")))

    # Build output
    by_priority = {"URGENT": [], "HIGH": [], "MEDIUM": [], "LOW": []}
    for a in unique:
        p = (a.get("priority") or "LOW").upper()
        if p in by_priority:
            by_priority[p].append(a)

    return {
        "watchlist_symbols": watchlist_symbols,
        "alerts_prioritized": unique,
        "alerts_by_priority": by_priority,
        "summary": {
            "total_alerts": len(unique),
            "urgent": len(by_priority["URGENT"]),
            "high": len(by_priority["HIGH"]),
            "medium": len(by_priority["MEDIUM"]),
            "low": len(by_priority["LOW"]),
        },
    }


def main():
    if len(sys.argv) > 1:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            data = json.load(f)
        watchlist_symbols = data.get("watchlist_symbols", [])
        market_data = data.get("market_data", data.get("market_data_json", {}))
        sector_movements = data.get("sector_movements_pct", data.get("sector_movements", {}))
    else:
        watchlist_symbols = ["RELIANCE", "TCS", "INFY"]
        market_data = {
            "RELIANCE": {"current_price": 2480, "previous_close": 2410, "volume": 12e6, "average_volume": 8e6, "target_price": 2520, "sector": "Energy", "support": 2350, "resistance": 2550},
            "TCS": {"current_price": 3820, "previous_close": 3650, "volume": 4.2e6, "average_volume": 1.8e6, "target_price": 3900, "sector": "IT", "support": 3550, "resistance": 3950},
            "INFY": {"current_price": 1580, "previous_close": 1620, "volume": 9.8e6, "average_volume": 4.5e6, "target_price": 1750, "sector": "IT", "support": 1520, "resistance": 1680},
        }
        sector_movements = {"Energy": 2.1, "IT": -1.8}

    result = run_monitor(watchlist_symbols, market_data, sector_movements)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
