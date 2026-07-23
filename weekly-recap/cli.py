#!/usr/bin/env python3
"""
CLI for weekly recap. Usage:
  python cli.py [--date YYYY-MM-DD] [--out path.md]
"""

import argparse
import sys
from pathlib import Path

# Ensure local package is found when run from project root or weekly-recap/
sys.path.insert(0, str(Path(__file__).resolve().parent))

from report_generator import generate_report


def main():
    parser = argparse.ArgumentParser(description="Generate weekly market recap (Markdown).")
    parser.add_argument(
        "--date",
        default=None,
        help="Week-ending date (YYYY-MM-DD). Default: last Friday.",
    )
    parser.add_argument(
        "--out",
        default=None,
        help="Output Markdown file path. Default: print to stdout.",
    )
    args = parser.parse_args()

    from datetime import datetime, timedelta
    if args.date:
        week_end_str = args.date
    else:
        d = datetime.now().date()
        while d.weekday() != 4:
            d = d - timedelta(days=1)
        week_end_str = d.strftime("%Y-%m-%d")

    report = generate_report(week_end_str)
    if args.out:
        Path(args.out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.out).write_text(report, encoding="utf-8")
        print(f"Written: {args.out}", file=sys.stderr)
    else:
        print(report)


if __name__ == "__main__":
    main()
