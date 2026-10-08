#!/usr/bin/env python3
"""Render the sql/ pack for one run month into runnable Snowflake queries.

Usage:
  python3 scripts/render_sql.py --month 2026-10
  python3 scripts/render_sql.py --month 2026-09 --samples all   # every sample day in the window

Writes runs/<month>/sql/<query>.sql. Per-sample-day queries get one file per month:
<query>__<YYYY-MM>.sql. By default only the run month's sample day is rendered, because
earlier sample days are already in history.

Placeholders:
  {{window_start}}       first month of the window (default 2026-01-01)
  {{prev_window_start}}  one month before the window, for new-or-returning in the first month
  {{month_start}}        run month, first day          {{month_end}}  first day of the next month
  {{month_label}}        run month as YYYY-MM          {{n_months}}   months in the window
  {{idle_cutoff}}        month_start minus 2 months (tokens idle 90+ days at month end)
  {{sample_day}}, {{sample_next}}, {{sample_month}}   raw-log sample day (second Wednesday)
  {{block:<name>}}       a block from sql/00_cohort.sql
"""
import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SQL = ROOT / "sql"


def add_months(d, n):
    i = d.year * 12 + d.month - 1 + n
    return dt.date(i // 12, i % 12 + 1, 1)


def second_wednesday(month_start):
    first_wed = month_start + dt.timedelta(days=(2 - month_start.weekday()) % 7)
    return first_wed + dt.timedelta(days=7)


def load_blocks():
    blocks, name, buf = {}, None, []
    for line in (SQL / "00_cohort.sql").read_text().splitlines():
        m = re.match(r"--\s*@block\s+(\w+)", line)
        if m:
            name, buf = m.group(1), []
        elif re.match(r"--\s*@end", line) and name:
            blocks[name] = "\n".join(buf).strip()
            name = None
        elif name and not line.lstrip().startswith("--"):
            buf.append(line)
    return blocks


def load_queries():
    queries = []
    for path in sorted(SQL.glob("0[1-9]_*.sql")):
        cur = None
        for line in path.read_text().splitlines():
            m = re.match(r"--\s*@query\s+(\w+)(\s+per_sample_day)?", line)
            if m:
                cur = {"name": m.group(1), "per_day": bool(m.group(2)), "file": path.name, "lines": []}
                queries.append(cur)
            elif cur is not None:
                cur["lines"].append(line)
    for q in queries:
        q["text"] = "\n".join(q["lines"]).strip() + "\n"
    return queries


def render(text, params, blocks):
    text = re.sub(r"\{\{block:(\w+)\}\}", lambda m: blocks[m.group(1)], text)
    text = re.sub(r"\{\{(\w+)\}\}", lambda m: str(params[m.group(1)]), text)
    left = re.findall(r"\{\{[^}]*\}\}", text)
    if left:
        sys.exit(f"unresolved placeholders: {sorted(set(left))}")
    return text


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--month", required=True, help="run month, YYYY-MM (last complete month)")
    p.add_argument("--window-start", default="2026-01")
    p.add_argument("--samples", choices=["new", "all"], default="new")
    p.add_argument("--out", help="output dir; default runs/<month>/sql")
    a = p.parse_args()

    ms = dt.date.fromisoformat(a.month + "-01")
    ws = dt.date.fromisoformat(a.window_start + "-01")
    if ms < ws:
        sys.exit("--month is before --window-start")
    n_months = (ms.year - ws.year) * 12 + ms.month - ws.month + 1
    base = {
        "window_start": ws, "prev_window_start": add_months(ws, -1),
        "month_start": ms, "month_end": add_months(ms, 1), "month_label": a.month,
        "n_months": n_months, "idle_cutoff": add_months(ms, -2),
    }
    blocks = load_blocks()
    queries = load_queries()
    manifest = json.loads((SQL / "manifest.json").read_text())["results"]
    missing = [q["name"] for q in queries if q["name"] not in manifest]
    if missing:
        sys.exit(f"queries not in sql/manifest.json: {missing}")

    out = Path(a.out) if a.out else ROOT / "runs" / a.month / "sql"
    out.mkdir(parents=True, exist_ok=True)
    sample_months = [add_months(ws, i) for i in range(n_months)] if a.samples == "all" else [ms]
    written = []
    for q in queries:
        if not q["per_day"]:
            f = out / f"{q['name']}.sql"
            f.write_text(f"-- {q['file']} @query {q['name']} for {a.month}\n" + render(q["text"], base, blocks))
            written.append(f)
            continue
        for sm in sample_months:
            day = second_wednesday(sm)
            params = dict(base, sample_day=day, sample_next=day + dt.timedelta(days=1), sample_month=sm.strftime("%Y-%m"))
            f = out / f"{q['name']}__{sm:%Y-%m}.sql"
            f.write_text(f"-- {q['file']} @query {q['name']} sample day {day}\n" + render(q["text"], params, blocks))
            written.append(f)
    for f in written:
        print(f.relative_to(ROOT) if f.is_relative_to(ROOT) else f)


if __name__ == "__main__":
    main()
