"""
1210~1214 회차 당첨번호·CDM 관련 추천 세트 조회 및 회차별 일치 개수·5등 달성 여부 출력.
실행: backend 디렉터리에서
  python -m scripts.analyze_cdm_draws_1210_1214
또는 (backend가 PYTHONPATH에 있을 때)
  python scripts/analyze_cdm_draws_1210_1214.py
"""
import sys
from pathlib import Path

# backend 루트를 path에 추가 (스크립트를 backend 밖에서 실행해도 동작하도록)
_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries

DRAW_NOS = (1210, 1211, 1212, 1213, 1214)


def main() -> None:
    conn = get_connection()
    cursor = conn.cursor()

    # 당첨번호 조회 (파라미터화)
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

    # CDM 관련 추천 세트 조회 (파라미터화)
    cursor.execute(
        f"""SELECT draw_no, method, num1, num2, num3, num4, num5, num6
            FROM lotto_drawings
            WHERE draw_no IN ({placeholders}) AND (method LIKE '%CDM%' OR method = ?)
            ORDER BY draw_no, id""",
        (*DRAW_NOS, "CDM 바이시안 베스트"),
    )
    drawing_rows = cursor.fetchall()
    conn.close()

    # 회차별로 결과 출력
    drawings_by_draw = {}
    for row in drawing_rows:
        d = dict(row)
        draw_no = d["draw_no"]
        if draw_no not in drawings_by_draw:
            drawings_by_draw[draw_no] = []
        drawings_by_draw[draw_no].append(d)

    print("=" * 72)
    print("1210~1214 회차 CDM 추천 세트 vs 당첨번호 매칭 분석")
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
            print("  CDM 관련 추천 세트: 없음")
            continue

        print("  CDM 관련 추천 세트:")
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
        print(f"  → 회차 목표(최소 1세트 5등 이상): {'달성' if at_least_one_5th else '미달'}")

    print("\n" + "=" * 72)


if __name__ == "__main__":
    main()
