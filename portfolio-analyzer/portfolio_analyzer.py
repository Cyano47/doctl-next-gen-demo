#!/usr/bin/env python3
"""
Portfolio Analyzer — Metrics, issue detection, and recommendations.
Inputs: portfolio_json, current_prices_json, risk_tolerance.
Output: Structured JSON with portfolio_health_score (0-100).
"""

import json
import sys
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Any, Optional


# ----- Expected input shapes -----
# portfolio_json: list of { symbol, name?, quantity, cost_price, sector, geography, asset_type, purchase_date? }
# geography: "India" | "US" | "Other"
# asset_type: "equity" | "commodity" | "crypto"
# current_prices_json: { "SYMBOL": price_float, ... }
# risk_tolerance: "Conservative" | "Moderate" | "Aggressive"

SECTOR_CONCENTRATION_THRESHOLD = 0.30   # 30%
LOSS_REVIEW_THRESHOLD = 0.20            # 20% loss → review/exit signal
DORMANT_MONTHS = 12
DATE_FMT = "%Y-%m-%d"


def load_inputs(portfolio_json: list[dict], current_prices_json: dict, risk_tolerance: str) -> tuple[list[dict], dict, str]:
    """Normalize and validate inputs."""
    if not portfolio_json or not current_prices_json:
        raise ValueError("portfolio_json and current_prices_json are required")
    r = risk_tolerance.strip().capitalize()
    if r not in ("Conservative", "Moderate", "Aggressive"):
        r = "Moderate"
    return portfolio_json, current_prices_json, r


def get_current_price(prices: dict, symbol: str) -> Optional[float]:
    v = prices.get(symbol)
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def compute_metrics(holdings: list[dict], prices: dict) -> dict[str, Any]:
    """Total value, unrealized P&L, sector/geo/asset breakdown."""
    total_cost = 0.0
    total_value = 0.0
    sector_value = defaultdict(float)
    geo_value = defaultdict(float)
    asset_value = defaultdict(float)
    position_details = []

    for h in holdings:
        symbol = (h.get("symbol") or "").strip()
        qty = float(h.get("quantity") or 0)
        cost_price = float(h.get("cost_price") or 0)
        sector = (h.get("sector") or "Other").strip()
        geography = (h.get("geography") or "Other").strip()
        asset_type = (h.get("asset_type") or "equity").strip().lower()
        if asset_type not in ("equity", "commodity", "crypto"):
            asset_type = "equity"

        cost = qty * cost_price
        total_cost += cost
        px = get_current_price(prices, symbol)
        if px is not None:
            value = qty * px
        else:
            value = cost  # no price → use cost (no P&L)
            px = cost_price
        total_value += value

        sector_value[sector] += value
        geo_value[geography] += value
        asset_value[asset_type] += value

        position_details.append({
            "symbol": symbol,
            "cost": round(cost, 2),
            "value": round(value, 2),
            "unrealized_pnl": round(value - cost, 2),
            "unrealized_pnl_pct": round((value - cost) / cost * 100, 2) if cost else 0,
        })

    # Percentages
    def pct_map(d: dict, total: float) -> dict[str, float]:
        if total <= 0:
            return {k: 0.0 for k in d}
        return {k: round(v / total * 100, 2) for k, v in d.items()}

    return {
        "total_value": round(total_value, 2),
        "total_cost": round(total_cost, 2),
        "unrealized_gain_loss": round(total_value - total_cost, 2),
        "unrealized_gain_loss_pct": round((total_value - total_cost) / total_cost * 100, 2) if total_cost else 0,
        "sector_allocation_pct": pct_map(dict(sector_value), total_value),
        "geographic_distribution_pct": pct_map(dict(geo_value), total_value),
        "asset_type_breakdown_pct": pct_map(dict(asset_value), total_value),
        "position_details": position_details,
        "_sector_value": dict(sector_value),
        "_geo_value": dict(geo_value),
        "_asset_value": dict(asset_value),
    }


def herfindahl_index(weights: list[float]) -> float:
    """Sum of squared weights. Higher = more concentration (less diversified). 1/n = equal weight."""
    if not weights:
        return 0.0
    w = [x for x in weights if x > 0]
    if not w:
        return 0.0
    return sum(x * x for x in w)


def identify_issues(holdings: list[dict], prices: dict, metrics: dict[str, Any]) -> dict[str, Any]:
    """Over-concentration, under-diversification, >20% losers, dormant >12 months."""
    issues = {
        "sector_over_concentration": [],
        "herfindahl_index": 0.0,
        "under_diversification_note": "",
        "assets_with_significant_loss": [],
        "dormant_positions": [],
    }

    total_value = metrics["total_value"] or 1
    sector_pct = metrics["sector_allocation_pct"] or {}
    for sector, pct in sector_pct.items():
        if pct > SECTOR_CONCENTRATION_THRESHOLD * 100:
            issues["sector_over_concentration"].append({
                "sector": sector,
                "allocation_pct": round(pct, 2),
                "threshold_pct": SECTOR_CONCENTRATION_THRESHOLD * 100,
            })

    # Herfindahl on position weights (by value)
    weights = []
    for det in metrics.get("position_details", []):
        v = det.get("value", 0) or 0
        if total_value > 0:
            weights.append(v / total_value)
    hhi = herfindahl_index(weights)
    issues["herfindahl_index"] = round(hhi, 4)
    n = len(weights)
    if n > 0:
        equal_weight_hhi = 1 / n
        if hhi > 0.25:  # arbitrary: very concentrated
            issues["under_diversification_note"] = (
                f"HHI = {hhi:.4f} (higher than 0.25 suggests concentration; equal-weight HHI = {equal_weight_hhi:.4f})."
            )
        else:
            issues["under_diversification_note"] = f"HHI = {hhi:.4f}; diversification acceptable."

    # >20% loss
    for det in metrics.get("position_details", []):
        pnl_pct = det.get("unrealized_pnl_pct") or 0
        if pnl_pct <= -LOSS_REVIEW_THRESHOLD * 100:  # -20%
            issues["assets_with_significant_loss"].append({
                "symbol": det.get("symbol"),
                "unrealized_pnl_pct": round(pnl_pct, 2),
            })

    # Dormant: held >12 months (using purchase_date)
    today = datetime.now().date()
    cutoff = today - timedelta(days=365 * (DORMANT_MONTHS // 12))
    for h in holdings:
        symbol = (h.get("symbol") or "").strip()
        pd = h.get("purchase_date")
        if not pd:
            continue
        try:
            if isinstance(pd, str):
                d = datetime.strptime(pd.strip()[:10], DATE_FMT).date()
            else:
                continue
        except Exception:
            continue
        if d <= cutoff:
            issues["dormant_positions"].append({
                "symbol": symbol,
                "purchase_date": pd,
                "months_held": round((today - d).days / 30, 1),
            })

    return issues


def generate_recommendations(
    holdings: list[dict],
    prices: dict,
    metrics: dict[str, Any],
    issues: dict[str, Any],
    risk_tolerance: str,
) -> list[dict[str, Any]]:
    """Priority, Action, Rationale, Risk per recommendation."""
    recs = []

    # Over-concentration → Rebalance
    for oc in issues.get("sector_over_concentration", []):
        sector = oc.get("sector", "")
        pct = oc.get("allocation_pct", 0)
        recs.append({
            "priority": "High",
            "action": "Rebalance",
            "rationale": f"Sector '{sector}' is {pct:.1f}% of portfolio (over {SECTOR_CONCENTRATION_THRESHOLD*100:.0f}% threshold). Reduces sector-specific risk to trim and spread to other sectors.",
            "risk": "Sector crash could disproportionately impact portfolio.",
        })

    # Under-diversification (HHI)
    hhi = issues.get("herfindahl_index", 0)
    if hhi > 0.25:
        recs.append({
            "priority": "Medium",
            "action": "Rebalance",
            "rationale": f"Herfindahl index {hhi:.4f} indicates concentration. Consider adding uncorrelated assets or rebalancing weights for better diversification.",
            "risk": "Idiosyncratic and correlation risk higher in concentrated portfolios.",
        })

    # Significant losers
    for loss in issues.get("assets_with_significant_loss", []):
        sym = loss.get("symbol", "?")
        pct = loss.get("unrealized_pnl_pct", 0)
        recs.append({
            "priority": "High",
            "action": "Review or Exit",
            "rationale": f"{sym} has unrealized loss of {pct:.1f}% (below -{LOSS_REVIEW_THRESHOLD*100:.0f}% review threshold). Reassess thesis and stop-loss; consider tax-loss harvesting or exit if thesis broken.",
            "risk": "Further drawdown; opportunity cost if fundamentals have deteriorated.",
        })

    # Dormant positions
    for d in issues.get("dormant_positions", []):
        sym = d.get("symbol", "?")
        months = d.get("months_held", 12)
        recs.append({
            "priority": "Low",
            "action": "Hold or Rebalance",
            "rationale": f"{sym} held over {months:.0f} months with no rebalance. Review if position still aligns with goals; otherwise consider trimming or adding to rebalance.",
            "risk": "Drift from target allocation; capital tied in underperformers.",
        })

    # Risk-profile based: Conservative → suggest derisking if equity/commodity/crypto high
    asset_pct = metrics.get("asset_type_breakdown_pct") or {}
    equity_pct = asset_pct.get("equity", 0) or 0
    crypto_pct = asset_pct.get("crypto", 0) or 0
    if risk_tolerance == "Conservative" and (equity_pct > 70 or crypto_pct > 5):
        recs.append({
            "priority": "Medium",
            "action": "Rebalance",
            "rationale": f"Conservative profile with equity at {equity_pct:.1f}% and crypto at {crypto_pct:.1f}%. Consider increasing fixed income / cash and trimming volatile assets.",
            "risk": "Drawdown may exceed risk tolerance.",
        })
    if risk_tolerance == "Aggressive" and equity_pct < 50 and not issues.get("sector_over_concentration"):
        recs.append({
            "priority": "Low",
            "action": "Hold",
            "rationale": f"Aggressive profile; current equity allocation {equity_pct:.1f}%. No change required unless seeking higher growth.",
            "risk": "Higher volatility accepted.",
        })

    return recs


def portfolio_health_score(metrics: dict[str, Any], issues: dict[str, Any], risk_tolerance: str) -> int:
    """Score 0-100 based on diversification, concentration, losses, and risk alignment."""
    score = 100.0
    # Sector over-concentration: -15 per sector over threshold
    for _ in issues.get("sector_over_concentration", []):
        score -= 15
    # Large unrealized loss positions: -10 per position
    for _ in issues.get("assets_with_significant_loss", []):
        score -= 10
    # HHI penalty
    hhi = issues.get("herfindahl_index", 0)
    if hhi > 0.4:
        score -= 20
    elif hhi > 0.25:
        score -= 10
    # Dormant: small penalty
    dormant = len(issues.get("dormant_positions", []))
    score -= min(dormant * 3, 15)
    # Unrealized portfolio loss
    pnl_pct = metrics.get("unrealized_gain_loss_pct")
    if isinstance(pnl_pct, (int, float)) and pnl_pct < -15:
        score -= 10
    return max(0, min(100, int(round(score))))


def run_analysis(portfolio_json: list[dict], current_prices_json: dict, risk_tolerance: str) -> dict[str, Any]:
    """Full pipeline: metrics, issues, recommendations, health score."""
    holdings, prices, risk = load_inputs(portfolio_json, current_prices_json, risk_tolerance)
    metrics = compute_metrics(holdings, prices)
    issues = identify_issues(holdings, prices, metrics)
    recommendations = generate_recommendations(holdings, prices, metrics, issues, risk)
    health = portfolio_health_score(metrics, issues, risk)

    # Build clean metrics output (exclude internal keys)
    out_metrics = {k: v for k, v in metrics.items() if not k.startswith("_")}

    return {
        "portfolio_health_score": health,
        "risk_tolerance": risk,
        "metrics": out_metrics,
        "issues": issues,
        "recommendations": recommendations,
    }


def main():
    if len(sys.argv) > 1:
        path = sys.argv[1]
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        portfolio_json = data.get("portfolio_json", data.get("portfolio", []))
        current_prices_json = data.get("current_prices_json", data.get("current_prices", {}))
        risk_tolerance = data.get("risk_tolerance", "Moderate")
    else:
        # Demo with embedded sample
        portfolio_json = [
            {"symbol": "RELIANCE", "name": "Reliance", "quantity": 50, "cost_price": 2400, "sector": "Energy", "geography": "India", "asset_type": "equity", "purchase_date": "2023-06-15"},
            {"symbol": "TCS", "name": "TCS", "quantity": 30, "cost_price": 3200, "sector": "IT", "geography": "India", "asset_type": "equity", "purchase_date": "2024-01-10"},
            {"symbol": "INFY", "name": "Infosys", "quantity": 60, "cost_price": 1400, "sector": "IT", "geography": "India", "asset_type": "equity", "purchase_date": "2022-11-01"},
        ]
        current_prices_json = {"RELIANCE": 2480, "TCS": 3800, "INFY": 1050}
        risk_tolerance = "Moderate"

    result = run_analysis(portfolio_json, current_prices_json, risk_tolerance)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
