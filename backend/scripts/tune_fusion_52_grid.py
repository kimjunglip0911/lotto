# -*- coding: utf-8 -*-
"""
융합 가중치 프로파일을 바꿔가며 52회 생성·분석 후 5등 회차 수가 최대인 조합을 적용.
목표: 26회 이상. 1단계 코스 그리드 → 2단계 최고 조합 주변 파인 그리드로 수치 고도화.
실행: backend 디렉터리에서 python -m scripts.tune_fusion_52_grid
진행 로그: backend/tune_fusion_52_grid.log (실시간 확인 가능)
한글 깨짐 시: 터미널에서 chcp 65001 실행 후 다시 실행.
"""
import sys
import os
from pathlib import Path

sys.dont_write_bytecode = True
from contextlib import redirect_stdout
from datetime import datetime

_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))


def _ensure_utf8_console() -> None:
    """Windows 터미널에서 한글이 깨지지 않도록 콘솔·stdout을 UTF-8로 설정."""
    if sys.platform != "win32":
        return
    try:
        os.system("chcp 65001 >nul 2>&1")
    except Exception:
        pass
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass


LOG_FILE = _backend_root / "tune_fusion_52_grid.log"


def _log(msg: str) -> None:
    """콘솔 출력 + 로그 파일 동시 기록 (진행 상황을 파일로 확인 가능)."""
    print(msg, flush=True)
    line = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n"
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line)
    except OSError:
        pass

# 가중치 순서: 순서통계량, CDM, 마르코프, LSTM, BiLSTM, CNN, GA, PSO, 행동경제학, 출현빈도·추세
# 1단계: 코스 그리드 프로파일 (다양한 균형)
PROFILES = [
    ("균등", [0.1] * 10),
    ("순서통계+빈도", [0.25, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.25]),
    ("출현빈도_우세", [0.05, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.11, 0.28]),
    ("순서통계_단독강화", [0.35, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.08, 0.08]),
    ("융합_가중치최적화", [0.28, 0.06, 0.08, 0.08, 0.08, 0.08, 0.08, 0.06, 0.10, 0.10]),
    ("빈도_강화", [0.08, 0.06, 0.08, 0.08, 0.08, 0.08, 0.08, 0.06, 0.12, 0.28]),
    ("순서통계_케이스", [0.32, 0.08, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.09, 0.09]),
    ("CDM+마르코프", [0.05, 0.22, 0.22, 0.06, 0.06, 0.06, 0.06, 0.06, 0.08, 0.13]),
    ("행동+빈도", [0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.18, 0.18]),
    ("GA+PSO+순서", [0.20, 0.08, 0.08, 0.08, 0.08, 0.08, 0.15, 0.15, 0.03, 0.07]),
    ("순서+빈도_밸런스", [0.22, 0.06, 0.08, 0.08, 0.08, 0.08, 0.08, 0.06, 0.08, 0.18]),
    ("순서_극대화", [0.42, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.06, 0.08, 0.08]),
]

# 2단계 파인 그리드: 최고 조합 주변 step 간격으로 (인덱스 0: 순서통계, 인덱스 9: 빈도)만 변화, 나머지 비율 유지
FINE_STEP = 0.02
FINE_STEPS = 5  # w0, w9 각각 -2*step, -step, 0, +step, +2*step


def _normalize(w: list[float]) -> list[float]:
    s = sum(w)
    if s <= 0:
        return w
    return [x / s for x in w]


def fine_grid_around(best_weights: list[float]) -> list[tuple[str, list[float]]]:
    """최고 가중치 주변 파인 그리드 후보 생성. 합=1 유지."""
    if len(best_weights) != 10:
        return []
    w0, w9 = best_weights[0], best_weights[9]
    mid = best_weights[1:9]
    mid_sum = sum(mid)
    candidates = []
    for i in range(-2, 3):
        for j in range(-2, 3):
            n0 = round(w0 + i * FINE_STEP, 4)
            n9 = round(w9 + j * FINE_STEP, 4)
            if n0 < 0.05 or n0 > 0.55 or n9 < 0.05 or n9 > 0.45 or (1 - n0 - n9) < 0.01:
                continue
            scale = (1.0 - n0 - n9) / mid_sum if mid_sum > 0 else 1.0 / 8
            rest = [round(x * scale, 4) for x in mid]
            vec = [n0] + rest + [n9]
            vec = _normalize(vec)
            name = f"파인_w0={vec[0]:.2f}_w9={vec[9]:.2f}"
            candidates.append((name, vec))
    return candidates


def _run_one(fusion_mod, gen_mod, run_analysis, name: str, weights: list[float]) -> int:
    fusion_mod.WEIGHTS[:] = weights
    with open(os.devnull, "w", encoding="utf-8") as devnull:
        with redirect_stdout(devnull):
            gen_mod.main()
    count, _ = run_analysis(verbose=False)
    return count


def main() -> None:
    _ensure_utf8_console()
    _log("tune_fusion_52_grid 시작 (모듈 로딩 중...)")
    import domain.services.analysis.fusion_service as fusion_mod
    import scripts.generate_fusion_52 as gen_mod
    from scripts.analyze_fusion_52 import run_analysis

    _log("=== 1단계: 코스 그리드 프로파일 평가 ===")
    results: list[tuple[str, list[float], int]] = []

    # 1단계: 코스 그리드
    for idx, (name, weights) in enumerate(PROFILES, 1):
        _log(f"  [{idx}/{len(PROFILES)}] {name} 평가 중...")
        count = _run_one(fusion_mod, gen_mod, run_analysis, name, weights)
        results.append((name, weights, count))
        _log(f"  [{name}] -> 5등 1세트 이상 회차: {count}회 (목표 26)")

    results.sort(key=lambda x: -x[2])
    best_name, best_weights, best_count = results[0]
    _log("-" * 60)
    _log(f"코스 최고: [{best_name}] {best_count}회")

    # 2단계: 최고 조합 주변 파인 그리드
    fine_candidates = fine_grid_around(best_weights)
    if fine_candidates:
        _log(f"\n=== 2단계: 파인 그리드 (최고 조합 주변, 후보 {len(fine_candidates)}개) ===")
        seen_weights: set[tuple[float, ...]] = {tuple(best_weights)}
        idx = 0
        for name, weights in fine_candidates:
            if tuple(weights) in seen_weights:
                continue
            seen_weights.add(tuple(weights))
            idx += 1
            _log(f"  [{idx}] {name} 평가 중...")
            count = _run_one(fusion_mod, gen_mod, run_analysis, name, weights)
            results.append((name, weights, count))
            _log(f"  [{name}] -> {count}회")
        results.sort(key=lambda x: -x[2])
        best_name, best_weights, best_count = results[0]
        _log("-" * 60)
        _log(f"전체 최고: [{best_name}] {best_count}회")

    if best_count >= 26:
        _log("목표 26회 달성.")
    else:
        _log("목표 미달. fusion_service.WEIGHTS를 위 최고 조합으로 저장했습니다. 재실행 시 해당 조합 기준으로 다시 파인 그리드 탐색.")

    # fusion_service.py WEIGHTS 덮어쓰기
    path = _backend_root / "domain" / "services" / "analysis" / "fusion_service.py"
    lines = path.read_text(encoding="utf-8").splitlines()
    new_lines = []
    skip_until = -1
    for i, line in enumerate(lines):
        if i <= skip_until:
            continue
        if line.strip().startswith("WEIGHTS = ["):
            new_lines.append("WEIGHTS = " + str(best_weights) + "  # tune_fusion_52_grid 최고: " + best_name)
            j = i + 1
            while j < len(lines) and "]" not in lines[j]:
                j += 1
            skip_until = j
            continue
        new_lines.append(line)
    path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    _log("fusion_service.WEIGHTS를 최고 조합으로 저장했습니다.")
    _log("=== tune_fusion_52_grid 완료 ===")


if __name__ == "__main__":
    main()
