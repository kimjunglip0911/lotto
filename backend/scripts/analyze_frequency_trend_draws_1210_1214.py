# -*- coding: utf-8 -*-
"""
1210~1214 회차 당첨번호 vs 추천 세트 매칭 분석.
- 출현 빈도 및 추세 기법 관련 세트 상세 출력
- 전체 20세트 기준 5등 달성 여부 요약

실행: backend 디렉터리에서
  python -m scripts.analyze_frequency_trend_draws_1210_1214
"""
import sys
from pathlib import Path

_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from infrastructure.persistence.database import get_connection

DRAW_NOS = (1210, 1211, 1212, 1213, 1214)


def main() -> None:
    conn = get_connection()
    cursor = conn.cursor()

    placeholders = ",".join("?" * len(DRAW_NOS))
    cursor.execute(
        f"SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num FROM lotto_winners WHERE draw_no IN ({placeholders}) ORDER BY draw_no",
        DRAW_NOS,
    )
    winner_rows = cursor.fetchall()
    winners_by_draw = {}
    for row in winner_rows:
        d = dict(row)
        draw_no = d["draw_no"]
        winners_by_draw[draw_no] = {
            "nums": {d["num1"], d["num2"], d["num3"], d["num4"], d["num5"], d["num6"]},
            "bonus": d["bonus_num"],
            "display": (d["num1"], d["num2"], d["num3"], d["num4"], d["num5"], d["num6"]),
        }

    cursor.execute(
        f"""SELECT draw_no, method, num1, num2, num3, num4, num5, num6
            FROM lotto_drawings
            WHERE draw_no IN ({placeholders}) AND method LIKE '%출현 빈도 및 추세 기법%'
            ORDER BY draw_no, id""",
        DRAW_NOS,
    )
    drawing_rows = cursor.fetchall()
    conn.close()

    drawings_by_draw = {}
    for row in drawing_rows:
        d = dict(row)
        draw_no = d["draw_no"]
        if draw_no not in drawings_by_draw:
            drawings_by_draw[draw_no] = []
        drawings_by_draw[draw_no].append(d)

    print("=" * 72)
    print("1210~1214 회차 출현 빈도 및 추세 기법 추천 세트 vs 당첨번호 매칭 분석")
    print("=" * 72)

    for draw_no in DRAW_NOS:
        print(f"\n[회차 {draw_no}]")
        if draw_no not in winners_by_draw:
            print("  당첨번호 없음")
            continue

        win = winners_by_draw[draw_no]
        print(f"  당첨번호: {sorted(win['display'])} (보너스: {win['bonus']})")

        sets_for_draw = drawings_by_draw.get(draw_no, [])
        if not sets_for_draw:
            print("  출현 빈도 및 추세 기법 관련 추천 세트: 없음")
            continue

        print("  출현 빈도 및 추세 기법 관련 추천 세트:")
        at_least_one_5th = False
        for s in sets_for_draw:
            rec_nums = {s["num1"], s["num2"], s["num3"], s["num4"], s["num5"], s["num6"]}
            match_count = len(win["nums"] & rec_nums)
            is_5th_or_better = match_count >= 3
            if is_5th_or_better:
                at_least_one_5th = True
            rank_str = "5등 이상" if is_5th_or_better else "낙첨"
            print(
                f"    - {s['method']}: [{s['num1']}, {s['num2']}, {s['num3']}, {s['num4']}, {s['num5']}, {s['num6']}] "
                f"일치={match_count}개 → {rank_str}"
            )
        print(f"  → 목표(최소 1세트 5등): {'달성' if at_least_one_5th else '미달'}")

    print("\n" + "-" * 72)
    print("전체 추천 세트(20세트) 기준 5등 달성 여부")
    print("-" * 72)
    conn2 = get_connection()
    cur2 = conn2.cursor()
    for draw_no in DRAW_NOS:
        if draw_no not in winners_by_draw:
            continue
        win = winners_by_draw[draw_no]
        cur2.execute(
            "SELECT method, num1, num2, num3, num4, num5, num6 FROM lotto_drawings WHERE draw_no = ?",
            (draw_no,),
        )
        all_sets = cur2.fetchall()
        at_least_5th = any(
            len(win["nums"] & {r["num1"], r["num2"], r["num3"], r["num4"], r["num5"], r["num6"]}) >= 3
            for r in all_sets
        )
        print(f"  회차 {draw_no}: {'5등 이상 1세트 이상' if at_least_5th else '미달'} (총 {len(all_sets)}세트)")
    conn2.close()
    print("=" * 72)


if __name__ == "__main__":
    main()
