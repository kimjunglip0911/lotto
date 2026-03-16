# -*- coding: utf-8 -*-
"""
목표(52회 중 26회 이상 5등) 미달 시 가중치를 바꿔가며 생성·분석을 반복.
실행: backend 디렉터리에서 python -m scripts.run_fusion_52_until_target
최대 반복 횟수와 프로파일은 아래 MAX_ROUNDS, EXTRA_PROFILES 로 조정.
"""
import sys
import os
from pathlib import Path
from contextlib import redirect_stdout

_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

TARGET = 26
MAX_ROUNDS = 3  # 목표 미달 시 최대 재시도 횟수

# 1라운드 후 추가 시도용 프로파일 (이름, 10개 가중치)
EXTRA_PROFILES = [
    ("CDM+마르코프", [0.05, 0.22, 0.22, 0.06, 0.06, 0.06, 0.06, 0.06, 0.08, 0.13]),
    ("행동+빈도", [0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.18, 0.18]),
    ("GA+PSO+순서", [0.2, 0.08, 0.08, 0.08, 0.08, 0.08, 0.15, 0.15, 0.03, 0.07]),
]


def main() -> None:
    import domain.services.analysis.fusion_service as fusion_mod
    import scripts.generate_fusion_52 as gen_mod
    from scripts.analyze_fusion_52 import run_analysis

    with open(os.devnull, "w", encoding="utf-8") as devnull:
        with redirect_stdout(devnull):
            gen_mod.main()
    best_count, total = run_analysis(verbose=False)
    print(f"[라운드 0] 현재 WEIGHTS 기준: 5등 1세트 이상 회차 {best_count}회 (목표 {TARGET})")
    if best_count >= TARGET:
        print("목표 달성.")
        return

    for round_no in range(1, MAX_ROUNDS):
        name, weights = EXTRA_PROFILES[(round_no - 1) % len(EXTRA_PROFILES)]
        fusion_mod.WEIGHTS[:] = weights
        print(f"[라운드 {round_no}] 프로파일 [{name}] 적용 후 52회 생성 중...")
        with open(os.devnull, "w", encoding="utf-8") as devnull:
            with redirect_stdout(devnull):
                gen_mod.main()
        count, _ = run_analysis(verbose=False)
        print(f"  -> 5등 1세트 이상 회차: {count}회")
        if count > best_count:
            best_count = count
            path = _backend_root / "domain" / "services" / "analysis" / "fusion_service.py"
            lines = path.read_text(encoding="utf-8").splitlines()
            new_lines = []
            skip_until = -1
            for i, line in enumerate(lines):
                if i <= skip_until:
                    continue
                if line.strip().startswith("WEIGHTS = ["):
                    new_lines.append(f"WEIGHTS = {weights}  # {name}")
                    j = i + 1
                    while j < len(lines) and "]" not in lines[j]:
                        j += 1
                    skip_until = j
                    continue
                new_lines.append(line)
            path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
        if best_count >= TARGET:
            print("목표 달성.")
            return
    print(f"최종 {best_count}회. 목표 {TARGET}회 미달. tune_fusion_52_grid 또는 PROFILES 확장 후 재실행 권장.")


if __name__ == "__main__":
    main()
