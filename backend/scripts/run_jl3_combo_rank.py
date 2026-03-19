# -*- coding: utf-8 -*-
"""
§4.6: 28세트(TOP8 전수) 중 k세트만 고를 때 2차 점수(합·구간·홀짝·연번)로 랭킹.

jl_service3.secondary_purchase_score / rank_jl3_combos_for_purchase 사용. TOP8·생성 로직은 변경하지 않음.

사용 (backend 디렉터리):
  python -m scripts.run_jl3_combo_rank --draw-no 1215
  python -m scripts.run_jl3_combo_rank --draw-no 1215 --top-k 8 --params scripts/jl3_tune_state/phase3_best.json
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True
_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from domain.services.analysis.jl_service3 import (  # noqa: E402
    generate_combinations,
    rank_jl3_combos_for_purchase,
    secondary_purchase_score,
)

_scripts_root = _backend_root / "scripts"
DEFAULT_PARAMS_JSON = _scripts_root / "jl3_tune_state" / "phase3_best.json"


def _load_params(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return dict(data.get("params") or data)


def main() -> None:
    ap = argparse.ArgumentParser(description="JL3 28세트 내 실구매용 2차 랭킹")
    ap.add_argument("--draw-no", type=int, required=True)
    ap.add_argument("--top-k", type=int, default=5)
    ap.add_argument("--params", type=Path, default=DEFAULT_PARAMS_JSON)
    ap.add_argument("--list-all-scores", action="store_true", help="28세트 전체 점수 출력")
    args = ap.parse_args()

    if not args.params.is_file():
        print(f"파일 없음: {args.params}", file=sys.stderr)
        sys.exit(2)

    kw = _load_params(args.params)
    combos = generate_combinations(args.draw_no, **kw)
    print(f"회차 {args.draw_no}: 필터 적용 후 {len(combos)}세트 (상한 C(8,6)=28)\n")

    if args.list_all_scores:
        ranked_all = sorted(
            ((secondary_purchase_score(c), c) for c in combos),
            key=lambda x: (-x[0], x[1]),
        )
        for sc, c in ranked_all:
            print(f"  {sc:.4f}  {list(c)}")
        print()

    top = rank_jl3_combos_for_purchase(combos, top_k=args.top_k)
    print(f"2차 점수 상위 {args.top_k}개 (참고용, 당첨 보장 없음):")
    for i, (sc, c) in enumerate(top, 1):
        print(f"  {i}. score={sc:.4f}  {list(c)}")


if __name__ == "__main__":
    main()
