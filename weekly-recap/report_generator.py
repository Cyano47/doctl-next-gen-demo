#!/usr/bin/env python3
"""
Generates the weekly market recap Markdown report from data_sources.
"""

from datetime import datetime
from typing import Any, Dict, List

from data_sources import (
    _week_end,
    get_commodity_highlights,
    get_commodities_corner,
    get_emerging_narratives,
    get_india_specific,
    get_indices_data,
    get_narrative_themes,
    get_us_specific,
    get_week_ahead,
)


def _fmt(date: datetime) -> str:
    return date.strftime("%B %d, %Y")  # e.g. January 24, 2025


def _executive_summary(week_end: datetime, indices: dict, themes: List[str], commodities: dict) -> str:
    """~150 words."""
    nifty = indices.get("Nifty50", {})
    sensex = indices.get("Sensex", {})
    sp = indices.get("S&P500", {})
    dow = indices.get("Dow_Jones", {})
    g = commodities.get("Gold", {})
    s = commodities.get("Silver", {})
    c = commodities.get("Crude_Oil", {})

    blurb = (
        f"Global equity markets ended the week to **{_fmt(week_end)}** on a positive note. "
        f"**Nifty 50** closed at {nifty.get('close', 0):,.2f} (+{nifty.get('change_pct', 0):.1f}%), "
        f"and **Sensex** at {sensex.get('close', 0):,.2f} (+{sensex.get('change_pct', 0):.1f}%). "
        f"In the US, **S&P 500** finished at {sp.get('close', 0):,.2f} (+{sp.get('change_pct', 0):.1f}%) "
        f"and **Dow Jones** at {dow.get('close', 0):,.2f} (+{dow.get('change_pct', 0):.1f}%). "
        f"Three themes dominated: (1) {themes[0] if themes else 'Risk-on sentiment'}; "
        f"(2) {themes[1] if len(themes) > 1 else 'Sector rotation'}; "
        f"(3) {themes[2] if len(themes) > 2 else 'Commodity volatility'}. "
        f"**Commodities**: Gold {g.get('price', 0):,.0f} ({g.get('unit', '')}) (+{g.get('change_pct', 0):.1f}%); "
        f"Silver {s.get('price', 0):,.0f} ({s.get('unit', '')}) (+{s.get('change_pct', 0):.1f}%); "
        f"Crude Oil $ {c.get('price', 0):.2f} {c.get('unit', '')} ({c.get('change_pct', 0):.1f}%)."
    )
    return blurb


def _section_emerging_narratives(narratives: List[Dict[str, Any]]) -> str:
    out = []
    for i, n in enumerate(narratives, 1):
        out.append(f"### Narrative {i}: {n.get('title', '')}\n")
        out.append(f"- **BENEFICIARIES:** {n.get('beneficiaries', '')}")
        out.append(f"- **MECHANICS:** {n.get('mechanics', '')}")
        out.append(f"- **EVIDENCE:** {n.get('evidence', '')}")
        out.append(f"- **OUTLOOK:** {n.get('outlook', '')}")
        out.append(f"- **ACTIONABLE:** {n.get('actionable', '')}\n")
    return "\n".join(out)


def _section_india(ind: Dict[str, Any]) -> str:
    lines = []
    lines.append("#### Nifty sector rotation\n")
    rows = ind.get("nifty_sector_rotation", [])
    lines.append("| Sector | Weekly return (%) | Comment |")
    lines.append("|--------|-------------------|--------|")
    for r in rows:
        lines.append(f"| {r.get('sector', '')} | {r.get('return_pct', 0):.1f} | {r.get('comment', '')} |")
    lines.append("")

    fii_dii = ind.get("fii_dii_flows", {})
    lines.append("#### FII / DII flow pattern\n")
    lines.append(f"- **FII (net equity):** ₹{fii_dii.get('FII_net_equity_cr', 0):,.0f} Cr — {fii_dii.get('FII_comment', '')}")
    lines.append(f"- **DII (net equity):** ₹{fii_dii.get('DII_net_equity_cr', 0):,.0f} Cr — {fii_dii.get('DII_comment', '')}\n")

    lines.append("#### Policy / regulatory updates\n")
    for item in ind.get("policy_regulatory", []):
        lines.append(f"- {item}")
    lines.append("")

    msl = ind.get("mid_small_vs_large", {})
    lines.append("#### Mid-cap / Small-cap vs Large-cap\n")
    lines.append(f"| Index | Weekly return (%) |")
    lines.append("|-------|-------------------|")
    lines.append(f"| Nifty 50 (Large-cap) | {msl.get('Nifty50_return_pct', 0):.1f} |")
    lines.append(f"| Nifty Midcap 100 | {msl.get('Nifty_Midcap100_return_pct', 0):.1f} |")
    lines.append(f"| Nifty Smallcap 100 | {msl.get('Nifty_Smallcap100_return_pct', 0):.1f} |")
    lines.append(f"\n*{msl.get('comment', '')}*\n")
    return "\n".join(lines)


def _section_us(us: Dict[str, Any]) -> str:
    lines = []
    lines.append("#### Fed policy implications\n")
    lines.append(f"{us.get('fed_policy', '')}\n")
    lines.append("#### Mega-cap tech performance\n")
    lines.append("| Name | Weekly return (%) | Comment |")
    lines.append("|------|-------------------|--------|")
    for m in us.get("mega_cap_tech", []):
        lines.append(f"| {m.get('name', '')} | {m.get('return_pct', 0):.1f} | {m.get('comment', '')} |")
    lines.append("")
    lines.append("#### Value vs Growth\n")
    lines.append(f"{us.get('value_vs_growth', '')}\n")
    lines.append("#### Earnings season insights\n")
    lines.append(f"{us.get('earnings_insights', '')}\n")
    return "\n".join(lines)


def _section_commodities(cc: Dict[str, Any]) -> str:
    lines = []
    lines.append("| Asset | Summary |")
    lines.append("|-------|--------|")
    for key, label in [("gold", "Gold"), ("crude_oil", "Crude Oil"), ("base_metals", "Base Metals"), ("agricultural", "Agricultural")]:
        lines.append(f"| **{label}** | {cc.get(key, '')} |")
    return "\n".join(lines)


def _section_week_ahead(wa: Dict[str, Any]) -> str:
    lines = []
    for title, key in [
        ("Economic data releases", "economic_data"),
        ("Major earnings", "earnings"),
        ("Central bank meetings / releases", "central_banks"),
        ("Geopolitical / other", "geopolitical"),
    ]:
        lines.append(f"**{title}**")
        for item in wa.get(key, []):
            lines.append(f"- {item}")
        lines.append("")
    return "\n".join(lines)


def _indices_table(indices: dict) -> str:
    lines = ["| Index | Close | Weekly change (%) | Week high | Week low |", "|-------|-------|-------------------|-----------|----------|"]
    for name, d in indices.items():
        lines.append(f"| {name} | {d.get('close', 0):,.2f} | {d.get('change_pct', 0):.1f} | {d.get('week_high', 0):,.0f} | {d.get('week_low', 0):,.0f} |")
    return "\n".join(lines)


def _commodity_table(commodities: dict) -> str:
    lines = ["| Commodity | Price | Unit | Weekly change (%) |", "|-----------|-------|------|-------------------|"]
    for name, d in commodities.items():
        lines.append(f"| {name} | {d.get('price', 0):,.2f} | {d.get('unit', '')} | {d.get('change_pct', 0):.1f} |")
    return "\n".join(lines)


def generate_report(week_end_date: str) -> str:
    """
    week_end_date: e.g. '2025-01-24'. Generates full Markdown report.
    """
    week_end = _week_end(week_end_date)
    indices = get_indices_data(week_end)
    themes = get_narrative_themes(week_end)
    commodities_hl = get_commodity_highlights(week_end)
    narratives = get_emerging_narratives(week_end)
    india = get_india_specific(week_end)
    us = get_us_specific(week_end)
    commodities_corner = get_commodities_corner(week_end)
    week_ahead = get_week_ahead(week_end)

    md = []
    md.append(f"# Weekly Market Recap — Week Ending {_fmt(week_end)}\n")
    md.append("---\n")

    md.append("## 1. Executive Summary\n")
    md.append(_executive_summary(week_end, indices, themes, commodities_hl))
    md.append("\n\n")
    md.append("### Key indices\n")
    md.append(_indices_table(indices))
    md.append("\n\n")
    md.append("### Commodity highlights\n")
    md.append(_commodity_table(commodities_hl))
    md.append("\n\n---\n")

    md.append("## 2. Emerging Narratives\n")
    md.append(_section_emerging_narratives(narratives))
    md.append("---\n")

    md.append("## 3. Indian Market Specific\n")
    md.append(_section_india(india))
    md.append("---\n")

    md.append("## 4. US Market Specific\n")
    md.append(_section_us(us))
    md.append("---\n")

    md.append("## 5. Commodities Corner\n")
    md.append(_section_commodities(commodities_corner))
    md.append("\n\n---\n")

    md.append("## 6. Week Ahead\n")
    md.append(_section_week_ahead(week_ahead))
    md.append("\n---\n")
    md.append(f"*Report generated for week ending {_fmt(week_end)}. Data from configured sources (see README).*\n")

    return "".join(md)
