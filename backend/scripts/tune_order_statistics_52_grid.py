# -*- coding: utf-8 -*-
"""
순서 통계량 상수 경우의 수 그리드 탐색. 52회 생성·분석 후 5등 달성 회차가 최대인 조합을 찾고 적용합니다.

실행: backend 디렉터리에서
  python -m scripts.tune_order_statistics_52_grid
"""
import sys
import os
import itertools
from pathlib import Path
from contextlib import redirect_stdout

_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

# 그리드: (SIGMA, RECENT_DRAWS, RECENT_WEIGHT, AVG_USE_LAST_N_DRAWS, THEORETICAL_BLEND, RECENT_DECAY)
# RECENT_DECAY 0 = 동일 가중(기존 방식). 양수면 시간감쇠.
GRID = {
    "SIGMA": [3.0, 3.5, 4.0, 4.5, 5.0],
    "RECENT_DRAWS": [4, 6, 8],
    "RECENT_WEIGHT": [2.0, 2.2, 2.4],
    "AVG_USE_LAST_N_DRAWS": [0, 52],
    "THEORETICAL_BLEND": [0.0, 0.25, 0.4],
    "RECENT_DECAY": [0.0, 0.85, 0.9],  # 0 = 동일 가중
}


def main() -> None:
    import domain.services.analysis.order_statistics_service as os_mod
    import scripts.generate_order_statistics_only_52 as gen_mod
    from scripts.analyze_order_statistics_52 import run_analysis_52

    keys = list(GRID.keys())
    combos = list(itertools.product(*(GRID[k] for k in keys)))
    total = len(combos)
    print(f"순서 통계량 52회 그리드 튜닝: 총 {total}개 조합")
    print("SIGMA, RECENT_DRAWS, RECENT_WEIGHT, AVG_N, BLEND, DECAY -> 5등 회차 수")
    print("-" * 72)

    results: list[tuple[tuple, int]] = []
    for i, combo in enumerate(combos):
        for k, v in zip(keys, combo):
            setattr(os_mod, k, v)
        with open(os.devnull, "w", encoding="utf-8") as devnull:
            with redirect_stdout(devnull):
                gen_mod.main()
        count, _ = run_analysis_52(verbose=False)
        results.append((combo, count))
        sig, rd, rw, avg_n, blend, decay = combo
        print(f"[{i+1}/{total}] {sig} {rd} {rw} {avg_n} {blend} {decay} -> {count}")

    results.sort(key=lambda x: (-x[1], x[0]))
    best_combo, best_count = results[0]
    print("-" * 72)
    print("최고 조합 (5등 달성 회차 수 =", best_count, "):")
    for k, v in zip(keys, best_combo):
        print(f"  {k} = {v}")

    # order_statistics_service.py 상단 상수 블록을 최고 조합으로 갱신
    path = _backend_root / "domain" / "services" / "analysis" / "order_statistics_service.py"
    lines = path.read_text(encoding="utf-8").splitlines()
    new_lines = []
    replaced = False
    i = 0
    while i < len(lines):
        line = lines[i]
        new_lines.append(line)
        if line.strip().startswith("SIGMA = ") and not replaced:
            new_lines[-1] = f"SIGMA = {best_combo[0]}"
            new_lines.append(f"RECENT_DRAWS = {best_combo[1]}")
            new_lines.append(f"RECENT_WEIGHT = {best_combo[2]}")
            new_lines.append(f"AVG_USE_LAST_N_DRAWS = {best_combo[3]}")
            new_lines.append(f"THEORETICAL_BLEND = {best_combo[4]}")
            new_lines.append(f"RECENT_DECAY = {best_combo[5]}")
            i += 6  # 기존 SIGMA 포함 상수 6줄 전체 스킵
            replaced = True
            continue
        i += 1
    if replaced:
        path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
        print("\norder_statistics_service.py 상수 블록을 위 최고 조합으로 저장했습니다.")
    else:
        print("\n자동 저장 실패. 위 최고 조합을 수동으로 order_statistics_service.py에 반영하세요.")


if __name__ == "__main__":
    main()
