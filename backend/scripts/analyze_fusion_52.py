# -*- coding: utf-8 -*-
"""
52회(1164~1215) 융합 20세트 vs 당첨번호 분석.
회차별로 20세트 중 1세트라도 5등(3개 일치) 이상이면 해당 회차 성공. 목표: 26회 이상.
실행: backend 디렉터리에서 python -m scripts.analyze_fusion_52
"""
import sys
from pathlib import Path

sys.dont_write_bytecode = True
_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from infrastructure.persistence.database import get_connection

DRAW_NOS = tuple(range(1164, 1216))
METHOD_NAME = "융합(52회)"
TARGET_5TH_DRAWS = 26  # 50%


def run_analysis(verbose: bool = True) -> tuple[int, int]:
    """(5등 이상 1세트라도 있는 회차 수, 분석 가능 회차 수) 반환."""
    conn = get_connection()
    cursor = conn.cursor()
    ph = ",".join("?" * len(DRAW_NOS))
    cursor.execute(
        f"SELECT draw_no, num1, num2, num3, num4, num5, num6 FROM lotto_winners WHERE draw_no IN ({ph}) ORDER BY draw_no",
        DRAW_NOS,
    )
    winners = {dict(r)["draw_no"]: {r["num1"], r["num2"], r["num3"], r["num4"], r["num5"], r["num6"]} for r in cursor.fetchall()}
    cursor.execute(
        f"SELECT draw_no, num1, num2, num3, num4, num5, num6 FROM lotto_drawings WHERE draw_no IN ({ph}) AND method = ? ORDER BY draw_no, id",
        (*DRAW_NOS, METHOD_NAME),
    )
    rows = cursor.fetchall()
    conn.close()
    by_draw: dict[int, list] = {}
    for r in rows:
        d = dict(r)
        dn = d["draw_no"]
        if dn not in by_draw:
            by_draw[dn] = []
        by_draw[dn].append({d["num1"], d["num2"], d["num3"], d["num4"], d["num5"], d["num6"]})
    achieved = 0
    total_ok = 0
    for dn in DRAW_NOS:
        if dn not in winners:
            continue
        total_ok += 1
        sets_for_draw = by_draw.get(dn, [])
        for s in sets_for_draw:
            if len(winners[dn] & s) >= 3:
                achieved += 1
                break
    if verbose:
        print("=" * 60)
        print("52회 융합 20세트 분석 (20세트 중 1세트라도 5등 이상인 회차 수)")
        print("=" * 60)
        print(f"분석 가능 회차: {total_ok}회, 5등 이상 1세트라도 있는 회차: {achieved}회")
        print(f"목표(>={TARGET_5TH_DRAWS}회): {'달성' if achieved >= TARGET_5TH_DRAWS else '미달'}")
        print("=" * 60)
    return achieved, total_ok


def main() -> None:
    run_analysis(verbose=True)


if __name__ == "__main__":
    main()
