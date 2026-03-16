# -*- coding: utf-8 -*-
"""
융합 기법용 통합 스크립트: 52회(1164~1215) 융합 20세트 생성 → 분석 → (선택) 가중치 튜닝.

사용: backend 디렉터리에서
  python -m scripts.run_fusion_52              # 생성 + 분석만
  python -m scripts.run_fusion_52 --tune       # 생성 + 분석 + 가중치 그리드 튜닝
"""
import argparse
import sys
from pathlib import Path

_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))


def main() -> None:
    parser = argparse.ArgumentParser(description="융합 52회 생성·분석·(선택)가중치 튜닝")
    parser.add_argument("--tune", "-t", action="store_true", help="가중치 그리드 튜닝까지 실행")
    args = parser.parse_args()

    print("=== 융합 52회 생성 ===")
    import scripts.generate_fusion_52 as gen
    gen.main()

    print("\n=== 융합 52회 분석 ===")
    from scripts.analyze_fusion_52 import run_analysis
    achieved, total = run_analysis(verbose=True)

    if args.tune:
        print("\n=== 융합 가중치 튜닝 (tune_fusion_52_grid) ===")
        import scripts.tune_fusion_52_grid as tune
        tune.main()
    else:
        if achieved >= 26:
            print("목표 26회 달성.")
        else:
            print("목표 미달. 가중치 튜닝 시: python -m scripts.run_fusion_52 --tune")

    sys.exit(0 if achieved >= 26 else 1)


if __name__ == "__main__":
    main()
