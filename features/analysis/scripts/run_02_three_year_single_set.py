# -*- coding: utf-8 -*-
"""
2단계: 1번에서 확정한 6개 offset으로 최신 N회차(기본 52) 단일 세트를 평가한다.

- 각 목표 회차 T마다 직전 회차(T-1) 1등 번호(DB 순서)에 같은 offset을 적용한다.
- 매 회차마다 누적 집계는 1~(T-1)로 다시 계산한다.
- 추천번호에 누적 상위 번호가 포함되면 누적 하위 번호로 교체한다.
- 기존 파일에 표가 있으면 해당 세트 행만 갱신하고 다른 세트 행은 유지한다.

사용 (프로젝트 루트):
  python -m features.analysis.scripts.run_02_three_year_single_set --pick-json pick.json
  python -m features.analysis.scripts.run_02_three_year_single_set --set-index 1 --offset-steps 1 3 4 6 7 9 --current-draw 1218
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

from backend.database import get_connection
from features.analysis.domain.lotto_rank import rank_lotto_ticket
from features.analysis.scripts.run_00_cumulative_winners import build_payload


def _configure_stdio_utf8() -> None:
    for stream in (sys.stdout, sys.stderr):
        reconf = getattr(stream, "reconfigure", None)
        if callable(reconf):
            try:
                reconf(encoding="utf-8", errors="replace")
            except (AttributeError, OSError, ValueError, TypeError):
                pass


DEFAULT_DRAW_COUNT = 52
_HIT_CELL_RE = re.compile(r"(\d+)\(([1-5])등\)")


def _load_pick(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    required_ko = ("현재회차", "세트번호", "오프셋칸수")
    required_en = ("current_draw", "set_index", "offset_steps")
    if all(k in data for k in required_ko):
        return data
    if all(k in data for k in required_en):
        return data
    raise ValueError("pick JSON에 필수 필드가 없습니다. (한글: 현재회차/세트번호/오프셋칸수)")
    return data


def _add_step(num: int, step: int) -> int:
    return ((num - 1 + step) % 45) + 1


def _apply_offsets(base_numbers: list[int], offset_steps: list[int]) -> list[int]:
    return [_add_step(n, s) for n, s in zip(base_numbers, offset_steps)]


def _replace_hot_with_cold(
    picked_numbers: list[int],
    hot_numbers: list[int],
    cold_numbers: list[int],
) -> list[int]:
    out = list(picked_numbers)
    hot_set = set(hot_numbers)
    for idx, n in enumerate(out):
        if n not in hot_set:
            continue
        candidate = next((x for x in cold_numbers if x not in out), None)
        if candidate is not None:
            out[idx] = candidate

    seen: set[int] = set()
    for idx, n in enumerate(out):
        if n not in seen:
            seen.add(n)
            continue
        candidate = next((x for x in cold_numbers if x not in seen), None)
        if candidate is None:
            candidate = next((x for x in range(1, 46) if x not in seen), n)
        out[idx] = candidate
        seen.add(candidate)
    return out


def _fetch_winner_ordered(draw_no: int) -> tuple[list[int], int] | None:
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT num1, num2, num3, num4, num5, num6, bonus_num
            FROM lotto_winners
            WHERE draw_no = ?
            """,
            (draw_no,),
        )
        row = cur.fetchone()
    if row is None:
        return None
    main = [int(row["num1"]), int(row["num2"]), int(row["num3"]), int(row["num4"]), int(row["num5"]), int(row["num6"])]
    bonus = int(row["bonus_num"] or 0)
    return main, bonus


def _fetch_latest_draw_nos_ascending(count: int) -> tuple[int, ...]:
    if count < 1:
        raise ValueError("count는 1 이상이어야 합니다.")
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT draw_no
            FROM lotto_winners
            ORDER BY draw_no DESC
            LIMIT ?
            """,
            (count,),
        )
        rows = cur.fetchall()
    nos = [int(r["draw_no"]) for r in rows]
    nos.reverse()
    return tuple(nos)


def _parse_dangcheom_history_table(md: str) -> tuple[str, dict[int, str]] | None:
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
        if len(parts) < 3 or not parts[0].isdigit():
            break
        rows[int(parts[0])] = raw.rstrip()
        j += 1
    return before, rows


def _aggregate_rows(merged_rows: dict[int, str]) -> tuple[int, dict[int, int]]:
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
            tier = int(m.group(2))
            if tier in tier_counts:
                tier_counts[tier] += 1
    return len(distinct_draws), tier_counts


def _upsert_summary(before_table: str, distinct_draw_count: int, tier_counts: dict[int, int]) -> str:
    summary_lines = [
        "### 전체 누적 (아래 표 20세트 합산)",
        "",
        f"- **당첨이 한 번이라도 찍힌 서로 다른 회차 수**: {int(distinct_draw_count)}회차",
        f"- 1등 : {int(tier_counts.get(1, 0))}번",
        f"- 2등 : {int(tier_counts.get(2, 0))}번",
        f"- 3등 : {int(tier_counts.get(3, 0))}번",
        f"- 4등 : {int(tier_counts.get(4, 0))}번",
        f"- 5등 : {int(tier_counts.get(5, 0))}번",
    ]
    summary_section = "\n".join(summary_lines)
    lines = before_table.splitlines()
    for i, line in enumerate(lines):
        if line.strip().startswith("### 전체 누적"):
            j = i + 1
            while j < len(lines) and (not lines[j].strip() or lines[j].lstrip().startswith("-")):
                j += 1
            return "\n".join(lines[:i] + summary_section.splitlines() + lines[j:]).rstrip()
    if before_table.strip():
        return (before_table.rstrip() + "\n\n" + summary_section).rstrip()
    return summary_section


def _build_merged_markdown(existing: str | None, row_line: str, set_index: int) -> str:
    if existing and existing.strip():
        parsed_old = _parse_dangcheom_history_table(existing)
    else:
        parsed_old = None

    if parsed_old is None:
        before = "## 2. 오프셋 프로파일(세트#)별 당첨 이력"
        rows = {set_index: row_line}
    else:
        before, rows = parsed_old
        rows[set_index] = row_line

    distinct, tier_counts = _aggregate_rows(rows)
    before_with_summary = _upsert_summary(before, distinct, tier_counts)
    out_lines = [
        before_with_summary.rstrip(),
        "",
        "| 세트# | offset | 회차(등수) | 1등기준회차 |",
        "|-------|--------|------------|-------------|",
    ]
    for idx in sorted(rows):
        out_lines.append(rows[idx])
    out_lines.append("")
    return "\n".join(out_lines)


def main() -> None:
    _configure_stdio_utf8()
    parser = argparse.ArgumentParser(
        description="단일 세트 최신 52회차 평가 → 당첨 이력.md",
    )
    parser.add_argument("--pick-json", type=str, default=None, metavar="PATH", help="1번 산출 JSON")
    parser.add_argument("--set-index", type=int, default=None)
    parser.add_argument("--offset-steps", type=int, nargs=6, default=None, metavar="K", help="6개 칸수")
    parser.add_argument("--current-draw", type=int, default=None, help="1등기준회차 C (pick 없을 때 필수)")
    parser.add_argument(
        "--draw-count",
        type=int,
        default=DEFAULT_DRAW_COUNT,
        metavar="N",
        help=f"평가할 최신 회차 개수 (기본 {DEFAULT_DRAW_COUNT})",
    )
    parser.add_argument(
        "--write-history",
        type=str,
        default="features/analysis/scripts/당첨 이력.md",
        metavar="PATH",
        help="당첨 이력 Markdown 경로",
    )
    args = parser.parse_args()

    if args.pick_json:
        pick = _load_pick(Path(args.pick_json))
        c = int(pick.get("현재회차", pick.get("current_draw")))
        s = int(pick.get("세트번호", pick.get("set_index")))
        raw_steps = pick.get("오프셋칸수", pick.get("offset_steps"))
        if raw_steps is None:
            print("오류: pick JSON에 오프셋칸수(또는 offset_steps)가 없습니다.", file=sys.stderr)
            sys.exit(2)
        offset_steps = [int(x) for x in raw_steps]
    else:
        if args.set_index is None or args.offset_steps is None or args.current_draw is None:
            print(
                "오류: --pick-json 이 없으면 --set-index, --offset-steps 6개, --current-draw 가 필요합니다.",
                file=sys.stderr,
            )
            sys.exit(2)
        s = int(args.set_index)
        offset_steps = [int(x) % 45 for x in args.offset_steps]
        c = int(args.current_draw)

    if not 1 <= s <= 20:
        print("오류: 세트 인덱스는 1~20.", file=sys.stderr)
        sys.exit(2)
    if len(offset_steps) != 6:
        print("오류: offset-steps 는 6개여야 합니다.", file=sys.stderr)
        sys.exit(2)

    want = max(1, int(args.draw_count))
    draw_nos = _fetch_latest_draw_nos_ascending(want)
    if len(draw_nos) < want:
        print(
            f"경고: 요청 {want}회차 대비 DB에 {len(draw_nos)}회차만 있어 구간이 짧습니다.",
            file=sys.stderr,
        )

    hit_cells: list[str] = []
    evaluated = 0
    for target_draw in draw_nos:
        prev_draw = int(target_draw) - 1
        prev_winner = _fetch_winner_ordered(prev_draw)
        target_winner = _fetch_winner_ordered(int(target_draw))
        if prev_winner is None or target_winner is None:
            continue
        prev_main, _ = prev_winner
        target_main, target_bonus = target_winner

        recommended = _apply_offsets(prev_main, offset_steps)
        cumulative = build_payload(prev_draw, top_n=5, bottom_n=5)
        recommended = _replace_hot_with_cold(
            recommended,
            hot_numbers=[int(x) for x in cumulative["top_numbers"]],
            cold_numbers=[int(x) for x in cumulative["bottom_numbers"]],
        )
        rank = rank_lotto_ticket(set(target_main), target_bonus, set(recommended))
        evaluated += 1
        # 기준회차(C)에서의 1등 재현은 설계상 당연하므로 이력 표에서는 제외한다.
        if rank is not None and int(target_draw) != int(c):
            hit_cells.append(f"{target_draw}({rank}등)")

    hit_cell = ", ".join(hit_cells) if hit_cells else "-"
    offset_text = ",".join(str(int(x)) for x in offset_steps)
    row_line = f"| {s} | {offset_text} | {hit_cell} | {int(c)} |"

    out = Path(args.write_history)
    existing = out.read_text(encoding="utf-8") if out.is_file() else None
    md = _build_merged_markdown(existing, row_line=row_line, set_index=s)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(md, encoding="utf-8")
    print(f"평가 회차 수: {evaluated}")
    print(f"당첨 이력 저장: {out.resolve()}")


if __name__ == "__main__":
    main()
