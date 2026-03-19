# -*- coding: utf-8 -*-
"""
§4.5: 동일 파라미터로 DB에 있는 서로 다른 연속 52회 구간 여러 곳을 메모리 평가하여 분산·과적합 점검.

사용 (backend 디렉터리):
  python -m scripts.run_jl3_multi_window
  python -m scripts.run_jl3_multi_window --count 4
  python -m scripts.run_jl3_multi_window --windows "1060,1111" "1112,1163" "1164,1215"
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True
_backend_root = Path(__file__).resolve().parent.parent
_scripts_root = _backend_root / "scripts"
for p in (_scripts_root, _backend_root):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from infrastructure.persistence.database import get_connection  # noqa: E402

from run_jl3_52 import evaluate_jl3_params_on_draws_in_memory  # noqa: E402

DEFAULT_PARAMS_JSON = _scripts_root / "jl3_tune_state" / "phase3_best.json"


def _load_params(path: Path) -> dict[str, Any]:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if "params" in data:
        return dict(data["params"])
    return dict(data)


def _fetch_draw_bounds() -> tuple[int, int]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT MIN(draw_no), MAX(draw_no) FROM lotto_winners")
    row = cur.fetchone()
    conn.close()
    if not row or row[0] is None:
        raise RuntimeError("lotto_winners 에 데이터가 없습니다.")
    return int(row[0]), int(row[1])


def _windows_from_end(max_draw: int, span: int, count: int) -> list[tuple[int, ...]]:
    """맨 끝(max_draw)에서부터 역순으로 겹치지 않는 연속 span 회차 구간 count개."""
    out: list[tuple[int, ...]] = []
    end = max_draw
    for _ in range(count):
        start = end - span + 1
        if start < 1:
            break
        out.append(tuple(range(start, end + 1)))
        end = start - 1
    return out


def _parse_window_spec(spec: str) -> tuple[int, ...]:
    parts = spec.replace(" ", "").split(",")
    if len(parts) != 2:
        raise ValueError(f"구간 형식 오류 (시작,끝): {spec}")
    a, b = int(parts[0]), int(parts[1])
    if b < a:
        raise ValueError(spec)
    w = tuple(range(a, b + 1))
    if len(w) != 52:
        raise ValueError(f"각 구간은 정확히 52회여야 합니다: {spec} -> {len(w)}회")
    return w


def main() -> None:
    ap = argparse.ArgumentParser(description="JL3 다구간(연속 52회) 메모리 안정성 평가")
    ap.add_argument("--params", type=Path, default=DEFAULT_PARAMS_JSON)
    ap.add_argument("--count", type=int, default=3, help="자동 구간 개수 (DB 최대 회차 기준 역순)")
    ap.add_argument(
        "--windows",
        nargs="*",
        metavar="START,END",
        help="수동 지정 연속 구간 (각각 52회, 예: 1164,1215)",
    )
    args = ap.parse_args()

    if not args.params.is_file():
        print(f"파일 없음: {args.params}", file=sys.stderr)
        sys.exit(2)

    params = _load_params(args.params)

    if args.windows:
        windows = [_parse_window_spec(s) for s in args.windows]
    else:
        mn, mx = _fetch_draw_bounds()
        windows = _windows_from_end(mx, 52, args.count)
        if not windows:
            print("구간을 만들 수 없습니다 (데이터 회차 수 확인).", file=sys.stderr)
            sys.exit(2)
        print(f"[§4.5] lotto_winners 범위: {mn} ~ {mx}, 자동 {len(windows)}개 구간")

    rows: list[dict[str, Any]] = []
    print("\n구간별 메모리 평가 (동일 params):")
    for w in windows:
        ev = evaluate_jl3_params_on_draws_in_memory(w, params)
        rows.append({"window": [w[0], w[-1]], **ev})
        print(
            f"  {w[0]}~{w[-1]}: score={ev['weighted_score']} hit={ev['num_hit_draws']}/52 "
            f"ge3={ev['draws_with_ge3']} ge4={ev['draws_with_ge4']} tier={dict(ev['draws_per_tier'])}",
        )

    scores = [r["weighted_score"] for r in rows]
    hits = [r["num_hit_draws"] for r in rows]
    if len(scores) >= 2:
        spread = max(scores) - min(scores)
        h_spread = max(hits) - min(hits)
        print(f"\n가중점수 분산: max-min = {spread} | 당첨회차수 분산: {h_spread}")
        print("(구간별 편차가 크면 특정 52회에 과적합되었을 가능성을 의심할 수 있음, 참고용)")

    out_path = _scripts_root / "jl3_tune_state" / "multi_window_eval.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"params_source": str(args.params), "results": rows}, f, ensure_ascii=False, indent=2)
    print(f"\n요약 저장: {out_path}")


if __name__ == "__main__":
    main()
