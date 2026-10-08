#!/usr/bin/env python3
"""Append a monthly run's result CSVs to the long-format history and compute deltas.

Usage:
  python3 scripts/append_history.py append --run-dir runs/2026-10
  python3 scripts/append_history.py deltas --month 2026-10 [--dimension all]
  python3 scripts/append_history.py check --month 2026-10
  python3 scripts/append_history.py latest --metric base_churn.active

Stdlib only. The history files are append only: rows are never edited or removed.
Readers take the row with the highest run_id for each key.
"""
import argparse
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "sql" / "manifest.json"
HISTORY = ROOT / "history"
FIELDS = ["run_id", "month", "metric_id", "dimension", "dimension_value", "value",
          "unit", "source_table", "definition_version", "is_final"]
KEY = ("run_id", "month", "metric_id", "dimension", "dimension_value")


def month_index(m):
    y, mo = m.split("-")[:2]
    return int(y) * 12 + int(mo) - 1


def load_manifest():
    with open(MANIFEST) as f:
        return json.load(f)


def read_history(name):
    path = HISTORY / name
    if not path.exists():
        return []
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def write_rows(name, rows):
    path = HISTORY / name
    new_file = not path.exists()
    with open(path, "a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        if new_file:
            w.writeheader()
        w.writerows(rows)


def dims_for(row, spec):
    if "name_col" in spec:
        return row[spec["name_col"]], row[spec["value_col"]]
    cols = spec["value_cols"]
    return spec["name"], "|".join(row[c] for c in cols)


def melt(run_id, run_month, entry_name, entry, version, path):
    out = {"metrics.csv": [], "churn.csv": []}
    errors = []
    churn_metrics = set(entry.get("churn_metrics", []))
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        missing = [c for c in entry["metrics"] if c not in reader.fieldnames]
        if missing:
            errors.append(f"{entry_name}: missing metric columns {missing}")
        for i, row in enumerate(reader, start=2):
            month = row.get("month") or entry.get("fixed_month") or run_month
            dim, val = dims_for(row, entry["dims"])
            for col, unit in entry["metrics"].items():
                raw = (row.get(col) or "").strip()
                if raw == "":
                    continue
                try:
                    float(raw)
                except ValueError:
                    errors.append(f"{entry_name} line {i}: {col}={raw!r} is not numeric")
                    continue
                is_churn = col in churn_metrics
                final = (month_index(run_month) - month_index(month) >= 3) if is_churn else True
                out["churn.csv" if is_churn else "metrics.csv"].append({
                    "run_id": run_id, "month": month, "metric_id": f"{entry_name}.{col}",
                    "dimension": dim, "dimension_value": val, "value": raw, "unit": unit,
                    "source_table": entry["source"], "definition_version": version,
                    "is_final": str(final).lower(),
                })
    return out, errors


def cmd_append(args):
    manifest = load_manifest()
    run_dir = (ROOT / args.run_dir) if not Path(args.run_dir).is_absolute() else Path(args.run_dir)
    run_id = args.run_id or run_dir.name
    run_month = args.run_month or run_id
    version = manifest["definition_version"]
    HISTORY.mkdir(exist_ok=True)
    existing = {name: {tuple(r[k] for k in KEY) for r in read_history(name)}
                for name in ("metrics.csv", "churn.csv")}
    all_errors, appended, skipped, absent = [], defaultdict(int), defaultdict(int), []
    for name, entry in manifest["results"].items():
        path = run_dir / "data" / f"{name}.csv"
        if not path.exists():
            absent.append(name)
            continue
        out, errors = melt(run_id, run_month, name, entry, version, path)
        all_errors += errors
        for target, rows in out.items():
            fresh = []
            for r in rows:
                k = tuple(r[c] for c in KEY)
                if k in existing[target]:
                    skipped[target] += 1
                    continue
                existing[target].add(k)
                fresh.append(r)
            if fresh and not args.dry_run:
                write_rows(target, fresh)
            appended[target] += len(fresh)
    for t in ("metrics.csv", "churn.csv"):
        print(f"{t}: appended {appended[t]}, skipped as duplicates {skipped[t]}"
              + (" (dry run, nothing written)" if args.dry_run else ""))
    if absent:
        print(f"no data file for: {', '.join(absent)}")
    if all_errors:
        print("ERRORS:", *all_errors, sep="\n  ")
        sys.exit(1)


def latest_rows():
    best = {}
    for name in ("metrics.csv", "churn.csv"):
        for r in read_history(name):
            k = (r["month"], r["metric_id"], r["dimension"], r["dimension_value"])
            if k not in best or r["run_id"] > best[k]["run_id"]:
                best[k] = r
    return best


def cmd_latest(args):
    w = csv.DictWriter(sys.stdout, fieldnames=FIELDS)
    w.writeheader()
    for k, r in sorted(latest_rows().items()):
        if args.metric and not r["metric_id"].startswith(args.metric):
            continue
        w.writerow(r)


def cmd_deltas(args):
    best = latest_rows()
    series = defaultdict(dict)
    for (month, metric, dim, val), r in best.items():
        if args.dimension and dim != args.dimension:
            continue
        series[(metric, dim, val)][month] = float(r["value"])
    m = month_index(args.month)
    to_m = lambda i: f"{i // 12}-{i % 12 + 1:02d}"
    rows = []
    for (metric, dim, val), s in sorted(series.items()):
        cur = s.get(args.month)
        if cur is None:
            continue
        prev = s.get(to_m(m - 1))
        avg3 = [s[to_m(m - j)] for j in (1, 2, 3) if to_m(m - j) in s]
        avg = sum(avg3) / len(avg3) if avg3 else None
        pct = lambda base: "" if not base else f"{100 * (cur - base) / base:.1f}"
        rows.append({"metric_id": metric, "dimension": dim, "dimension_value": val,
                     "value": cur, "prev_month": "" if prev is None else prev,
                     "mom_pct": pct(prev), "avg_3mo": "" if avg is None else round(avg, 2),
                     "vs_3mo_pct": pct(avg)})
    out = Path(args.out) if args.out else None
    fh = open(out, "w", newline="") if out else sys.stdout
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()) if rows else ["metric_id"])
    w.writeheader()
    w.writerows(rows)
    if out:
        fh.close()
        print(f"wrote {len(rows)} rows to {out}")


def cmd_check(args):
    best = latest_rows()
    m = month_index(args.month)
    prev = f"{(m - 1) // 12}-{(m - 1) % 12 + 1:02d}"
    have = lambda mon: {(k[1], k[2], k[3]) for k in best if k[0] == mon}
    cur, before = have(args.month), have(prev)
    # Churn rows for the current month never exist, and top-N lists rotate, so neither is expected.
    results = load_manifest()["results"]
    churn_cols = {f"{n}.{c}" for n, e in results.items() for c in e.get("churn_metrics", [])}
    rotating = {n for n, e in results.items() if e.get("rotating") is True}
    rotating_dims = {(n, d) for n, e in results.items() for d in e.get("rotating_dims", [])}
    def expected(k):
        name = k[0].split(".")[0]
        return k[0] not in churn_cols and name not in rotating and (name, k[1]) not in rotating_dims
    missing = sorted(k for k in before - cur if expected(k))
    print(f"{args.month}: {len(cur)} series; {prev}: {len(before)} series; missing vs prior: {len(missing)}")
    for k in missing[:50]:
        print("  missing:", *k)
    base = {k[0]: float(r["value"]) for k, r in best.items()
            if k[1] == "base_churn.active" and k[2] == "all"}
    if args.month in base and prev in base:
        chg = 100 * (base[args.month] - base[prev]) / base[prev]
        flag = "OK" if abs(chg) <= 10 else "WARN: outside +/-10%"
        print(f"active base {base[prev]:.0f} -> {base[args.month]:.0f} ({chg:+.1f}%) {flag}")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("append")
    a.add_argument("--run-dir", required=True)
    a.add_argument("--run-id")
    a.add_argument("--run-month", help="last complete month the run covers; defaults to run id")
    a.add_argument("--dry-run", action="store_true")
    a.set_defaults(fn=cmd_append)
    l = sub.add_parser("latest")
    l.add_argument("--metric")
    l.set_defaults(fn=cmd_latest)
    d = sub.add_parser("deltas")
    d.add_argument("--month", required=True)
    d.add_argument("--dimension")
    d.add_argument("--out")
    d.set_defaults(fn=cmd_deltas)
    c = sub.add_parser("check")
    c.add_argument("--month", required=True)
    c.set_defaults(fn=cmd_check)
    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
