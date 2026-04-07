# -*- coding: utf-8 -*-
"""
1단계: 직전 회차(P)와 현재 회차(C)의 1등 번호를 같은 순서로 비교해 6개 offset을 계산한다.

- 시작번호 조합(순열) 탐색을 사용하지 않는다.
- 황금비/WHEEL_OFFSET_STEPS 기반 계산을 사용하지 않는다.
- 시작번호는 DB 컬럼 순서(num1~num6) 그대로 사용한다.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
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


def _fetch_winner_ordered(draw_no: int) -> tuple[list[int], int]:
    """특정 회차의 본번호 6개(DB 순서)와 보너스를 반환한다."""
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
        raise ValueError(f"회차 {draw_no} 데이터가 없습니다.")
    main_ordered = [int(row["num1"]), int(row["num2"]), int(row["num3"]), int(row["num4"]), int(row["num5"]), int(row["num6"])]
    bonus = int(row["bonus_num"] or 0)
    return main_ordered, bonus


def _step_forward(from_num: int, to_num: int) -> int:
    """1~45 원형에서 from_num -> to_num 전진 칸수(0~44)."""
    return (to_num - from_num) % 45


def _add_step(num: int, step: int) -> int:
    """1~45 원형에서 step만큼 전진."""
    return ((num - 1 + step) % 45) + 1


def _apply_offsets(base_numbers: list[int], offset_steps: list[int]) -> list[int]:
    return [_add_step(n, s) for n, s in zip(base_numbers, offset_steps)]


def _replace_hot_with_cold(
    picked_numbers: list[int],
    hot_numbers: list[int],
    cold_numbers: list[int],
) -> tuple[list[int], list[dict[str, int]]]:
    """추천번호에 hot 번호가 있으면 cold 번호로 치환한다."""
    out = list(picked_numbers)
    replacements: list[dict[str, int]] = []
    hot_set = set(hot_numbers)

    for idx, n in enumerate(out):
        if n not in hot_set:
            continue
        candidate = next((x for x in cold_numbers if x not in out), None)
        if candidate is None:
            continue
        out[idx] = candidate
        replacements.append({"index": idx, "from": n, "to": candidate})

    # 치환 후 중복이 생긴 경우를 보정한다.
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

    return out, replacements


def main() -> None:
    _configure_stdio_utf8()
    parser = argparse.ArgumentParser(description="1등 기준 6개 offset 계산 및 추천번호 생성")
    parser.add_argument("--prev-draw", type=int, required=True, metavar="P", help="직전 회차")
    parser.add_argument("--current-draw", type=int, required=True, metavar="C", help="현재 회차")
    parser.add_argument("--set-index", type=int, required=True, metavar="S", help="세트 번호(기록용)")
    parser.add_argument("--write-pick", type=str, default=None, metavar="PATH", help="pick JSON 저장 경로")
    parser.add_argument(
        "--cumulative-up-to-draw",
        type=int,
        default=None,
        metavar="N",
        help="누적 집계 마지막 회차(기본: current_draw)",
    )
    args = parser.parse_args()

    p = int(args.prev_draw)
    c = int(args.current_draw)
    s = int(args.set_index)
    if not 1 <= s <= 20:
        print("오류: --set-index 는 1~20 이어야 합니다.", file=sys.stderr)
        sys.exit(2)

    try:
        prev_main, prev_bonus = _fetch_winner_ordered(p)
        curr_main, curr_bonus = _fetch_winner_ordered(c)
    except ValueError as exc:
        print(f"오류: {exc}", file=sys.stderr)
        sys.exit(2)

    offset_steps = [_step_forward(a, b) for a, b in zip(prev_main, curr_main)]
    predicted_curr = _apply_offsets(prev_main, offset_steps)
    rank1_achieved = set(predicted_curr) == set(curr_main)

    recommended_raw = _apply_offsets(curr_main, offset_steps)
    cumulative_upto = int(args.cumulative_up_to_draw) if args.cumulative_up_to_draw is not None else c
    cumulative = build_payload(cumulative_upto, top_n=5, bottom_n=5)
    recommended_final, replacements = _replace_hot_with_cold(
        recommended_raw,
        hot_numbers=[int(x) for x in cumulative["top_numbers"]],
        cold_numbers=[int(x) for x in cumulative["bottom_numbers"]],
    )

    payload: dict[str, Any] = {
        "이전회차": p,
        "현재회차": c,
        "세트번호": s,
        "오프셋칸수": [int(x) for x in offset_steps],
        "이전회차당첨번호_db순서": prev_main,
        "현재회차당첨번호_db순서": curr_main,
        "추천번호_치환전": recommended_raw,
        "추천번호": recommended_final,
        "누적기준회차": cumulative_upto,
        "누적상위번호": cumulative["top_numbers"],
        "누적하위번호": cumulative["bottom_numbers"],
        "치환내역": replacements,
        "1등재현성공": bool(rank1_achieved),
        "이전보너스번호": prev_bonus,
        "현재보너스번호": curr_bonus,
        "선정시각_UTC": datetime.now(timezone.utc).isoformat(),
    }

    # 참고용 등수(치환 전/후): 치환 전 번호가 중복이면 등수 계산을 건너뛴다.
    raw_ticket = set(recommended_raw)
    payload["추천번호_치환전_중복여부"] = len(raw_ticket) != 6
    payload["현재회차등수_치환전"] = (
        rank_lotto_ticket(set(curr_main), curr_bonus, raw_ticket)
        if len(raw_ticket) == 6
        else None
    )
    payload["현재회차등수_치환후"] = rank_lotto_ticket(set(curr_main), curr_bonus, set(recommended_final))

    if args.write_pick:
        out = Path(args.write_pick)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"pick 저장: {out.resolve()}", file=sys.stderr)

    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
