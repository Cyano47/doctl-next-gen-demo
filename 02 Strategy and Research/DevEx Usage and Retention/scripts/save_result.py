#!/usr/bin/env python3
"""Save a Snowflake MCP query result (JSON) as runs/<month>/data/<name>.csv.

Usage:
  python3 scripts/save_result.py --month 2026-10 --name base_churn result.json
  python3 scripts/save_result.py --month 2026-10 --name libraries_sample --append result.json

The JSON is the MCP tool output: {"query_id": ..., "result_set": {"data": [...], "resultSetMetaData": {"rowType": [...]}}}.
Column names are lower-cased so they match sql/manifest.json. --append adds rows to an existing file
(for per-sample-day queries) and refuses if the columns differ. Prints the query ID and row count for run-log.md.
"""
import argparse
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("json_file")
    p.add_argument("--month", required=True)
    p.add_argument("--name", required=True)
    p.add_argument("--append", action="store_true")
    a = p.parse_args()

    payload = json.loads(Path(a.json_file).read_text())
    rs = payload["result_set"]
    cols = [c["name"].lower() for c in rs["resultSetMetaData"]["rowType"]]
    rows = rs.get("data", [])
    out = ROOT / "runs" / a.month / "data" / f"{a.name}.csv"
    out.parent.mkdir(parents=True, exist_ok=True)

    if a.append and out.exists():
        with open(out, newline="") as f:
            have = next(csv.reader(f))
        if have != cols:
            sys.exit(f"column mismatch: file has {have}, result has {cols}")
        mode, header = "a", False
    else:
        if out.exists() and not a.append:
            sys.exit(f"{out} exists; pass --append or delete it first")
        mode, header = "w", True

    with open(out, mode, newline="") as f:
        w = csv.writer(f)
        if header:
            w.writerow(cols)
        w.writerows(["" if v is None else v for v in r] for r in rows)
    print(f"{a.name}: {len(rows)} rows, query {payload.get('query_id', '?')} -> {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
