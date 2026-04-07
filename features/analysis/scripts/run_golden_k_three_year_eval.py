# -*- coding: utf-8 -*-
"""
고정 휠별 k + 황금각 WHEEL_OFFSET_STEPS 로 직전 회차 본6(정렬)에서 번호를 뽑고,
최근 약 3년(기본 156회) 구간 등수를 집계한다. 기존 JL 생성기/설정 파일은 수정하지 않는다.

  python -m features.analysis.scripts.run_golden_k_three_year_eval
  python -m features.analysis.scripts.run_golden_k_three_year_eval --years 6
  python -m features.analysis.scripts.run_golden_k_three_year_eval --draw-count 312

1216→1217 역산으로 쓴 고정 k(정렬↔정렬 기준):
  [5, 38, 29, 26, 17, 11]
"""
from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True
_project_root = Path(__file__).resolve().parents[3]
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))
_backend_root = _project_root / "backend"
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from backend.database import get_connection
from features.analysis.domain.lotto_rank import rank_lotto_ticket
from features.analysis.api.jl_service.config import (
    WHEEL_OFFSET_STEPS,
    _MAX_STEPS,
    _MIN_STEPS,
)
from features.analysis.api.jl_service.physics import draw_six
from features.analysis.scripts.jl_wheel_batch_eval import (
    THREE_YEAR_DRAW_COUNT,
    fetch_latest_draw_nos_ascending,
)

# 주 1회 추첨 가정 시 연간 회차 수 (옵션 `--years` 용)
WEEKS_PER_YEAR = 52

# 1217 본6을 1216 정렬 본6 + (k,G) 모델로 맞출 때의 휠별 고정 k (0~44)
K_FIXED: list[int] = [5, 38, 29, 26, 17, 11]


def _configure_stdio_utf8() -> None:
    for stream in (sys.stdout, sys.stderr):
        reconf = getattr(stream, "reconfigure", None)
        if callable(reconf):
            try:
                reconf(encoding="utf-8", errors="replace")
            except (AttributeError, OSError, ValueError, TypeError):
                pass


def _steps_congruent_min_in_band(delta_mod45: int) -> int:
    d = int(delta_mod45) % 45
    q = math.ceil((_MIN_STEPS - d) / 45)
    steps = d + 45 * q
    if not (_MIN_STEPS <= steps <= _MAX_STEPS):
        raise RuntimeError(f"step 밴드 초과: d={d}, steps={steps}")
    return steps


def _wheel_steps_from_k(k: list[int]) -> list[int]:
    if len(k) != 6 or len(WHEEL_OFFSET_STEPS) != 6:
        raise ValueError("k·WHEEL_OFFSET_STEPS 길이는 6이어야 합니다.")
    return [
        _steps_congruent_min_in_band((k[i] + WHEEL_OFFSET_STEPS[i]) % 45)
        for i in range(6)
    ]


def _load_winners(draw_nos: set[int]) -> dict[int, tuple[set[int], int]]:
    if not draw_nos:
        return {}
    conn = get_connection()
    cur = conn.cursor()
    ph = ",".join("?" * len(draw_nos))
    cur.execute(
        f"""
        SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
        FROM lotto_winners
        WHERE draw_no IN ({ph})
        """,
        tuple(sorted(draw_nos)),
    )
    out: dict[int, tuple[set[int], int]] = {}
    for r in cur.fetchall():
        dn = int(r["draw_no"])
        main = {int(r["num1"]), int(r["num2"]), int(r["num3"]), int(r["num4"]), int(r["num5"]), int(r["num6"])}
        out[dn] = (main, int(r["bonus_num"] or 0))
    conn.close()
    return out


def run_eval(draw_count: int) -> dict[str, Any]:
    draw_nos = fetch_latest_draw_nos_ascending(draw_count)
    need_prev = {dn - 1 for dn in draw_nos}
    winners = _load_winners(set(draw_nos) | need_prev)
    ws = _wheel_steps_from_k(K_FIXED)

    counts: dict[int | str, int] = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, "miss": 0}
    match_hist: dict[int, int] = {i: 0 for i in range(7)}
    evaluated = 0
    first_draw: int | None = None
    last_draw: int | None = None

    for dn in draw_nos:
        prev = dn - 1
        if dn not in winners or prev not in winners:
            continue
        main, bonus = winners[dn]
        starts = sorted(winners[prev][0])
        if len(starts) != 6:
            continue
        ticket_list = draw_six(starts, 0, wheel_steps=ws)
        ticket = set(ticket_list)
        evaluated += 1
        if first_draw is None:
            first_draw = dn
        last_draw = dn
        mc = len(main & ticket)
        match_hist[mc] = match_hist.get(mc, 0) + 1
        rnk = rank_lotto_ticket(main, bonus, ticket)
        if rnk is None:
            counts["miss"] += 1
        else:
            counts[rnk] += 1

    return {
        "draw_count_requested": draw_count,
        "draw_nos_span": (first_draw, last_draw),
        "evaluated_rounds": evaluated,
        "k_fixed": list(K_FIXED),
        "wheel_offset_steps": list(WHEEL_OFFSET_STEPS),
        "rank_counts": counts,
        "match_distribution": match_hist,
    }


def main() -> None:
    _configure_stdio_utf8()
    p = argparse.ArgumentParser(description="고정 k + 황금각 최근 N회 등수 집계")
    p.add_argument(
        "--draw-count",
        type=int,
        default=None,
        metavar="N",
        help=f"최신부터 N회 직접 지정 (--years 와 동시 사용 불가)",
    )
    p.add_argument(
        "--years",
        type=int,
        default=None,
        metavar="Y",
        help=f"최근 Y년치(약 Y×{WEEKS_PER_YEAR}회, 주 1회 가정). 미지정 시 기본 {THREE_YEAR_DRAW_COUNT // WEEKS_PER_YEAR}년",
    )
    args = p.parse_args()
    if args.draw_count is not None and args.years is not None:
        p.error("--draw-count 와 --years 는 함께 쓸 수 없습니다.")
    if args.draw_count is not None:
        draw_count = int(args.draw_count)
    elif args.years is not None:
        draw_count = int(args.years) * WEEKS_PER_YEAR
    else:
        draw_count = THREE_YEAR_DRAW_COUNT
    r = run_eval(draw_count)

    print("=== 고정 k + 황금각 WHEEL_OFFSET_STEPS — 최근 구간 평가 ===")
    print(f"요청 회차 수: {r['draw_count_requested']}")
    print(f"실제 평가 회차 수: {r['evaluated_rounds']} (직전 회차 DB 있을 때만)")
    print(f"회차 범위(평가된 것): {r['draw_nos_span'][0]} ~ {r['draw_nos_span'][1]}")
    print(f"k (고정): {r['k_fixed']}")
    print(f"G (config): {r['wheel_offset_steps']}")
    print()
    c = r["rank_counts"]
    print("--- 등수별 횟수 (한 줄당 1회차 1장) ---")
    for tier in (1, 2, 3, 4, 5):
        print(f"  {tier}등: {c[tier]}회")
    print(f"  당첨 없음(3개 미만 등): {c['miss']}회")
    print()
    print("--- 본번호 일치 개수 분포 ---")
    for m in range(0, 7):
        print(f"  {m}개 일치: {r['match_distribution'][m]}회")


if __name__ == "__main__":
    main()
