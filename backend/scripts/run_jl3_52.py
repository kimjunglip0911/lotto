# -*- coding: utf-8 -*-
"""
JL3 기법 52회 검증: jl_service3의 TOP_N개 번호 → C(TOP_N,6) 세트 전수 조합 생성 및 당첨 비교.

사용: backend 디렉터리에서
  python -m scripts.run_jl3_52              # 52회 생성 + 분석
  python -m scripts.run_jl3_52 --analyze-only   # 기존 저장분만 분석
  python -m scripts.run_jl3_52 --diagnose       # 상위 풀 적중률 병목 진단만 실행

합격선: 회차별 당첨 기준(당첨 발생 회차 수 >= 52회).
"""
import argparse
import math
import sys
import uuid
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True
_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries
from domain.services.analysis.jl_service3 import (
    TOP_N,
    generate_combinations,
    get_top8,
    METHOD_NAME_JL3,
)

# 테스트 설정
DRAW_NOS = tuple(range(1164, 1216))
NUM_SETS_PER_DRAW = math.comb(TOP_N, 6)  # 필터 미적용 시 전수 조합 개수
TOTAL_DRAWS = len(DRAW_NOS)

# get_top8 / get_analysis 에 전달하면 안 되는 키 (generate_combinations 전용)
JL3_TOP8_EXCLUDE_KEYS = frozenset({
    "apply_sum_filter",
    "apply_odd_even_filter",
    "sum_margin_ratio",
    "odd_even_min_ratio",
})


def jl3_params_for_top8(params: dict | None) -> dict:
    """튜닝 dict에서 상위 번호 선정(get_top8)용 인자만 남김."""
    if not params:
        return {}
    return {k: v for k, v in params.items() if k not in JL3_TOP8_EXCLUDE_KEYS}


def compute_top8_coverage_metrics(
    params: dict | None = None,
    draw_nos: tuple[int, ...] | None = None,
) -> dict[str, Any]:
    """
    52회(또는 draw_nos) 각 회차별 당첨 6개가 JL3 상위 풀에 몇 개 들어가는지 집계.
    반환: by_draw, draws_with_ge3, draws_with_ge4, draws_with_ge5, draws_with_ge6
    (draws_with_ge3 = 5등 이상이 이론상 가능한 회차 수 상한)
    """
    draws = draw_nos if draw_nos is not None else DRAW_NOS
    kwargs = jl3_params_for_top8(dict(params) if params else {})
    conn = get_connection()
    cursor = conn.cursor()
    ph = ",".join("?" * len(draws))
    cursor.execute(
        f"SELECT draw_no, num1, num2, num3, num4, num5, num6 FROM lotto_winners WHERE draw_no IN ({ph}) ORDER BY draw_no",
        draws,
    )
    winners: dict[int, set[int]] = {}
    for r in cursor.fetchall():
        d = dict(r)
        dn = d["draw_no"]
        main = {d["num1"], d["num2"], d["num3"], d["num4"], d["num5"], d["num6"]}
        winners[dn] = main
    conn.close()

    by_draw: dict[int, int] = {}
    for dn in draws:
        if dn not in winners:
            continue
        top_pool = set(get_top8(dn, **kwargs))
        by_draw[dn] = len(winners[dn] & top_pool)

    draws_with_ge3 = sum(1 for h in by_draw.values() if h >= 3)
    draws_with_ge4 = sum(1 for h in by_draw.values() if h >= 4)
    draws_with_ge5 = sum(1 for h in by_draw.values() if h >= 5)
    draws_with_ge6 = sum(1 for h in by_draw.values() if h >= 6)

    return {
        "by_draw": by_draw,
        "draws_with_ge3": draws_with_ge3,
        "draws_with_ge4": draws_with_ge4,
        "draws_with_ge5": draws_with_ge5,
        "draws_with_ge6": draws_with_ge6,
    }


def generate_52_twenty_eight_sets(
    params: dict | None = None,
    method_name: str | None = None,
    draw_nos: tuple[int, ...] | None = None,
) -> None:
    """52회(또는 draw_nos) 회차당 JL3 전수 조합 생성 후 DB 저장.

    회차당 최대 세트 수는 jl_service3.TOP_N에 따름(기본 C(8,6)=28).
    params는 튜닝용 파라미터 오버라이드, method_name은 저장용 기법명.
    """
    draws = draw_nos if draw_nos is not None else DRAW_NOS
    name = method_name if method_name is not None else METHOD_NAME_JL3
    kwargs = dict(params) if params else {}
    conn = get_connection()
    cursor = conn.cursor()
    for i, draw_no in enumerate(draws):
        combos = generate_combinations(draw_no, **kwargs)
        cursor.execute(queries.DELETE_DRAWINGS_BY_NO_AND_METHOD, (draw_no, name))
        for combo in combos:
            nums = sorted(combo)
            cursor.execute(
                queries.INSERT_DRAWING,
                (
                    f"jl352_{uuid.uuid4().hex[:8]}",
                    nums[0], nums[1], nums[2], nums[3], nums[4], nums[5],
                    0, 0, name, draw_no,
                ),
            )
        conn.commit()
        n_sets = len(combos)
        if (i + 1) % 10 == 0 or i == 0 or i == len(draws) - 1:
            msg = f"  회차 {draw_no}: {n_sets}세트 저장 완료"
            if n_sets < NUM_SETS_PER_DRAW:
                msg += " (합계/홀짝 필터 적용)"
            print(msg)
    conn.close()
    n = len(draws)
    print(f"{n}회 생성 완료 (회차당 최대 {NUM_SETS_PER_DRAW}세트, method={name})")


def _rank_one_set(main: set, bonus: int, drawn: set) -> int | None:
    """한 세트의 등수 반환. 1~5등이면 등수, 미당첨이면 None."""
    match = len(main & drawn)
    if match == 6:
        return 1
    if match == 5 and bonus in drawn:
        return 2
    if match == 5:
        return 3
    if match == 4:
        return 4
    if match == 3:
        return 5
    return None


def analyze_52_by_tier(
    method_name: str | None = None,
    verbose: bool = True,
    pass_by_draw: bool = True,
    pass_threshold: int | None = None,
    draw_nos: tuple[int, ...] | None = None,
) -> tuple[bool, dict, int]:
    """52회 회차별 전수 세트(기본 최대 28)를 당첨번호와 비교 후 합격 여부, 1~5등 횟수, 당첨 발생 회차 수 반환.

    pass_threshold: None이면 len(draw_nos), 지정 시 당첨 발생 회차 수 >= pass_threshold 이면 합격.
    """
    draws = draw_nos if draw_nos is not None else DRAW_NOS
    n_draws = len(draws)
    name = method_name if method_name is not None else METHOD_NAME_JL3
    conn = get_connection()
    cursor = conn.cursor()
    ph = ",".join("?" * len(draws))
    cursor.execute(
        f"SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num FROM lotto_winners WHERE draw_no IN ({ph}) ORDER BY draw_no",
        draws,
    )
    winners = {}
    for r in cursor.fetchall():
        d = dict(r)
        dn = d["draw_no"]
        main = {d["num1"], d["num2"], d["num3"], d["num4"], d["num5"], d["num6"]}
        winners[dn] = (main, d.get("bonus_num") or 0)

    cursor.execute(
        f"SELECT draw_no, num1, num2, num3, num4, num5, num6 FROM lotto_drawings WHERE draw_no IN ({ph}) AND method = ? ORDER BY draw_no",
        (*draws, name),
    )
    rows = cursor.fetchall()
    conn.close()

    by_draw = {}
    for r in rows:
        d = dict(r)
        dn = d["draw_no"]
        if dn not in by_draw:
            by_draw[dn] = []
        by_draw[dn].append({d["num1"], d["num2"], d["num3"], d["num4"], d["num5"], d["num6"]})

    per_draw = {}
    hit_draws = []
    for dn in draws:
        if dn not in winners:
            continue
        main, bonus = winners[dn]
        draw_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        best_rank_for_draw = None
        for s in by_draw.get(dn, []):
            rank = _rank_one_set(main, bonus, s)
            if rank is not None:
                draw_counts[rank] += 1
                if best_rank_for_draw is None or rank < best_rank_for_draw:
                    best_rank_for_draw = rank
        per_draw[dn] = draw_counts
        if best_rank_for_draw is not None:
            hit_draws.append((dn, best_rank_for_draw))

    # 등수별 당첨 발생 회차 수 (해당 등수가 난 회차 수, 누적 아님)
    draws_per_tier = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for dn, dc in per_draw.items():
        for t in (1, 2, 3, 4, 5):
            if dc[t] > 0:
                draws_per_tier[t] += 1

    threshold = pass_threshold if pass_threshold is not None else n_draws
    passed = len(hit_draws) >= threshold if pass_by_draw else False

    if verbose:
        print("=" * 60)
        print(f"{n_draws}회 JL3 기법 분석 (method={name}) - 회차별 최대 {NUM_SETS_PER_DRAW}세트 (상위 {TOP_N}개)")
        print("=" * 60)
        print(f"회차별 당첨 개수 (해당 회차 최대 {NUM_SETS_PER_DRAW}세트 중 1~5등 당첨 세트 수)")
        print("-" * 60)
        print(f"{'회차':>6} | {'1등':>4} | {'2등':>4} | {'3등':>4} | {'4등':>4} | {'5등':>4} | 합계")
        print("-" * 60)
        for dn in draws:
            if dn not in per_draw:
                continue
            dc = per_draw[dn]
            total = dc[1] + dc[2] + dc[3] + dc[4] + dc[5]
            print(f"{dn:>6} | {dc[1]:>4} | {dc[2]:>4} | {dc[3]:>4} | {dc[4]:>4} | {dc[5]:>4} | {total:>4}")
        print("-" * 60)
        print("등수별 당첨 발생 회차 수 (해당 등수가 난 회차 수, 누적 아님)")
        print(f"{'회차수':>6} | {draws_per_tier[1]:>4} | {draws_per_tier[2]:>4} | {draws_per_tier[3]:>4} | {draws_per_tier[4]:>4} | {draws_per_tier[5]:>4} |")
        print("=" * 60)
        print(f"합격선(회차별 당첨): 당첨 발생 회차 수 >= {threshold}회")
        print(f"당첨 발생 회차 수: {len(hit_draws)}회 / {threshold}회")
        print(f"합격: {'달성' if passed else '미달'}")
        if hit_draws:
            print("당첨 회차 및 최고 등수:", hit_draws)
        print("=" * 60)
    return passed, draws_per_tier, len(hit_draws)


def diagnose_top8_coverage(
    params: dict | None = None,
    verbose: bool = True,
    draw_nos: tuple[int, ...] | None = None,
) -> dict:
    """
    병목 진단: 52회 각 회차별로 JL3 상위 TOP_N개에 당첨번호가 몇 개 포함되는지 측정.
    - 상위 풀에 3개 이상 포함된 회차 수 = 5등 이상 가능한 이론적 상한
    - 상위 풀에 4개 이상 포함된 회차 수 = 4등 이상 가능한 상한
    반환: {"by_draw": {draw_no: hit_count}, "draws_with_ge3": int, "draws_with_ge4": int, ...}
    """
    draws = draw_nos if draw_nos is not None else DRAW_NOS
    result = compute_top8_coverage_metrics(params, draws)
    by_draw = result["by_draw"]
    draws_with_ge3 = result["draws_with_ge3"]
    draws_with_ge4 = result["draws_with_ge4"]
    draws_with_ge5 = result["draws_with_ge5"]
    draws_with_ge6 = result["draws_with_ge6"]

    if verbose:
        print("=" * 60)
        print(f"JL3 상위 {TOP_N}개 적중률 진단 ({len(draws)}회)")
        print("=" * 60)
        print(f"회차별: 상위 {TOP_N}개 번호에 당첨 6개 중 포함된 개수")
        print("-" * 60)
        print(f"{'회차':>6} | {'적중수':>6}")
        print("-" * 60)
        for dn in draws:
            if dn in by_draw:
                print(f"{dn:>6} | {by_draw[dn]:>6}")
        print("-" * 60)
        print("집계 (이론적 상한):")
        print(f"  상위{TOP_N}에 당첨번호 3개 이상 포함된 회차 수: {draws_with_ge3} (5등 이상 가능)")
        print(f"  상위{TOP_N}에 당첨번호 4개 이상 포함된 회차 수: {draws_with_ge4} (4등 이상 가능)")
        print(f"  상위{TOP_N}에 당첨번호 5개 이상 포함된 회차 수: {draws_with_ge5} (3등 이상 가능)")
        print(f"  상위{TOP_N}에 당첨번호 6개 포함된 회차 수: {draws_with_ge6} (1등 가능)")
        print("=" * 60)

    return result


def weighted_score_from_draws_per_tier(draws_per_tier: dict[int, int]) -> int:
    """등수별 당첨 발생 회차 수 가중 점수 (튜너 run_jl3_auto_tune._weighted_score 와 동일)."""
    return (
        draws_per_tier.get(5, 0) * 1
        + draws_per_tier.get(4, 0) * 3
        + draws_per_tier.get(3, 0) * 10
        + draws_per_tier.get(2, 0) * 50
        + draws_per_tier.get(1, 0) * 100
    )


def evaluate_jl3_params_on_draws_in_memory(
    draw_nos: tuple[int, ...],
    params: dict | None = None,
) -> dict[str, Any]:
    """
    DB에 drawings를 쓰지 않고, 동일 파라미터로 연속 구간 회차를 메모리에서만 평가.
    §4.5 다구간 안정성·§4.4 앵커 랜덤 탐색(빠른 평가)에 사용.
    """
    kwargs = dict(params) if params else {}
    conn = get_connection()
    cursor = conn.cursor()
    ph = ",".join("?" * len(draw_nos))
    cursor.execute(
        f"SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num FROM lotto_winners WHERE draw_no IN ({ph}) ORDER BY draw_no",
        draw_nos,
    )
    winners: dict[int, tuple[set[int], int]] = {}
    for r in cursor.fetchall():
        d = dict(r)
        dn = d["draw_no"]
        main = {d["num1"], d["num2"], d["num3"], d["num4"], d["num5"], d["num6"]}
        winners[dn] = (main, d.get("bonus_num") or 0)
    conn.close()

    per_draw: dict[int, dict[int, int]] = {}
    hit_draws: list[tuple[int, int]] = []
    for dn in draw_nos:
        if dn not in winners:
            continue
        main, bonus = winners[dn]
        combos = generate_combinations(dn, **kwargs)
        draw_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        best_rank_for_draw: int | None = None
        for combo in combos:
            s = set(combo)
            rank = _rank_one_set(main, bonus, s)
            if rank is not None:
                draw_counts[rank] += 1
                if best_rank_for_draw is None or rank < best_rank_for_draw:
                    best_rank_for_draw = rank
        per_draw[dn] = draw_counts
        if best_rank_for_draw is not None:
            hit_draws.append((dn, best_rank_for_draw))

    draws_per_tier = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for dn, dc in per_draw.items():
        for t in (1, 2, 3, 4, 5):
            if dc[t] > 0:
                draws_per_tier[t] += 1

    n = len(draw_nos)
    cov = compute_top8_coverage_metrics(params, draw_nos)
    score = weighted_score_from_draws_per_tier(draws_per_tier)
    return {
        "draw_nos_range": (draw_nos[0], draw_nos[-1]) if draw_nos else None,
        "num_draws_evaluated": len(per_draw),
        "draws_per_tier": draws_per_tier,
        "num_hit_draws": len(hit_draws),
        "weighted_score": score,
        "draws_with_ge3": int(cov["draws_with_ge3"]),
        "draws_with_ge4": int(cov["draws_with_ge4"]),
        "passed_all_draws_hit": len(hit_draws) >= n,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description=f"JL3 기법 52회 회차당 최대 {NUM_SETS_PER_DRAW}세트(상위 {TOP_N}개 전수 조합) 생성 및 합격선 분석",
    )
    parser.add_argument("--analyze-only", action="store_true", help="생성 생략, 기존 저장분만 분석")
    parser.add_argument("--diagnose", action="store_true", help="상위 풀 적중률 병목 진단만 실행")
    parser.add_argument(
        "--draw-start",
        type=int,
        default=None,
        metavar="N",
        help="검증 구간 시작 회차 (--draw-end 와 함께 사용, 포함 구간 길이 정확히 52회)",
    )
    parser.add_argument(
        "--draw-end",
        type=int,
        default=None,
        metavar="N",
        help="검증 구간 끝 회차 (포함)",
    )
    args = parser.parse_args()

    draw_run: tuple[int, ...] | None = None
    if args.draw_start is not None or args.draw_end is not None:
        if args.draw_start is None or args.draw_end is None:
            print("오류: --draw-start 와 --draw-end 를 함께 지정하세요.", file=sys.stderr)
            sys.exit(2)
        if args.draw_end < args.draw_start:
            print("오류: --draw-end >= --draw-start 여야 합니다.", file=sys.stderr)
            sys.exit(2)
        draw_run = tuple(range(args.draw_start, args.draw_end + 1))
        if len(draw_run) != 52:
            print(f"오류: 구간 길이는 정확히 52회여야 합니다 (현재 {len(draw_run)}회).", file=sys.stderr)
            sys.exit(2)

    if args.diagnose:
        print(f"[JL3] 상위 {TOP_N}개 적중률 진단 중...")
        diagnose_top8_coverage(verbose=True, draw_nos=draw_run)
        sys.exit(0)

    if not args.analyze_only:
        nmsg = len(draw_run) if draw_run else TOTAL_DRAWS
        print(f"[JL3] {nmsg}회 회차당 최대 {NUM_SETS_PER_DRAW}세트 생성 중...")
        generate_52_twenty_eight_sets(draw_nos=draw_run)
    print("[JL3] 분석 중...")
    passed, counts, num_hit_draws = analyze_52_by_tier(verbose=True, draw_nos=draw_run)
    if passed:
        print("→ 합격.")
    else:
        print("→ 미달.")
    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
