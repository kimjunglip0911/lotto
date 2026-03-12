# -*- coding: utf-8 -*-
"""
1210~1214 회차 당첨번호 vs 10개 기법 추천 세트 매칭 분석.
- 각 기법별 베스트 세트가 5개 회차 중 최소 1회차에서 5등(3개 일치) 이상 달성하는지 확인
- 5등 미달 기법 리스트업

실행: backend 디렉터리에서
  python -m scripts.analyze_all_10_methods_1210_1214
"""
import sys
from pathlib import Path

_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from infrastructure.persistence.database import get_connection

DRAW_NOS = (1210, 1211, 1212, 1213, 1214)

# unified_generator_service의 10개 기법명 (베스트 suffix 추가)
METHOD_NAMES = [
    "순서 통계량 베스트",
    "CDM 바이시안 베스트",
    "마르코프 체인 베스트",
    "LSTM 베스트",
    "Bi-LSTM 베스트",
    "CNN 베스트",
    "유전 알고리즘 베스트",
    "입자 군집 최적화 베스트",
    "행동 경제학 분석 베스트",
    "출현 빈도 및 추세 기법 베스트",
]


def main() -> None:
    conn = get_connection()
    cursor = conn.cursor()

    # 당첨번호 조회
    placeholders = ",".join("?" * len(DRAW_NOS))
    cursor.execute(
        f"""SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
            FROM lotto_winners
            WHERE draw_no IN ({placeholders})
            ORDER BY draw_no""",
        DRAW_NOS,
    )
    winner_rows = cursor.fetchall()
    conn.close()

    winners_by_draw = {}
    for row in winner_rows:
        d = dict(row)
        draw_no = d["draw_no"]
        winners_by_draw[draw_no] = {
            "nums": {d["num1"], d["num2"], d["num3"], d["num4"], d["num5"], d["num6"]},
            "display": (d["num1"], d["num2"], d["num3"], d["num4"], d["num5"], d["num6"]),
        }

    # 각 기법별 1210~1214 회차 추천 세트 조회
    conn2 = get_connection()
    cur2 = conn2.cursor()

    method_achievement = {name: {"ok": False, "draws_5th": [], "details": []} for name in METHOD_NAMES}

    for method_name in METHOD_NAMES:
        cur2.execute(
            f"""SELECT draw_no, num1, num2, num3, num4, num5, num6
                FROM lotto_drawings
                WHERE draw_no IN ({placeholders}) AND method = ?""",
            (*DRAW_NOS, method_name),
        )
        rows = cur2.fetchall()

        for row in rows:
            d = dict(row)
            draw_no = d["draw_no"]
            rec_nums = {d["num1"], d["num2"], d["num3"], d["num4"], d["num5"], d["num6"]}

            if draw_no not in winners_by_draw:
                continue
            win_nums = winners_by_draw[draw_no]["nums"]
            match_count = len(win_nums & rec_nums)
            is_5th_or_better = match_count >= 3

            method_achievement[method_name]["details"].append(
                (draw_no, match_count, is_5th_or_better, sorted(rec_nums))
            )
            if is_5th_or_better:
                method_achievement[method_name]["ok"] = True
                if draw_no not in method_achievement[method_name]["draws_5th"]:
                    method_achievement[method_name]["draws_5th"].append(draw_no)

    conn2.close()

    # 결과 출력
    print("=" * 80)
    print("10개 수정된 기법 - 1210~1214 회차 5등 이상 달성 분석")
    print("=" * 80)
    print("\n[기법별 상세]")
    for method_name in METHOD_NAMES:
        info = method_achievement[method_name]
        ok_str = "5등 이상 달성" if info["ok"] else "5등 미달"
        draws_str = f"달성 회차: {sorted(info['draws_5th'])}" if info["draws_5th"] else ""
        print(f"\n  - {method_name}")
        print(f"    → {ok_str} {draws_str}")

        for draw_no, match_count, is_5th, rec in info["details"]:
            status = "5등 이상" if is_5th else "낙첨"
            print(f"      회차 {draw_no}: {rec} → 일치 {match_count}개 ({status})")

    # 5등 미달 기법 리스트업
    failed = [m for m in METHOD_NAMES if not method_achievement[m]["ok"]]
    print("\n" + "=" * 80)
    print("5등 미달 기법 (5개 회차 중 1회차도 5등 이상 없음)")
    print("=" * 80)
    if failed:
        for m in failed:
            print(f"  - {m}")
        print(f"\n총 {len(failed)}개 기법 미달")
    else:
        print("  (없음 - 10개 기법 모두 최소 1회차에서 5등 이상 달성)")

    # 데이터 없음 체크
    no_data = [m for m in METHOD_NAMES if not method_achievement[m]["details"]]
    if no_data:
        print("\n[주의] DB에 추천 세트가 없는 기법:")
        for m in no_data:
            print(f"  - {m}")
        print("  → scripts.refresh_cdm_drawings_1210_1214 실행 후 재분석하세요.")

    print("\n" + "=" * 80)


if __name__ == "__main__":
    main()
