# -*- coding: utf-8 -*-
"""
1215회 포함 최신 52회(1164~1215) 당첨번호 vs 순서 통계량 베스트 1세트 매칭 분석.
- 회차별 5등(3개 일치) 달성 여부
- 52회 중 5등 달성 회차 수, 목표 26회 이상 여부

실행: backend 디렉터리에서
  python -m scripts.analyze_order_statistics_52
"""
import sys
from pathlib import Path

_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from infrastructure.persistence.database import get_connection

# 1215회 포함 최신 52회
DRAW_NOS = tuple(range(1164, 1216))
METHOD_NAME = "순서 통계량 베스트"
TARGET_5TH_COUNT = 26  # 50%


def run_analysis_52(verbose: bool = True) -> tuple[int, int]:
    """52회 순서 통계량 분석 실행. (5등 달성 회차 수, 분석 가능 회차 수) 반환."""
    conn = get_connection()
    cursor = conn.cursor()

    placeholders = ",".join("?" * len(DRAW_NOS))
    cursor.execute(
        f"""SELECT draw_no, num1, num2, num3, num4, num5, num6
            FROM lotto_winners
            WHERE draw_no IN ({placeholders})
            ORDER BY draw_no""",
        DRAW_NOS,
    )
    winner_rows = cursor.fetchall()
    winners_by_draw = {}
    for row in winner_rows:
        d = dict(row)
        draw_no = d["draw_no"]
        winners_by_draw[draw_no] = {
            "nums": {d["num1"], d["num2"], d["num3"], d["num4"], d["num5"], d["num6"]},
        }

    cursor.execute(
        f"""SELECT draw_no, num1, num2, num3, num4, num5, num6
            FROM lotto_drawings
            WHERE draw_no IN ({placeholders}) AND method = ?
            ORDER BY draw_no""",
        (*DRAW_NOS, METHOD_NAME),
    )
    drawing_rows = cursor.fetchall()
    conn.close()

    # 회차별 순서 통계량 베스트 1세트만 사용 (동일 회차에 1건만 있다고 가정)
    drawings_by_draw: dict[int, list] = {}
    for row in drawing_rows:
        d = dict(row)
        draw_no = d["draw_no"]
        if draw_no not in drawings_by_draw:
            drawings_by_draw[draw_no] = []
        drawings_by_draw[draw_no].append(d)

    achieved_draws: list[int] = []
    missing_winners: list[int] = []
    missing_drawings: list[int] = []

    for draw_no in DRAW_NOS:
        if draw_no not in winners_by_draw:
            missing_winners.append(draw_no)
            continue
        win = winners_by_draw[draw_no]
        sets_for_draw = drawings_by_draw.get(draw_no, [])
        if not sets_for_draw:
            missing_drawings.append(draw_no)
            continue
        rec = sets_for_draw[0]
        rec_nums = {rec["num1"], rec["num2"], rec["num3"], rec["num4"], rec["num5"], rec["num6"]}
        match_count = len(win["nums"] & rec_nums)
        is_5th = match_count >= 3
        if is_5th:
            achieved_draws.append(draw_no)

    total_ok = len(achieved_draws)
    total_analyzed = len(DRAW_NOS) - len(missing_winners) - len(missing_drawings)

    if verbose:
        print("=" * 72)
        print("52회(1164~1215) 순서 통계량 베스트 vs 당첨번호 매칭 분석")
        print("=" * 72)
        if missing_winners:
            print(f"\n당첨번호 없음 회차({len(missing_winners)}회): {missing_winners[:10]}{'...' if len(missing_winners) > 10 else ''}")
        if missing_drawings:
            print(f"순서 통계량 베스트 추천 없음 회차({len(missing_drawings)}회): {missing_drawings[:10]}{'...' if len(missing_drawings) > 10 else ''}")
        print(f"\n분석 가능 회차: {total_analyzed}회")
        print(f"5등 달성 회차 수: {total_ok}회")
        print(f"목표(5등 최소 {TARGET_5TH_COUNT}회 = 50%): {'달성' if total_ok >= TARGET_5TH_COUNT else '미달'}")
        print("=" * 72)
        if total_ok < TARGET_5TH_COUNT and total_analyzed > 0:
            print("\n→ order_statistics_service.py 상수 조정 후 generate_order_statistics_only_52 → analyze_order_statistics_52 로 재검증하세요.")
    return total_ok, total_analyzed


def main() -> None:
    run_analysis_52(verbose=True)


if __name__ == "__main__":
    main()
