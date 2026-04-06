# -*- coding: utf-8 -*-
"""
1단계: 직전 회차 ``P`` 본6(정렬)+보너스 7개 풀에서 6휠에 넣는 배치 ``P(7,6)=5040`` 과
``offset`` 0~44 를 탐색해 ``C``에서 1등을 찾는다. 없으면 ``C`` 단일 회차 보조 점수로 폴백 후 pick JSON.

사용 (프로젝트 루트):
  python -m features.analysis.scripts.run_01_pick_offset_start --prev-draw 1217 --current-draw 1218 --set-index 1 --write-pick pick.json
"""
from __future__ import annotations

import argparse
import itertools
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True
_project_root = Path(__file__).resolve().parents[3]
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

_backend_root = _project_root / "backend"
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from features.analysis.api.jl_service import generate_jl_ticket_for_draw_and_set
from features.analysis.api.jl_service.start_numbers import _fetch_winner_for_draw
from backend.domain.services.lotto_rank import rank_lotto_ticket

from features.analysis.scripts.jl_wheel_batch_eval import (
    count_total_draws_in_db,
    single_ticket_fallback_score,
)


def _configure_stdio_utf8() -> None:
    for stream in (sys.stdout, sys.stderr):
        reconf = getattr(stream, "reconfigure", None)
        if callable(reconf):
            try:
                reconf(encoding="utf-8", errors="replace")
            except (AttributeError, OSError, ValueError, TypeError):
                pass


def _winner_summary(draw_no: int) -> str:
    w = _fetch_winner_for_draw(draw_no)
    if w is None:
        return "(없음)"
    main, bonus = w
    nums = ",".join(str(x) for x in sorted(main))
    return f"본6=[{nums}] 보너스={bonus}"


def _fallback_pick_best(
    candidates: list[tuple[int, int, int, tuple[int, ...]]],
) -> tuple[int, tuple[int, ...]]:
    """
    ``candidates``: (w, matched, offset, perm) 목록.
    타이브레이크: (1) 가중치·매치 동일 시 (2) offset 오름차순 (3) 순열 튜플 오름차순.
    """
    if not candidates:
        raise ValueError("fallback 후보가 비었습니다.")
    best_w, best_m = max((c[0], c[1]) for c in candidates)
    pool = [c for c in candidates if c[0] == best_w and c[1] == best_m]
    pool.sort(key=lambda c: (c[2], c[3]))
    _, _, o, perm = pool[0]
    return o, perm


def main() -> None:
    _configure_stdio_utf8()
    parser = argparse.ArgumentParser(
        description="1등 offset·시작순열 선정 (P→시작, C에서만 1등 판정)",
    )
    parser.add_argument("--prev-draw", type=int, required=True, metavar="P", help="직전 회차")
    parser.add_argument("--current-draw", type=int, required=True, metavar="C", help="1등을 맞출 대상 회차")
    parser.add_argument("--set-index", type=int, required=True, metavar="S", help="세트 번호 1~20")
    parser.add_argument(
        "--write-pick",
        type=str,
        default=None,
        metavar="PATH",
        help="선정 결과 JSON 경로",
    )
    args = parser.parse_args()

    p, c, s = args.prev_draw, args.current_draw, args.set_index
    if not 1 <= s <= 20:
        print("오류: --set-index 는 1~20 이어야 합니다.", file=sys.stderr)
        sys.exit(2)

    if _fetch_winner_for_draw(p) is None:
        print(f"오류: 회차 {p} 가 lotto_winners 에 없습니다.", file=sys.stderr)
        sys.exit(2)
    w_c = _fetch_winner_for_draw(c)
    if w_c is None:
        print(f"오류: 회차 {c} 가 lotto_winners 에 없습니다.", file=sys.stderr)
        sys.exit(2)

    main_c, bonus_c = w_c
    p_main, p_bonus = _fetch_winner_for_draw(p)
    assert p_main is not None
    prev_starts = sorted(int(x) for x in p_main)
    pb = int(p_bonus)
    if pb not in range(1, 46) or pb in prev_starts:
        print(
            f"오류: 회차 {p} 보너스({pb})가 없거나 본번호와 겹칩니다.",
            file=sys.stderr,
        )
        sys.exit(2)

    db_n = count_total_draws_in_db()
    print(
        f"요약: prev_draw={p}, current_draw={c}, set_index={s}, "
        f"C당첨={_winner_summary(c)}, "
        f"P시작7 본6=[{','.join(str(x) for x in prev_starts)}] 보너스={pb}, "
        f"DB총회차={db_n}"
    )
    if c != p + 1:
        print(
            f"경고: current_draw({c}) != prev_draw+1({p + 1}). "
            "엔진 기본 규칙과 어긋날 수 있으나 지정 (P,C) 로 진행합니다.",
            file=sys.stderr,
        )

    rank1_achieved = False
    fallback_used = False
    picked_o: int | None = None
    picked_perm: tuple[int, ...] | None = None
    candidates: list[tuple[int, int, int, tuple[int, ...]]] = []

    for o in range(45):
        for perm in itertools.permutations(range(7), 6):
            perm_t = tuple(int(x) for x in perm)
            row = generate_jl_ticket_for_draw_and_set(
                c,
                set_index=s,
                offset=o,
                start_permutation=perm_t,
                forced_previous_main=list(prev_starts),
                forced_previous_bonus=pb,
            )
            ticket = {
                int(row["num1"]),
                int(row["num2"]),
                int(row["num3"]),
                int(row["num4"]),
                int(row["num5"]),
                int(row["num6"]),
            }
            rnk = rank_lotto_ticket(main_c, bonus_c, ticket)
            w, m = single_ticket_fallback_score(main_c, bonus_c, ticket)
            candidates.append((w, m, o, perm_t))

            if rnk == 1:
                rank1_achieved = True
                picked_o, picked_perm = o, perm_t
                print(
                    f"1등 발견: prev={p}, current={c}, set={s}, offset={o}, perm={list(perm_t)}"
                )
                break
        if rank1_achieved:
            break

    if not rank1_achieved:
        fallback_used = True
        picked_o, picked_perm = _fallback_pick_best(candidates)
        print(
            f"1등 없음(45×5040 종료). 폴백 확정: offset={picked_o}, perm={list(picked_perm)} "
            f"(타이브레이크: 동점 시 offset 오름차순 → 순열 튜플 사전순)"
        )

    assert picked_o is not None and picked_perm is not None

    payload: dict[str, Any] = {
        "prev_draw": p,
        "current_draw": c,
        "set_index": s,
        "offset": int(picked_o),
        "start_permutation": list(picked_perm),
        "prev_bonus": pb,
        "start_pick_mode": "seven_pool_p7_6",
        "rank1_achieved": rank1_achieved,
        "fallback_used": fallback_used,
        "picked_at_utc": datetime.now(timezone.utc).isoformat(),
    }

    if args.write_pick:
        out = Path(args.write_pick)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"pick 저장: {out.resolve()}")

    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
