# -*- coding: utf-8 -*-
"""
JL 휠 배치 평가·당첨 이력 포맷 (가변 회차 길이, 단일 세트 모드).

레거시 ``run_wheel_52.evaluate_wheel_52``에서 워크플로에 필요한 부분만 이전했다.
"""
from __future__ import annotations

import ast
import math
import re
from pathlib import Path
from typing import Any

from features.analysis.api.jl_service import TWENTY_BASE_OFFSETS, generate_jl_ticket_for_draw_and_set
from backend.database import get_connection
from backend.domain.services.lotto_rank import rank_lotto_ticket

DEFAULT_WHEEL_DRAW_COUNT = 52
THREE_YEAR_DRAW_COUNT = 156

DEFAULT_RANK_WEIGHTS: dict[int, int] = {
    1: 10**12,
    2: 10**9,
    3: 10**6,
    4: 10**3,
    5: 1,
}

_project_root = Path(__file__).resolve().parents[3]
JL_SERVICE_FILE = _project_root / "features" / "analysis" / "api" / "jl_service" / "config.py"


def _format_float_list(values: list[float]) -> str:
    body = "\n".join(f"    {float(v)!r}," for v in values)
    return "[\n" + body + "\n]"


def _format_int_list(values: list[int], *, per_line: int = 10) -> str:
    rows: list[str] = []
    for i in range(0, len(values), per_line):
        chunk = values[i : i + per_line]
        rows.append("    " + ", ".join(str(int(x)) for x in chunk) + ",")
    return "[\n" + "\n".join(rows) + "\n]"


def _replace_typed_list_literal(src: str, var_name: str, new_list_literal: str) -> tuple[str, bool]:
    pattern = re.compile(
        rf"({re.escape(var_name)}\s*:\s*List\[[^\]]+\]\s*=\s*)(\[[\s\S]*?\])",
        re.MULTILINE,
    )
    updated, n = pattern.subn(r"\1" + new_list_literal, src, count=1)
    return updated, n == 1


def persist_offset_speed_update(set_index_1based: int, new_offset: int, new_speed: float) -> None:
    """``config.py``의 ``_JITTER_BASE_SPEEDS``·``TWENTY_BASE_OFFSETS``에서 해당 세트만 갱신."""
    if not JL_SERVICE_FILE.exists():
        raise FileNotFoundError(f"config.py를 찾을 수 없습니다: {JL_SERVICE_FILE}")

    src = JL_SERVICE_FILE.read_text(encoding="utf-8")

    m_speed = re.search(
        r"_JITTER_BASE_SPEEDS\s*:\s*List\[[^\]]+\]\s*=\s*(\[[\s\S]*?\])",
        src,
        re.MULTILINE,
    )
    m_offset = re.search(
        r"TWENTY_BASE_OFFSETS\s*:\s*List\[[^\]]+\]\s*=\s*(\[[\s\S]*?\])",
        src,
        re.MULTILINE,
    )
    if not m_speed or not m_offset:
        raise ValueError("config.py에서 기준 리스트를 찾지 못했습니다.")

    speeds = list(ast.literal_eval(m_speed.group(1)))
    offsets = list(ast.literal_eval(m_offset.group(1)))
    idx = int(set_index_1based) - 1
    if not (0 <= idx < len(speeds) and 0 <= idx < len(offsets)):
        raise IndexError(f"세트 인덱스 범위 오류: {set_index_1based}")

    speeds[idx] = float(new_speed)
    offsets[idx] = int(new_offset) % 45

    src2, ok1 = _replace_typed_list_literal(src, "_JITTER_BASE_SPEEDS", _format_float_list(speeds))
    if not ok1:
        raise ValueError("_JITTER_BASE_SPEEDS 치환 실패")
    src3, ok2 = _replace_typed_list_literal(src2, "TWENTY_BASE_OFFSETS", _format_int_list(offsets))
    if not ok2:
        raise ValueError("TWENTY_BASE_OFFSETS 치환 실패")

    if src3 != src:
        JL_SERVICE_FILE.write_text(src3, encoding="utf-8")


def fetch_latest_draw_nos_ascending(count: int) -> tuple[int, ...]:
    """
    ``lotto_winners`` 기준 최신 회차부터 최대 ``count``개(오름차순).

    DB에 ``count``개 미만이면 있는 만큼만 반환(호출측에서 3년 미만 경고).
    0개면 ``ValueError``.
    """
    if count < 1:
        raise ValueError("count는 1 이상이어야 합니다.")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT draw_no FROM lotto_winners
        ORDER BY draw_no DESC
        LIMIT ?
        """,
        (count,),
    )
    rows = cur.fetchall()
    conn.close()
    if not rows:
        raise ValueError("DB에 당첨 회차가 없습니다.")
    nos = [int(r["draw_no"]) for r in rows]
    nos.reverse()
    return tuple(nos)


def count_total_draws_in_db() -> int:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) AS c FROM lotto_winners")
    row = cur.fetchone()
    conn.close()
    return int(row["c"])


def _ticket_row_to_set(row: dict[str, Any]) -> set[int]:
    return {
        int(row["num1"]),
        int(row["num2"]),
        int(row["num3"]),
        int(row["num4"]),
        int(row["num5"]),
        int(row["num6"]),
    }


def _fmt_nums(s: set[int]) -> str:
    return ",".join(str(x) for x in sorted(s))


def _theoretical_single_ticket_probs() -> dict[int, float]:
    total = math.comb(45, 6)
    counts = {
        1: 1,
        2: 6,
        3: 6 * 38,
        4: math.comb(6, 4) * math.comb(39, 2),
        5: math.comb(6, 3) * math.comb(39, 3),
    }
    return {t: counts[t] / total for t in (1, 2, 3, 4, 5)}


def _per_set_hit_counts(hits: list[tuple[int, int]]) -> dict[int, int]:
    c = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for _, r in hits:
        if r in c:
            c[r] += 1
    return c


def single_ticket_fallback_score(
    main: set[int],
    bonus: int,
    ticket: set[int],
    *,
    rank_weights: dict[int, int] | None = None,
) -> tuple[int, int]:
    """
    ``C`` 단일 회차 보조 점수. 반환: (가중치 합, 본번호 매치 수).
    등수가 없으면 가중치 0, 매치 수만 사용.
    """
    weights = rank_weights or DEFAULT_RANK_WEIGHTS
    rnk = rank_lotto_ticket(main, bonus, ticket)
    matched = len(main & ticket)
    w = int(weights.get(rnk, 0)) if rnk is not None else 0
    return w, matched


def evaluate_jl_wheel_single_set(
    draw_nos: tuple[int, ...],
    *,
    set_index: int,
    offset: int,
    start_permutation: tuple[int, ...],
) -> dict[str, Any]:
    """
    각 회차마다 세트 ``set_index`` 한 줄만 생성·당첨 비교.

    ``draw_nos`` 길이는 1 이상.
    """
    if len(draw_nos) < 1:
        raise ValueError("draw_nos 길이는 1 이상이어야 합니다.")
    if not 1 <= set_index <= 20:
        raise ValueError("set_index는 1~20이어야 합니다.")

    conn = get_connection()
    cursor = conn.cursor()
    ph = ",".join("?" * len(draw_nos))
    cursor.execute(
        f"""
        SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
        FROM lotto_winners
        WHERE draw_no IN ({ph})
        ORDER BY draw_no
        """,
        draw_nos,
    )
    winners: dict[int, tuple[set[int], int]] = {}
    for r in cursor.fetchall():
        dn = int(r["draw_no"])
        main = {r["num1"], r["num2"], r["num3"], r["num4"], r["num5"], r["num6"]}
        winners[dn] = (main, int(r["bonus_num"] or 0))
    conn.close()

    ticket_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    match_distribution_total: dict[int, int] = {k: 0 for k in range(0, 7)}
    total_tickets = 0
    per_draw: dict[int, dict[int, int]] = {}
    hit_draws: list[tuple[int, int]] = []
    hit_rows: list[dict[str, Any]] = []
    by_set_index: dict[int, list[tuple[int, int]]] = {i: [] for i in range(1, 21)}
    top6_by_draw: dict[int, list[int]] = {}
    off = int(offset) % 45

    for dn in draw_nos:
        if dn not in winners:
            continue
        main, bonus = winners[dn]
        row = generate_jl_ticket_for_draw_and_set(
            dn,
            set_index=set_index,
            offset=off,
            start_permutation=start_permutation,
        )
        t0 = row.get("top6_starts")
        if isinstance(t0, list):
            top6_by_draw[dn] = [int(x) for x in t0]

        total_tickets += 1
        s = _ticket_row_to_set(row)
        match_count = len(main.intersection(s))
        rnk = rank_lotto_ticket(main, bonus, s)
        match_distribution_total[match_count] += 1

        dc = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        best: int | None = None
        if rnk is not None:
            ticket_counts[rnk] += 1
            dc[rnk] += 1
            best = rnk
            hit_rows.append(
                {
                    "draw_no": dn,
                    "set_index": set_index,
                    "offset": off,
                    "rank": rnk,
                    "picked": _fmt_nums(s),
                    "winning": _fmt_nums(main),
                    "bonus": bonus,
                }
            )
            by_set_index[set_index].append((dn, rnk))
        per_draw[dn] = dc
        if best is not None:
            hit_draws.append((dn, best))

    draws_per_tier = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for dn, dc in per_draw.items():
        for t in (1, 2, 3, 4, 5):
            if dc[t] > 0:
                draws_per_tier[t] += 1

    theo = _theoretical_single_ticket_probs()
    expected = {t: theo[t] * total_tickets for t in (1, 2, 3, 4, 5)}
    avg_match = (
        sum(match * cnt for match, cnt in match_distribution_total.items()) / total_tickets
        if total_tickets > 0
        else 0.0
    )
    up_to = max(draw_nos)

    return {
        "draw_nos": draw_nos,
        "num_draws": len(per_draw),
        "num_sets_per_draw": 1,
        "single_set_index": set_index,
        "single_offset": off,
        "start_permutation": tuple(start_permutation),
        "total_tickets": total_tickets,
        "ticket_counts": ticket_counts,
        "per_draw": per_draw,
        "hit_draws": hit_draws,
        "draws_per_tier": draws_per_tier,
        "theoretical_per_ticket": theo,
        "expected_counts": expected,
        "match_distribution_total": match_distribution_total,
        "avg_match": avg_match,
        "total_combos": math.comb(45, 6),
        "hit_rows": hit_rows,
        "by_set_index": by_set_index,
        "top6_by_draw": top6_by_draw,
        "eval_max_draw_no": up_to,
        "nominal_base_offsets": [int(x) % 45 for x in TWENTY_BASE_OFFSETS],
    }


_HIT_CELL_RE = re.compile(r"(\d+)\(([1-5])등\)")


def aggregate_dangcheom_merged_rows(merged_rows: dict[int, str]) -> tuple[int, dict[int, int]]:
    """
    표 데이터 행(세트# → 마크다운 한 줄)에서 20세트 합산 통계를 계산한다.

    반환: (당첨이 한 번이라도 찍힌 서로 다른 회차 수, 등수별 당첨 건수 합)
    """
    distinct_draws: set[int] = set()
    tier_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for raw in merged_rows.values():
        parts = [p.strip() for p in raw.strip().strip("|").split("|")]
        if len(parts) < 3:
            continue
        cell = parts[2]
        if cell in ("-", ""):
            continue
        for m in _HIT_CELL_RE.finditer(cell):
            distinct_draws.add(int(m.group(1)))
            t = int(m.group(2))
            if t in tier_counts:
                tier_counts[t] += 1
    return len(distinct_draws), tier_counts


def format_dangcheom_global_summary_section(
    distinct_draw_count: int, tier_counts: dict[int, int]
) -> str:
    """``### 전체 누적`` 블록(헤더 + 불릿)."""
    lines = [
        "### 전체 누적 (아래 표 20세트 합산)",
        "",
        f"- **당첨이 한 번이라도 찍힌 서로 다른 회차 수**: {int(distinct_draw_count)}회차",
    ]
    for t in (1, 2, 3, 4, 5):
        lines.append(f"- {t}등 : {int(tier_counts.get(t, 0))}번")
    return "\n".join(lines)


def upsert_dangcheom_global_summary(before_table: str, summary_section: str) -> str:
    """
    ``before_table`` 표 앞 본문에 ``### 전체 누적`` 구간을 넣거나 치환한다.
    ``## 2.`` 만 있으면 그 아래에 삽입한다.
    """
    lines = before_table.splitlines()
    for i, line in enumerate(lines):
        if line.strip().startswith("### 전체 누적"):
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            while j < len(lines) and lines[j].lstrip().startswith("-"):
                j += 1
            merged = lines[:i] + summary_section.splitlines() + lines[j:]
            return "\n".join(merged).rstrip()
    for i, line in enumerate(lines):
        if line.strip().startswith("## 2."):
            insert_at = i + 1
            while insert_at < len(lines) and not lines[insert_at].strip():
                insert_at += 1
            chunk = [""] + summary_section.splitlines() + [""]
            merged = lines[:insert_at] + chunk + lines[insert_at:]
            return "\n".join(merged).rstrip()
    return (summary_section + "\n\n" + before_table).rstrip()


def _history_table_data_line(
    result: dict[str, Any],
    *,
    rank1_reference_draw: int,
) -> tuple[int, str]:
    """단일 세트 1행(표 데이터 줄 + 세트 인덱스)."""
    si = int(result["single_set_index"])
    off = int(result["single_offset"])
    by_si: dict[int, list[tuple[int, int]]] = result["by_set_index"]
    hits = by_si.get(si, [])
    if not hits:
        cell = "-"
    else:
        parts = [f"{dn}({rnk}등)" for dn, rnk in hits]
        cell = ", ".join(parts)
    line = f"| {si} | {off} | {cell} | {int(rank1_reference_draw)} |"
    return si, line


def parse_dangcheom_history_table(md: str) -> tuple[str, dict[int, str]] | None:
    """
    ``당첨 이력.md`` 에서 표 앞 본문과 ``세트#`` 열 기준 데이터 행을 분리한다.

    표 헤더( ``| 세트# | offset | ...`` )가 없으면 None — 호출부에서 전체를 새로 쓴다.
    """
    lines = md.splitlines()
    table_start: int | None = None
    for i, line in enumerate(lines):
        s = line.strip()
        if s.startswith("|") and "세트#" in s and "offset" in s and "회차" in s:
            table_start = i
            break
    if table_start is None:
        return None
    before = "\n".join(lines[:table_start]).rstrip()
    rows: dict[int, str] = {}
    j = table_start + 1
    if j < len(lines) and "---" in lines[j].replace(" ", ""):
        j += 1
    while j < len(lines):
        raw = lines[j]
        if not raw.strip().startswith("|"):
            break
        parts = [p.strip() for p in raw.strip().strip("|").split("|")]
        # 1등기준회차 열이 비어 있으면 split 결과가 3열이라 기존에는 여기서 중단되어 세트 2~가 사라짐
        if len(parts) < 3 or not parts[0].isdigit():
            break
        rows[int(parts[0])] = raw.rstrip()
        j += 1
    return before, rows


def _concat_dangcheom_history_table(body_md: str, merged_rows: dict[int, str]) -> str:
    """표 앞 본문 + 4열 표."""
    out_lines = [
        body_md.rstrip(),
        "",
        "| 세트# | offset | 회차(등수) | 1등기준회차 |",
        "|-------|--------|------------|-------------|",
    ]
    for idx in sorted(merged_rows):
        out_lines.append(merged_rows[idx])
    out_lines.append("")
    return "\n".join(out_lines)


def merge_dangcheom_history_markdown(
    existing: str | None,
    *,
    result: dict[str, Any],
    rank1_reference_draw: int,
) -> str:
    """
    기존 ``당첨 이력.md`` 가 있으면 **4열 표만 세트별 병합**하고,
    ``### 전체 누적`` 블록은 **표 내용 기준으로 다시 계산**해 갱신한다.

    표를 찾지 못하면 ``format_history_single_set`` 기반으로 새 파일에 요약·표를 쓴다(구형·깨진 파일 호환).
    """
    new_full = format_history_single_set(
        result,
        rank1_reference_draw=rank1_reference_draw,
    )
    parsed_new = parse_dangcheom_history_table(new_full)
    if parsed_new is None:
        return new_full
    before_new_stub, new_rows = parsed_new

    if not existing or not existing.strip():
        distinct, tiers = aggregate_dangcheom_merged_rows(new_rows)
        summary = format_dangcheom_global_summary_section(distinct, tiers)
        body = upsert_dangcheom_global_summary(before_new_stub, summary)
        return _concat_dangcheom_history_table(body, new_rows)

    parsed_old = parse_dangcheom_history_table(existing)
    if parsed_old is None:
        distinct, tiers = aggregate_dangcheom_merged_rows(new_rows)
        summary = format_dangcheom_global_summary_section(distinct, tiers)
        body = upsert_dangcheom_global_summary(before_new_stub, summary)
        return _concat_dangcheom_history_table(body, new_rows)

    before_old, old_rows = parsed_old
    merged_rows = {**old_rows, **new_rows}

    distinct, tiers = aggregate_dangcheom_merged_rows(merged_rows)
    summary = format_dangcheom_global_summary_section(distinct, tiers)
    body = upsert_dangcheom_global_summary(before_old, summary)
    return _concat_dangcheom_history_table(body, merged_rows)


def format_history_single_set(
    result: dict[str, Any],
    *,
    rank1_reference_draw: int,
    seed: int | None = None,
) -> str:
    """
    단일 세트 당첨 이력 Markdown(섹션 제목 + 4열 표만).

    표 4열: 세트#, offset, 회차(등수), 1등기준회차(항상 ``rank1_reference_draw`` = pick의 ``current_draw``).
    """
    lines: list[str] = []
    lines.append("## 2. 오프셋 프로파일(세트#)별 당첨 이력")
    lines.append("")
    lines.append("| 세트# | offset | 회차(등수) | 1등기준회차 |")
    lines.append("|-------|--------|------------|-------------|")
    _, data_line = _history_table_data_line(result, rank1_reference_draw=rank1_reference_draw)
    lines.append(data_line)
    lines.append("")
    _ = seed
    return "\n".join(lines)
