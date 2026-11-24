#!/usr/bin/env python3
"""
Build aggregate, zero-PII cohort and service tables for the ~19k DigitalOcean MCP
account analysis through October 31, 2026.

Sources merged in memory (no account_id / user_id / email_address written to disk):
1. Google Sheet `MCP Usage data Updated` (`Account Retention`, sheet8.xml): 19,074
   accounts from raw EDGE_API_REQUESTS (2025-06-08 through 2026-10-31).
2. Snowflake `PRODUCTION.TRANSFORMED_DATA.PRODUCT_API_REQUESTS_DAILY` (< 2026-11-01):
   16,977 valid MCP UA accounts (queries 01c89f68-0821-dd8d-001b-b50227cd5fd3,
   01c89f69-0821-dd8d-001b-b50227cdebf3).
3. Master per-account feature & service bitmask vectors across CORE.ACCOUNTS,
   PROMOS_GITHUB_STUDENT_PACK_USAGES, WEB_ANALYTICS.ACCOUNT_SESSIONS,
   MFD.MONTHLY_ACCOUNT_REVENUE, MFD.ACCOUNT_NET_DOLLAR_RETENTION,
   MFD.MONTHLY_ACCOUNT_PRODUCT_REVENUE, PRODUCT_API_REQUESTS_DAILY,
   GEN_AI_USAGE_EVENTS_DAILY, GEN_AI_STARFISH_AGENTS,
   GEN_AI_STARFISH_KNOWLEDGE_BASES, GEN_AI_MODEL_ROUTERS, OHS.SESSIONS, and
   ACTION_GATEWAY.USAGE_TOOL_CALL (queries 01c89f6e-0821-dd8d-001b-b50227cea8d7,
   01c89f72-0821-cfce-001b-b50227cf1d0f, 01c89f73-0821-cfce-001b-b50227cf5bc7,
   01c89f74-0821-dd8d-001b-b50227d00923, 01c89f76-0821-cfce-001b-b50227d0533f,
   01c89f76-0821-cfce-001b-b50227d05323, 01c89f7a-0821-dd8d-001b-b50227d106d3,
   01c89f7f-0821-cfce-001b-b50227d22027).
4. Per-service gross dollar spend by cohort (query 01c89f7f-0821-cfce-001b-b50227d22023)
   and 2-day EDGE_API_REQUESTS 2xx vs 4xx calibration (query 01c89f6a-0821-cfce-001b-b50227ce50e7).
"""

from __future__ import annotations

import base64
import csv
import json
import os
import re
import struct
import zlib
from collections import Counter, defaultdict
from datetime import date, timedelta
from pathlib import Path
import xml.etree.ElementTree as ET

AGENT_TOOLS = Path(
    "/Users/valapati/.cursor/projects/Users-valapati-Documents-Cursor-Projects-03-Data-and-Analysis/agent-tools"
)
OUT_DIR = Path(
    "/Users/valapati/Documents/Cursor Projects/03 Data and Analysis/Data Analysis/data"
)

EPOCH = date(2025, 1, 1)
EXCEL_EPOCH = date(1899, 12, 30)
CUTOFF = date(2026, 10, 31)
OCT_START = date(2026, 10, 1)

PII_FORBIDDEN = {"account_id", "user_id", "email", "email_address", "team_id"}


def write_csv_safe(path: Path, fieldnames: list[str], rows: list[dict]) -> None:
    bad = [c for c in fieldnames if c.lower() in PII_FORBIDDEN]
    if bad:
        raise ValueError(f"Refusing to write PII columns {bad} to {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def parse_sheet8() -> tuple[dict[int, dict], int]:
    txt = (AGENT_TOOLS / "907c713e-afb2-4155-bb9d-512795903216.txt").read_text()
    m = re.search(r'"base64"\s*:\s*"([A-Za-z0-9+/=]+)', txt)
    assert m, "Could not locate base64 payload in cached XLSX export"
    b64 = m.group(1)
    b64 = b64[: len(b64) - (len(b64) % 4)]
    zb = base64.b64decode(b64)

    pos = 0
    entries: dict[str, bytes] = {}
    while pos < len(zb) - 30:
        idx = zb.find(b"PK\x03\x04", pos)
        if idx == -1 or idx + 30 > len(zb):
            break
        ver, flags, comp, mtime, mdate, crc, csize, usize, nlen, elen = struct.unpack(
            "<HHHHHIIIHH", zb[idx + 4 : idx + 30]
        )
        name = zb[idx + 30 : idx + 30 + nlen].decode("utf-8", "replace")
        dstart = idx + 30 + nlen + elen
        if comp == 8:
            do = zlib.decompressobj(-15)
            dec = do.decompress(zb[dstart:])
            consumed = len(zb[dstart:]) - len(do.unused_data)
            entries[name] = dec
            pos = dstart + max(consumed, 1)
        else:
            entries[name] = zb[dstart : dstart + csize]
            pos = dstart + max(csize, 1)

    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    root8 = ET.fromstring(entries["xl/worksheets/sheet8.xml"])
    sheet_mcp: dict[int, dict] = {}
    after_oct = 0
    for row in root8.findall(".//m:sheetData/m:row", ns)[1:]:
        vals: dict[str, tuple[str, str]] = {}
        for c in row.findall("m:c", ns):
            col = re.sub(r"[0-9]", "", c.attrib.get("r", ""))
            t = c.attrib.get("t", "")
            v = c.find("m:v", ns)
            if v is not None and v.text is not None:
                vals[col] = (t, v.text)
        if "A" not in vals or vals["A"][0] == "s" or "E" not in vals:
            continue
        aid = int(float(vals["A"][1]))
        fd = EXCEL_EPOCH + timedelta(days=int(float(vals["E"][1])))
        ld = EXCEL_EPOCH + timedelta(days=int(float(vals["F"][1])))
        if fd > CUTOFF:
            after_oct += 1
            continue
        if ld > CUTOFF:
            ld = CUTOFF
        sheet_mcp[aid] = {
            "users": int(float(vals["B"][1])),
            "reqs": int(float(vals["C"][1])),
            "days": int(float(vals["D"][1])),
            "f_date": fd,
            "l_date": ld,
            "rem": 1 if vals.get("G", ("", "N"))[1] == "Y" else 0,
        }
    return sheet_mcp, after_oct


def parse_daily_mcp() -> dict[int, dict]:
    daily: dict[int, dict] = {}
    for fn in [
        "0d72fa3a-d538-42cf-9327-c7f1f578b14d.txt",
        "4c6f8ccb-a0f4-4889-95ff-bbac40f66dd0.txt",
    ]:
        dd = json.loads((AGENT_TOOLS / fn).read_text())
        for r in dd["result_set"]["data"]:
            for item in r[2].split(","):
                aid, f_off, l_off, d_days, d_reqs, rem = map(int, item.split(":"))
                daily[aid] = {
                    "f_date": EPOCH + timedelta(days=f_off),
                    "l_date": EPOCH + timedelta(days=l_off),
                    "days": d_days,
                    "reqs": d_reqs,
                    "rem": rem,
                }
    return daily


def parse_feature_vectors() -> tuple[dict[int, list[int]], list[str]]:
    files = [
        "1a7cff31-5c89-4d97-b6bd-af9948148c9e.txt",
        "5654b935-9c10-4eb9-8a88-64d80c16d28f.txt",
        "a4b14cbb-e74f-42e9-a5ff-f7907b25706e.txt",
        "38c8fe99-bda1-48ea-86b2-d084cb05d024.txt",
        "e2320b75-7b2d-4afe-a24b-0175b04a306c.txt",
        "6f9a9529-bf7b-40fe-9b8b-90c770581636.txt",
        "ffb05818-dbdd-4064-9fc0-a11689afd174.txt",
        "1e9548c8-2f2b-474d-9678-53ce518f46a1.txt",
    ]
    feats: dict[int, list[int]] = {}
    qids: list[str] = []
    for fn in files:
        d = json.loads((AGENT_TOOLS / fn).read_text())
        qids.append(d["query_id"])
        rows = d["result_set"]["data"]
        cs = sum(int(r[1]) for r in rows)
        recs = [x for r in rows for x in r[2].split(",")]
        assert cs == len(recs), f"Count mismatch in {fn}: {cs} vs {len(recs)}"
        for x in recs:
            parts = list(map(int, x.split(":")))
            feats[parts[0]] = parts[1:]
    return feats, qids


def main() -> None:
    sheet_mcp, after_oct = parse_sheet8()
    daily_mcp = parse_daily_mcp()
    feats, qids = parse_feature_vectors()

    union_ids = sorted(set(sheet_mcp.keys()) | set(daily_mcp.keys()))
    print(f"=== SPINE RECONCILIATION (<= {CUTOFF}) ===")
    print(f"Sheet8 accounts (<= Oct 31): {len(sheet_mcp):,} (excluded post-Oct rows in sheet: {after_oct})")
    print(f"PRODUCT_API_REQUESTS_DAILY valid MCP accounts (<= Oct 31): {len(daily_mcp):,}")
    in_both = len(set(sheet_mcp.keys()) & set(daily_mcp.keys()))
    sheet_only_n = len(set(sheet_mcp.keys()) - set(daily_mcp.keys()))
    daily_only_n = len(set(daily_mcp.keys()) - set(sheet_mcp.keys()))
    print(f"Union raw accounts: {len(union_ids):,} (In both: {in_both:,}, Sheet-only: {sheet_only_n:,}, Daily-only: {daily_only_n:,})")

    hyg_labels = {
        0: "Clean: team",
        1: "Clean: teamgroup",
        2: "Clean: legacy_null_urn",
        91: "Excluded: missing_core_or_qa_id",
        92: "Excluded: do_employee",
        93: "Excluded: test_or_free_flag",
        94: "Excluded: abuse_or_admin_locked",
    }
    hyg_counter = Counter(feats[aid][0] for aid in union_ids)
    for k in sorted(hyg_counter):
        print(f"  {hyg_labels.get(k, str(k))}: {hyg_counter[k]:,}")

    # Build clean enriched account objects in memory
    clean_accts = []
    spine_reconcile_rows = [
        {"step": "1_sheet_account_retention_lte_2026_10_31", "accounts": len(sheet_mcp), "notes": f"Account Retention tab filtered to First_Request_Date <= 2026-10-31 ({after_oct} Nov-starter rows in sheet excluded)"},
        {"step": "2_snowflake_daily_valid_mcp_lte_2026_10_31", "accounts": len(daily_mcp), "notes": "PRODUCT_API_REQUESTS_DAILY < 2026-11-01 after excluding synthetic/probe MCP UAs (1 probe-only account dropped from 16,978 raw)"},
        {"step": "3_hybrid_union_raw", "accounts": len(union_ids), "notes": f"{in_both} in both + {sheet_only_n} Sheet-only (EDGE unsampled) + {daily_only_n} Daily-only (pre-Jun-2025 local / 3P MCP)"},
        {"step": "4_excl_missing_core_or_synthetic_qa_id", "accounts": -hyg_counter[91], "notes": "Missing CORE.ACCOUNTS row (e.g. account_id=0) or QA IDs (38082003, 6595347, 3057872, 31664295)"},
        {"step": "5_excl_do_employee", "accounts": -hyg_counter[92], "notes": "@digitalocean.com or is_free_employee"},
        {"step": "6_excl_test_or_free_internal", "accounts": -hyg_counter[93], "notes": "is_test or is_free"},
        {"step": "7_excl_abuse_or_admin_locked", "accounts": -hyg_counter[94], "notes": "is_abuse or is_admin_locked (suspended/hold/archived churners KEPT)"},
    ]

    for aid in union_ids:
        v = feats[aid]
        hyg = v[0]
        if hyg >= 90:
            continue
        cd_off, em, acct_flags, ref_code, ever_b, era_b, oct_b, oct_g_c, oct_n_c, peak_g_c, tier_code, ndr_code, sep_n_c, oct_ndr_c, comp_m, mcp_rm, mcp_pm, ver_dm, svc_m, oct_svc_m = v[1:]

        sm = sheet_mcp.get(aid)
        dm = daily_mcp.get(aid)
        in_daily = dm is not None
        if sm and dm:
            f_date = min(sm["f_date"], dm["f_date"])
            l_date = max(sm["l_date"], dm["l_date"])
            days = max(sm["days"], dm["days"])
            reqs = max(sm["reqs"], dm["reqs"])
            rem = max(sm["rem"], dm["rem"])
            src = "both"
        elif sm:
            f_date, l_date, days, reqs, rem = sm["f_date"], sm["l_date"], sm["days"], sm["reqs"], sm["rem"]
            src = "sheet_only"
        else:
            f_date, l_date, days, reqs, rem = dm["f_date"], dm["l_date"], dm["days"], dm["reqs"], dm["rem"]
            src = "daily_only"

        # Row group: Only MCP vs MCP + Others
        row_grp = "1. Only MCP" if comp_m == 0 else "2. MCP + Others"

        # Column lifecycle group (anchored to 2026-10-31)
        if l_date < OCT_START:
            col_grp = "1. Just Tried (1-2d, pre-Oct)" if days <= 2 else "2. Churned Away (3+d, $0 Oct MCP)"
        else:
            if f_date < OCT_START or days >= 3:
                col_grp = "3. Stayed Back (Oct Active)"
            else:
                col_grp = "4. Oct 2026 New Trial (1-2d)"

        # DO Billing status
        if ever_b == 0:
            bill_grp = "Never Billed ($0 All-Time)"
        elif oct_b == 1:
            bill_grp = "Billed & Stayed on DO (Oct > $0)"
        else:
            bill_grp = "Billed -> Churned DO ($0 Oct)"

        # 4-Stage MCP Infra Deployment Ladder
        infra_mut_mask = mcp_pm & 8191  # bits 1..4096 = true infra POST+PUT+PATCH
        non_infra_mut_mask = mcp_pm & (8192 + 16384 + 32768)  # account/SSH, monitoring/uptime, or DELETE
        if not in_daily:
            deploy_stage = "Stage 0 — Unsampled in Daily Endpoint Table"
        elif ver_dm > 0:
            deploy_stage = "Stage 4 — Verified MCP Infra Deployer (Write + Billed)"
        elif infra_mut_mask > 0:
            deploy_stage = "Stage 3 — Unbilled / Blocked MCP Infra Write"
        elif non_infra_mut_mask > 0:
            deploy_stage = "Stage 2 — SSH Key / Ops Config / Cleanup Only"
        else:
            deploy_stage = "Stage 1 — Read-Only Explorer (100% GET)"

        # Account tenure at first MCP request
        created_date = EPOCH + timedelta(days=cd_off) if cd_off > -9000 else f_date
        tenure_days = (f_date - created_date).days
        if tenure_days <= 7:
            tenure_band = "1. Brand-New Signup (0-7d)"
        elif tenure_days <= 30:
            tenure_band = "2. Recent Signup (8-30d)"
        elif tenure_days <= 180:
            tenure_band = "3. Developing (31-180d)"
        elif tenure_days <= 365:
            tenure_band = "4. Established (181-365d)"
        else:
            tenure_band = "5. Veteran DO Customer (1yr+)"

        # Peak monthly gross spend band (Mar 2025 - Oct 2026)
        peak_usd = peak_g_c / 100.0
        if ever_b == 0:
            spend_band = "0. Never Billed ($0)"
        elif peak_usd == 0:
            spend_band = "1. Legacy Billed (<Mar 2025 only)"
        elif peak_usd < 15:
            spend_band = "2. Micro (<$15/mo)"
        elif peak_usd < 50:
            spend_band = "3. Hobby ($15-$49/mo)"
        elif peak_usd < 250:
            spend_band = "4. Builder ($50-$249/mo)"
        elif peak_usd < 1000:
            spend_band = "5. Growth ($250-$999/mo)"
        else:
            spend_band = "6. Scaler ($1,000+/mo)"

        clean_accts.append({
            "hyg": hyg,
            "src": src,
            "in_daily": in_daily,
            "f_date": f_date,
            "l_date": l_date,
            "days": days,
            "reqs": reqs,
            "rem": rem,
            "row_grp": row_grp,
            "col_grp": col_grp,
            "bill_grp": bill_grp,
            "deploy_stage": deploy_stage,
            "tenure_band": tenure_band,
            "tenure_days": tenure_days,
            "spend_band": spend_band,
            "em": em,
            "is_stu": acct_flags & 1,
            "has_trial": 1 if (acct_flags & 2) else 0,
            "is_susp_arch": 1 if (acct_flags & 4) else 0,
            "ref_code": ref_code,
            "ever_b": ever_b,
            "era_b": era_b,
            "oct_b": oct_b,
            "oct_g": oct_g_c / 100.0,
            "oct_n": oct_n_c / 100.0,
            "peak_g": peak_usd,
            "tier_code": tier_code,
            "ndr_code": ndr_code,
            "sep_n": sep_n_c / 100.0,
            "oct_ndr": oct_ndr_c / 100.0,
            "comp_m": comp_m,
            "mcp_rm": mcp_rm,
            "mcp_pm": mcp_pm,
            "infra_mut_m": infra_mut_mask,
            "ver_dm": ver_dm,
            "svc_m": svc_m,
            "oct_svc_m": oct_svc_m,
        })

    team_only = sum(1 for a in clean_accts if a["hyg"] == 0)
    teamgroup_cnt = sum(1 for a in clean_accts if a["hyg"] == 1)
    legacy_urn_cnt = sum(1 for a in clean_accts if a["hyg"] == 2)
    spine_reconcile_rows.append({
        "step": "8_clean_customer_spine_all_urn",
        "accounts": len(clean_accts),
        "notes": f"Clean customer universe: {team_only} team + {teamgroup_cnt} enterprise teamgroup + {legacy_urn_cnt} legacy NULL URN",
    })
    spine_reconcile_rows.append({
        "step": "9_clean_customer_spine_team_only",
        "accounts": team_only,
        "notes": "Strict account_urn_type = 'team' subset",
    })
    spine_reconcile_rows.append({
        "step": "10_clean_customer_in_daily_endpoint_table",
        "accounts": sum(1 for a in clean_accts if a["in_daily"]),
        "notes": "Clean accounts with endpoint & HTTP-verb visibility in PRODUCT_API_REQUESTS_DAILY",
    })
    write_csv_safe(OUT_DIR / "mcp_19k_spine_reconciliation.csv", ["step", "accounts", "notes"], spine_reconcile_rows)
    print(f"Clean customer accounts (all URN): {len(clean_accts):,} (team-only: {team_only:,}, in_daily: {sum(1 for a in clean_accts if a['in_daily']):,})")

    # =========================================================================
    # TABLE 1: 2x4 Cohort Matrix + DO Billing + NRR + MCP Infra Deploy Rate
    # =========================================================================
    matrix_rows = []
    groups_2x4 = defaultdict(list)
    for a in clean_accts:
        groups_2x4[(a["row_grp"], a["col_grp"])].append(a)
        groups_2x4[(a["row_grp"], "ALL_LIFECYCLE")].append(a)
        groups_2x4[("ALL_MCP", a["col_grp"])].append(a)
        groups_2x4[("ALL_MCP", "ALL_LIFECYCLE")].append(a)

    row_order = ["1. Only MCP", "2. MCP + Others", "ALL_MCP"]
    col_order = [
        "1. Just Tried (1-2d, pre-Oct)",
        "2. Churned Away (3+d, $0 Oct MCP)",
        "3. Stayed Back (Oct Active)",
        "4. Oct 2026 New Trial (1-2d)",
        "ALL_LIFECYCLE",
    ]
    print("\n=== STEP 2: 2x4 COHORT MATRIX ===")
    for rg in row_order:
        for cg in col_order:
            sub = groups_2x4[(rg, cg)]
            n = len(sub)
            if n == 0:
                continue
            n_daily = sum(1 for a in sub if a["in_daily"])
            nev = sum(1 for a in sub if a["ever_b"] == 0)
            b_ch = sum(1 for a in sub if a["ever_b"] == 1 and a["oct_b"] == 0)
            b_st = sum(1 for a in sub if a["oct_b"] == 1)
            ever_b_n = b_ch + b_st
            oct_gross = sum(a["oct_g"] for a in sub)
            sep_net = sum(a["sep_n"] for a in sub)
            oct_ndr_net = sum(a["oct_ndr"] for a in sub)
            # NRR among Sep-active accounts (ndr_code in 1,2,3,4 -> sep_n > 0)
            sep_cohort_prev = sum(a["sep_n"] for a in sub if a["ndr_code"] in (1, 2, 3, 4))
            sep_cohort_curr = sum(a["oct_ndr"] for a in sub if a["ndr_code"] in (1, 2, 3, 4))
            mo_nrr_pct = (100.0 * sep_cohort_curr / sep_cohort_prev) if sep_cohort_prev > 0 else 0.0
            exp_n = sum(1 for a in sub if a["ndr_code"] == 4)
            con_n = sum(1 for a in sub if a["ndr_code"] == 2)
            s4_n = sum(1 for a in sub if a["deploy_stage"].startswith("Stage 4"))
            s34_n = sum(1 for a in sub if a["deploy_stage"].startswith(("Stage 3", "Stage 4")))
            rem_n = sum(1 for a in sub if a["rem"] == 1)
            row_dict = {
                "interface_cohort": rg,
                "mcp_lifecycle_cohort": cg,
                "accounts": n,
                "pct_of_total": round(100.0 * n / len(clean_accts), 2),
                "remote_mcp_accts": rem_n,
                "remote_mcp_pct": round(100.0 * rem_n / n, 1),
                "never_billed_accts": nev,
                "billed_churned_do_accts": b_ch,
                "billed_stayed_do_accts": b_st,
                "do_oct_paid_share_pct": round(100.0 * b_st / n, 1),
                "do_paid_retention_of_ever_billed_pct": round(100.0 * b_st / ever_b_n, 1) if ever_b_n else 0.0,
                "oct_2026_gross_usd": round(oct_gross, 2),
                "oct_2026_arpa_paid_usd": round(oct_gross / b_st, 2) if b_st else 0.0,
                "sep_to_oct_mom_nrr_pct": round(mo_nrr_pct, 2),
                "oct_expanding_accts": exp_n,
                "oct_contracting_accts": con_n,
                "daily_endpoint_visible_accts": n_daily,
                "mcp_infra_attempt_s3_s4_accts": s34_n,
                "mcp_infra_attempt_pct_of_visible": round(100.0 * s34_n / n_daily, 1) if n_daily else 0.0,
                "verified_mcp_deployer_s4_accts": s4_n,
                "verified_mcp_deployer_pct_of_visible": round(100.0 * s4_n / n_daily, 1) if n_daily else 0.0,
            }
            matrix_rows.append(row_dict)
            print(
                f"  {rg:16s} | {cg:34s} | n={n:6,d} ({row_dict['pct_of_total']:5.1f}%) | "
                f"OctPaid={b_st:5,d} ({row_dict['do_oct_paid_share_pct']:4.1f}%, RetOfBilled={row_dict['do_paid_retention_of_ever_billed_pct']:4.1f}%) | "
                f"OctGross=${oct_gross:10,.0f} | MoM_NRR={mo_nrr_pct:5.1f}% | "
                f"InfraTry={row_dict['mcp_infra_attempt_pct_of_visible']:4.1f}% | VerDeploy={row_dict['verified_mcp_deployer_pct_of_visible']:4.1f}%"
            )

    write_csv_safe(OUT_DIR / "mcp_19k_cohort_matrix_2x4.csv", list(matrix_rows[0].keys()), matrix_rows)

    # =========================================================================
    # TABLE 2: Step 4 — 4-Stage MCP Infra Deployment Ladder & Retention Lift
    # =========================================================================
    ladder_rows = []
    stage_order = [
        "Stage 1 — Read-Only Explorer (100% GET)",
        "Stage 2 — SSH Key / Ops Config / Cleanup Only",
        "Stage 3 — Unbilled / Blocked MCP Infra Write",
        "Stage 4 — Verified MCP Infra Deployer (Write + Billed)",
        "Stage 0 — Unsampled in Daily Endpoint Table",
    ]
    print("\n=== STEP 4A: 4-STAGE DEPLOYING INFRA LADDER ===")
    for rg in ["ALL_MCP", "1. Only MCP", "2. MCP + Others"]:
        base = [a for a in clean_accts if rg == "ALL_MCP" or a["row_grp"] == rg]
        vis_n = sum(1 for a in base if a["in_daily"])
        for stg in stage_order:
            sub = [a for a in base if a["deploy_stage"] == stg]
            n = len(sub)
            if n == 0:
                continue
            pre_oct = [a for a in sub if a["f_date"] < OCT_START]
            pre_oct_stayed_mcp = sum(1 for a in pre_oct if a["l_date"] >= OCT_START)
            ever_b_n = sum(1 for a in sub if a["ever_b"] == 1)
            oct_b_n = sum(1 for a in sub if a["oct_b"] == 1)
            oct_g = sum(a["oct_g"] for a in sub)
            rem_only = sum(1 for a in sub if a["rem"] == 1)
            d = {
                "interface_cohort": rg,
                "deploy_stage": stg,
                "accounts": n,
                "pct_of_cohort_all": round(100.0 * n / len(base), 1),
                "pct_of_visible_daily": round(100.0 * n / vis_n, 1) if (vis_n and not stg.startswith("Stage 0")) else 0.0,
                "remote_mcp_pct": round(100.0 * rem_only / n, 1),
                "pre_oct_starters": len(pre_oct),
                "pre_oct_mcp_oct_retained_accts": pre_oct_stayed_mcp,
                "pre_oct_mcp_oct_retention_pct": round(100.0 * pre_oct_stayed_mcp / len(pre_oct), 1) if pre_oct else 0.0,
                "ever_billed_accts": ever_b_n,
                "oct_paid_do_accts": oct_b_n,
                "oct_paid_do_share_pct": round(100.0 * oct_b_n / n, 1),
                "do_paid_retention_of_billed_pct": round(100.0 * oct_b_n / ever_b_n, 1) if ever_b_n else 0.0,
                "oct_2026_gross_usd": round(oct_g, 2),
                "oct_arpa_paid_usd": round(oct_g / oct_b_n, 2) if oct_b_n else 0.0,
            }
            ladder_rows.append(d)
            if rg in ("ALL_MCP", "1. Only MCP", "2. MCP + Others"):
                print(
                    f"  {rg:15s} | {stg:54s} | n={n:5,d} ({d['pct_of_visible_daily']:4.1f}% vis) | "
                    f"PreOct_MCPRet={d['pre_oct_mcp_oct_retention_pct']:4.1f}% ({pre_oct_stayed_mcp}/{len(pre_oct)}) | "
                    f"OctPaid={oct_b_n:5,d} ({d['oct_paid_do_share_pct']:4.1f}%) | OctGross=${oct_g:10,.0f}"
                )
    write_csv_safe(OUT_DIR / "mcp_19k_infra_deployment_ladder.csv", list(ladder_rows[0].keys()), ladder_rows)

    # =========================================================================
    # TABLE 3: Step 4B — Individual MCP Endpoints Read vs Write vs Verified Deploy
    # =========================================================================
    ep_defs = [
        (1, "Droplets & 1-Clicks", "Compute"),
        (2, "App Platform", "Compute (PaaS)"),
        (4, "Functions", "Serverless"),
        (8, "DOKS (Kubernetes)", "Containers"),
        (16, "Managed Databases (PG/MySQL/Valkey/Mongo/Kafka/OS)", "Databases"),
        (32, "Vector Databases", "AI & Data"),
        (64, "Spaces Object Storage", "Storage"),
        (128, "Volumes Block Storage & NFS", "Storage"),
        (256, "Container Registry (DOCR)", "Containers"),
        (512, "Cloud Firewalls", "Networking"),
        (1024, "Domains, DNS, CDN & Certificates", "Networking"),
        (2048, "VPCs, Load Balancers & Reserved IPs", "Networking"),
        (4096, "Gradient AI / Agents / Dedicated Inference / MicroVMs", "AI & Sandboxes"),
        (8192, "Account, SSH Keys, Projects, Tags & Images (Non-Infra)", "Config / Admin"),
        (16384, "Uptime, Monitoring & Insights (Non-Infra)", "Observability"),
    ]
    ep_rows = []
    vis_all = [a for a in clean_accts if a["in_daily"]]
    vis_only = [a for a in vis_all if a["row_grp"] == "1. Only MCP"]
    vis_oth = [a for a in vis_all if a["row_grp"] == "2. MCP + Others"]
    print("\n=== STEP 4B: INDIVIDUAL MCP ENDPOINTS (READ vs WRITE vs VERIFIED DEPLOY) ===")
    for bit, name, cat in ep_defs:
        r_all = sum(1 for a in vis_all if a["mcp_rm"] & bit)
        p_all = sum(1 for a in vis_all if a["mcp_pm"] & bit)
        v_all = sum(1 for a in vis_all if a["ver_dm"] & bit)
        v_only = sum(1 for a in vis_only if a["ver_dm"] & bit)
        v_oth = sum(1 for a in vis_oth if a["ver_dm"] & bit)
        p_only = sum(1 for a in vis_only if a["mcp_pm"] & bit)
        p_oth = sum(1 for a in vis_oth if a["mcp_pm"] & bit)
        row = {
            "endpoint_name": name,
            "category": cat,
            "is_true_infra_endpoint": "Yes" if bit <= 4096 else "No",
            "mcp_any_call_accts": r_all,
            "mcp_any_call_pct_of_visible": round(100.0 * r_all / len(vis_all), 2),
            "mcp_write_post_put_patch_accts": p_all,
            "mcp_write_conversion_of_readers_pct": round(100.0 * p_all / r_all, 1) if r_all else 0.0,
            "verified_billed_deploy_accts": v_all,
            "verified_share_of_writers_pct": round(100.0 * v_all / p_all, 1) if (p_all and bit <= 4096) else 0.0,
            "only_mcp_write_accts": p_only,
            "only_mcp_verified_deploy_accts": v_only,
            "mcp_plus_others_write_accts": p_oth,
            "mcp_plus_others_verified_deploy_accts": v_oth,
        }
        ep_rows.append(row)
        print(
            f"  {name:52s} | Read={r_all:6,d} | Write={p_all:5,d} ({row['mcp_write_conversion_of_readers_pct']:4.1f}%) | "
            f"VerDeploy={v_all:5,d} (OnlyMCP={v_only:4,d}, +Oth={v_oth:4,d})"
        )
    write_csv_safe(OUT_DIR / "mcp_19k_mcp_endpoints_deployed.csv", list(ep_rows[0].keys()), ep_rows)

    # =========================================================================
    # TABLE 4: Step 3 — Personas & Companion Interfaces
    # =========================================================================
    persona_rows = []

    def add_persona_dim(dim_name: str, getter):
        buckets = sorted({getter(a) for a in clean_accts})
        for b in buckets:
            sub = [a for a in clean_accts if getter(a) == b]
            n = len(sub)
            n_only = sum(1 for a in sub if a["row_grp"] == "1. Only MCP")
            n_oth = n - n_only
            n_stayed_mcp = sum(1 for a in sub if a["col_grp"] == "3. Stayed Back (Oct Active)")
            n_oct_paid = sum(1 for a in sub if a["oct_b"] == 1)
            n_vis = sum(1 for a in sub if a["in_daily"])
            n_s4 = sum(1 for a in sub if a["deploy_stage"].startswith("Stage 4"))
            oct_g = sum(a["oct_g"] for a in sub)
            persona_rows.append({
                "dimension": dim_name,
                "segment": b,
                "accounts": n,
                "pct_of_clean_total": round(100.0 * n / len(clean_accts), 1),
                "only_mcp_accts": n_only,
                "only_mcp_share_pct": round(100.0 * n_only / n, 1),
                "mcp_plus_others_accts": n_oth,
                "stayed_back_mcp_accts": n_stayed_mcp,
                "stayed_back_mcp_pct": round(100.0 * n_stayed_mcp / n, 1),
                "oct_paid_do_accts": n_oct_paid,
                "oct_paid_do_pct": round(100.0 * n_oct_paid / n, 1),
                "verified_mcp_deployer_s4_pct_of_vis": round(100.0 * n_s4 / n_vis, 1) if n_vis else 0.0,
                "oct_2026_gross_usd": round(oct_g, 2),
            })

    em_map = {
        0: "1. Custom / Corporate Domain",
        1: "2. Free Consumer Email (Gmail/Outlook/etc.)",
        2: "3. University Domain (.edu / academic)",
        3: "4. Autonomous Agent Inbox (grokbot / agentmail)",
        4: "5. Extended Bot / Temp Agent Domain",
    }
    tier_map = {
        0: "0. Unbilled / No Tier",
        1: "1. Learner (<$50/mo tier)",
        2: "2. Builder ($50-$249/mo tier)",
        3: "3. Scaler ($250+/mo tier)",
        4: "4. Other / Unclassified Tier",
    }
    ref_map = {
        0: "0. Direct / Organic / Non-AI Web",
        1: "1. ChatGPT / OpenAI Referrer",
        2: "2. Claude / Anthropic Referrer",
        3: "3. Google Gemini Referrer",
        4: "4. Perplexity Referrer",
        5: "5. Other AI Referrer (Cursor/Grok/Copilot/DeepSeek)",
    }

    add_persona_dim("Account Tenure at First MCP Call", lambda a: a["tenure_band"])
    add_persona_dim("Peak Monthly DO Gross Spend Band", lambda a: a["spend_band"])
    add_persona_dim("DO Revenue Tier (Latest Paid Month)", lambda a: tier_map[a["tier_code"]])
    add_persona_dim("Email & Identity Archetype", lambda a: em_map[a["em"]])
    add_persona_dim("GitHub Student Pack", lambda a: "GitHub Student Pack Verified" if a["is_stu"] else "Non-Student")
    add_persona_dim("First AI Web Referrer", lambda a: ref_map[a["ref_code"]])
    add_persona_dim("MCP Transport Mode", lambda a: "Remote MCP (do-remote-mcp)" if a["rem"] == 1 else "Local / 3P MCP Only")
    add_persona_dim("URN Account Type", lambda a: {0: "team", 1: "teamgroup (Enterprise)", 2: "legacy_null"}[a["hyg"]])

    print("\n=== STEP 3A: PERSONA HIGHLIGHTS ===")
    for r in persona_rows:
        print(
            f"  [{r['dimension']}] {r['segment']:48s} | n={r['accounts']:6,d} ({r['pct_of_clean_total']:4.1f}%) | "
            f"OnlyMCP={r['only_mcp_share_pct']:4.1f}% | StayedMCP={r['stayed_back_mcp_pct']:4.1f}% | "
            f"OctPaid={r['oct_paid_do_pct']:4.1f}% | VerDep={r['verified_mcp_deployer_s4_pct_of_vis']:4.1f}% | Oct$=${r['oct_2026_gross_usd']:10,.0f}"
        )
    write_csv_safe(OUT_DIR / "mcp_19k_personas.csv", list(persona_rows[0].keys()), persona_rows)

    # Companion Interfaces inside MCP + Others
    comp_defs = [
        (1, "doctl CLI"),
        (2, "Terraform (terraform-provider-digitalocean)"),
        (4, "Other IaC (Pulumi / Ansible / Packer / Crossplane)"),
        (8, "pydo (Official Python SDK)"),
        (16, "godo (Official Go SDK)"),
        (32, "Other Official SDKs (dots / dropletkit)"),
        (64, "Community SDKs (python-digitalocean / PHP / .NET)"),
        (128, "GitHub Actions / do-app-action CI"),
        (256, "AI Client Direct APIs (Cursor / Claude / OpenCode / Codex / LiteLLM)"),
        (512, "curl CLI"),
        (1024, "Raw HTTP Libraries (python-requests / axios / node / Go http)"),
    ]
    oth_accts = [a for a in clean_accts if a["row_grp"] == "2. MCP + Others"]
    comp_rows = []
    # Also compute Named DevEx/AI Tools vs Only curl/raw_http inside MCP + Others
    named_mask = 1 + 2 + 4 + 8 + 16 + 32 + 64 + 128 + 256
    print(f"\n=== STEP 3B: COMPANION INTERFACES INSIDE MCP + OTHERS (n={len(oth_accts):,}) ===")
    for label, pred in [
        ("ANY Named DevEx / IaC / SDK / AI Tool", lambda m: (m & named_mask) > 0),
        ("ONLY curl / Raw HTTP Libraries (No Named CLI/IaC/SDK)", lambda m: (m & named_mask) == 0 and (m & (512 + 1024)) > 0),
    ] + [(nm, (lambda b: lambda m: (m & b) > 0)(bit)) for bit, nm in comp_defs]:
        sub = [a for a in oth_accts if pred(a["comp_m"])]
        n = len(sub)
        st_mcp = sum(1 for a in sub if a["col_grp"] == "3. Stayed Back (Oct Active)")
        oct_p = sum(1 for a in sub if a["oct_b"] == 1)
        vis_s = sum(1 for a in sub if a["in_daily"])
        s4_s = sum(1 for a in sub if a["deploy_stage"].startswith("Stage 4"))
        oct_g = sum(a["oct_g"] for a in sub)
        r = {
            "companion_interface": label,
            "accounts": n,
            "pct_of_mcp_plus_others": round(100.0 * n / len(oth_accts), 1) if oth_accts else 0.0,
            "pct_of_all_clean_mcp": round(100.0 * n / len(clean_accts), 1),
            "stayed_back_mcp_pct": round(100.0 * st_mcp / n, 1) if n else 0.0,
            "oct_paid_do_pct": round(100.0 * oct_p / n, 1) if n else 0.0,
            "verified_mcp_deployer_s4_pct": round(100.0 * s4_s / vis_s, 1) if vis_s else 0.0,
            "oct_2026_gross_usd": round(oct_g, 2),
        }
        comp_rows.append(r)
        print(
            f"  {label:66s} | n={n:5,d} ({r['pct_of_mcp_plus_others']:4.1f}%) | "
            f"StayedMCP={r['stayed_back_mcp_pct']:4.1f}% | OctPaid={r['oct_paid_do_pct']:4.1f}% | VerDep={r['verified_mcp_deployer_s4_pct']:4.1f}% | Oct$=${oct_g:10,.0f}"
        )
    write_csv_safe(OUT_DIR / "mcp_19k_companion_interfaces.csv", list(comp_rows[0].keys()), comp_rows)

    # =========================================================================
    # TABLE 5: Step 5 — Individual DO & AI Services (Attach Rate Across Cohorts)
    # =========================================================================
    svc_defs = [
        (1, "Droplets (incl. Backups & Snapshots)", "Core Compute"),
        (2, "App Platform", "PaaS / Serverless"),
        (4, "Functions", "PaaS / Serverless"),
        (8, "DOKS (Managed Kubernetes)", "Containers"),
        (16, "Managed PostgreSQL", "Managed Databases"),
        (32, "Managed MySQL", "Managed Databases"),
        (64, "Managed Valkey / Redis", "Managed Databases"),
        (128, "Managed MongoDB", "Managed Databases"),
        (256, "Managed OpenSearch / Vector", "Managed Databases"),
        (512, "Managed Kafka", "Managed Databases"),
        (1024, "Spaces Object Storage", "Storage"),
        (2048, "Volumes Block Storage / NFS", "Storage"),
        (4096, "Container Registry (DOCR)", "Containers"),
        (8192, "Networking (Load Balancers / Reserved IPs / VPC)", "Networking"),
        (16384, "GPU Droplets / Bare Metal / Paperspace", "AI & GPU Compute"),
        (32768, "Gradient Serverless Inference (Billed or Usage)", "Gradient AI Platform"),
        (65536, "Gradient Dedicated Inference", "Gradient AI Platform"),
        (131072, "Gradient Agent Platform (Billed or Active Agent)", "Gradient AI Platform"),
        (262144, "Gradient Knowledge Bases (Billed or Active KB)", "Gradient AI Platform"),
        (524288, "Gradient Model Routers", "Gradient AI Platform"),
        (1048576, "Sandboxes / MicroVMs / OHS Sessions", "Agentic Runtime"),
        (2097152, "Action Gateway (Billed or Tool Calls)", "Agentic Runtime"),
        (4194304, "Marketplace Paid Add-ons & Uptime", "Ecosystem / Ops"),
    ]

    only_all = [a for a in clean_accts if a["row_grp"] == "1. Only MCP"]
    oth_all = [a for a in clean_accts if a["row_grp"] == "2. MCP + Others"]
    s4_all = [a for a in clean_accts if a["deploy_stage"].startswith("Stage 4")]
    s1_all = [a for a in clean_accts if a["deploy_stage"].startswith("Stage 1")]
    stayed_all = [a for a in clean_accts if a["col_grp"] == "3. Stayed Back (Oct Active)"]
    churn_all = [a for a in clean_accts if a["col_grp"] == "2. Churned Away (3+d, $0 Oct MCP)"]
    just_all = [a for a in clean_accts if a["col_grp"] == "1. Just Tried (1-2d, pre-Oct)"]

    svc_rows = []
    print("\n=== STEP 5: INDIVIDUAL DO & AI SERVICES ATTACH (MAR 2025 - OCT 2026 & OCT 2026) ===")
    for bit, sname, scat in svc_defs:
        era_n = sum(1 for a in clean_accts if a["svc_m"] & bit)
        oct_n = sum(1 for a in clean_accts if a["oct_svc_m"] & bit)
        only_n = sum(1 for a in only_all if a["svc_m"] & bit)
        oth_n = sum(1 for a in oth_all if a["svc_m"] & bit)
        s4_n = sum(1 for a in s4_all if a["svc_m"] & bit)
        s1_n = sum(1 for a in s1_all if a["svc_m"] & bit)
        st_n = sum(1 for a in stayed_all if a["svc_m"] & bit)
        ch_n = sum(1 for a in churn_all if a["svc_m"] & bit)
        jt_n = sum(1 for a in just_all if a["svc_m"] & bit)
        r = {
            "service_name": sname,
            "service_category": scat,
            "era_accounts": era_n,
            "era_attach_pct_all_clean": round(100.0 * era_n / len(clean_accts), 2),
            "oct_2026_active_accounts": oct_n,
            "oct_2026_attach_pct_all_clean": round(100.0 * oct_n / len(clean_accts), 2),
            "only_mcp_accounts": only_n,
            "only_mcp_attach_pct": round(100.0 * only_n / len(only_all), 2),
            "mcp_plus_others_accounts": oth_n,
            "mcp_plus_others_attach_pct": round(100.0 * oth_n / len(oth_all), 2),
            "verified_mcp_deployer_s4_accounts": s4_n,
            "verified_mcp_deployer_s4_attach_pct": round(100.0 * s4_n / len(s4_all), 2) if s4_all else 0.0,
            "read_only_s1_accounts": s1_n,
            "read_only_s1_attach_pct": round(100.0 * s1_n / len(s1_all), 2) if s1_all else 0.0,
            "stayed_back_mcp_attach_pct": round(100.0 * st_n / len(stayed_all), 2) if stayed_all else 0.0,
            "churned_away_mcp_attach_pct": round(100.0 * ch_n / len(churn_all), 2) if churn_all else 0.0,
            "just_tried_mcp_attach_pct": round(100.0 * jt_n / len(just_all), 2) if just_all else 0.0,
        }
        svc_rows.append(r)
        print(
            f"  {sname:48s} | Era={era_n:6,d} ({r['era_attach_pct_all_clean']:5.2f}%) | Oct={oct_n:5,d} | "
            f"OnlyMCP={r['only_mcp_attach_pct']:5.2f}% vs +Oth={r['mcp_plus_others_attach_pct']:5.2f}% | "
            f"S4_Deployer={r['verified_mcp_deployer_s4_attach_pct']:5.2f}% vs S1_ReadOnly={r['read_only_s1_attach_pct']:5.2f}%"
        )

    # Also compute multi-product breadth (# distinct billed/active services)
    print("\n=== SERVICE BREADTH (AVG # SERVICES AMONG PAID ACCOUNTS) ===")
    for label, sub in [
        ("All Clean MCP", clean_accts),
        ("Only MCP", only_all),
        ("MCP + Others", oth_all),
        ("Stage 4 Verified MCP Deployer", s4_all),
        ("Stage 1 Read-Only Explorer", s1_all),
        ("Stayed Back (Oct Active)", stayed_all),
        ("Just Tried (1-2d pre-Oct)", just_all),
    ]:
        paid = [a for a in sub if a["era_b"] == 1]
        counts = [bin(a["svc_m"]).count("1") for a in paid]
        multi = sum(1 for c in counts if c >= 2)
        avg_c = sum(counts) / len(counts) if counts else 0.0
        print(f"  {label:32s} | EraPaid={len(paid):5,d} | AvgServices={avg_c:.2f} | 2+Services={multi:5,d} ({(100*multi/len(paid) if paid else 0):.1f}%)")

    write_csv_safe(OUT_DIR / "mcp_19k_individual_services.csv", list(svc_rows[0].keys()), svc_rows)
    print(f"\nWrote 7 zero-PII aggregate CSVs to {OUT_DIR}")


if __name__ == "__main__":
    main()
