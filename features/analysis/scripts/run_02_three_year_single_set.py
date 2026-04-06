# -*- coding: utf-8 -*-
"""
2단계: 1번에서 확정한 pick(또는 동일 파라미터 CLI)으로 세트 ``S`` 한 줄만
최근 약 3년(기본 156회차) 구간 평가 후 ``당첨 이력.md`` 를 갱신한다.
기존 파일에 표가 있으면 **해당 세트 행만 덮어쓰고** 다른 세트 표 행은 유지한다.

사용 (프로젝트 루트):
  python -m features.analysis.scripts.run_02_three_year_single_set --pick-json pick.json
  python -m features.analysis.scripts.run_02_three_year_single_set --set-index 1 --offset 17 --start-permutation 0 1 2 3 4 5 --current-draw 1218
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

sys.dont_write_bytecode = True
_project_root = Path(__file__).resolve().parents[3]
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

_backend_root = _project_root / "backend"
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from features.analysis.api.jl_service.generator import (
    _validate_start_permutation,
    _validate_start_seven_pick,
)

from features.analysis.scripts.jl_wheel_batch_eval import (
    THREE_YEAR_DRAW_COUNT,
    evaluate_jl_wheel_single_set,
    fetch_latest_draw_nos_ascending,
    merge_dangcheom_history_markdown,
)


def _configure_stdio_utf8() -> None:
    for stream in (sys.stdout, sys.stderr):
        reconf = getattr(stream, "reconfigure", None)
        if callable(reconf):
            try:
                reconf(encoding="utf-8", errors="replace")
            except (AttributeError, OSError, ValueError, TypeError):
                pass


def _load_pick(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    required = ("prev_draw", "current_draw", "set_index", "offset", "start_permutation")
    for k in required:
        if k not in data:
            raise ValueError(f"pick JSON에 '{k}' 필드가 없습니다.")
    return data


def main() -> None:
    _configure_stdio_utf8()
    parser = argparse.ArgumentParser(
        description="단일 세트 3년치 평가 → 당첨 이력.md",
    )
    parser.add_argument("--pick-json", type=str, default=None, metavar="PATH", help="1번 산출 JSON")
    parser.add_argument("--set-index", type=int, default=None)
    parser.add_argument("--offset", type=int, default=None)
    parser.add_argument("--start-permutation", type=int, nargs=6, default=None, metavar="I")
    parser.add_argument(
        "--prev-draw",
        type=int,
        default=None,
        help="pick 없을 때 선택(호환). 이력 MD에는 기록하지 않음",
    )
    parser.add_argument("--current-draw", type=int, default=None, help="1등기준회차 C (pick 없을 때 필수)")
    parser.add_argument(
        "--draw-count",
        type=int,
        default=THREE_YEAR_DRAW_COUNT,
        metavar="N",
        help=f"평가할 최신 회차 개수 (기본 {THREE_YEAR_DRAW_COUNT})",
    )
    parser.add_argument(
        "--write-history",
        type=str,
        default="features/analysis/scripts/당첨 이력.md",
        metavar="PATH",
        help="당첨 이력 Markdown 경로",
    )
    args = parser.parse_args()

    if args.pick_json:
        pick = _load_pick(Path(args.pick_json))
        c = int(pick["current_draw"])
        s = int(pick["set_index"])
        offset = int(pick["offset"])
        raw_perm = pick["start_permutation"]
        try:
            perm = _validate_start_seven_pick(raw_perm)
        except ValueError:
            perm = _validate_start_permutation(raw_perm)
    else:
        if (
            args.set_index is None
            or args.offset is None
            or args.start_permutation is None
            or args.current_draw is None
        ):
            print(
                "오류: --pick-json 이 없으면 --set-index, --offset, --start-permutation 6개, "
                "--current-draw 가 필요합니다.",
                file=sys.stderr,
            )
            sys.exit(2)
        s = int(args.set_index)
        offset = int(args.offset)
        raw = args.start_permutation
        try:
            perm = _validate_start_seven_pick(raw)
        except ValueError:
            perm = _validate_start_permutation(raw)
        c = int(args.current_draw)

    if not 1 <= s <= 20:
        print("오류: 세트 인덱스는 1~20.", file=sys.stderr)
        sys.exit(2)

    want = max(1, int(args.draw_count))
    draw_nos = fetch_latest_draw_nos_ascending(want)
    if len(draw_nos) < want:
        print(
            f"경고: 요청 {want}회차 대비 DB에 {len(draw_nos)}회차만 있어 구간이 짧습니다.",
            file=sys.stderr,
        )

    result = evaluate_jl_wheel_single_set(
        draw_nos,
        set_index=s,
        offset=offset,
        start_permutation=perm,
    )

    out = Path(args.write_history)
    existing = out.read_text(encoding="utf-8") if out.is_file() else None
    md = merge_dangcheom_history_markdown(
        existing,
        result=result,
        rank1_reference_draw=c,
    )
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(md, encoding="utf-8")
    print(f"당첨 이력 저장: {out.resolve()}")


if __name__ == "__main__":
    main()
