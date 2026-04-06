# -*- coding: utf-8 -*-
"""
1단계: 직전 회차 ``P`` 본6(정렬)+보너스 7개 풀에서 6휠에 넣는 배치 ``P(7,6)=5040`` 과
``offset`` 0~44 를 탐색해 ``C``에서 1등을 찾는다. 없으면 ``C`` 단일 회차 보조 점수로 폴백 후 pick JSON.

사용 (프로젝트 루트):
  python -m features.analysis.scripts.run_01_pick_offset_start --prev-draw 1217 --current-draw 1218 --set-index 1 --write-pick pick.json

``--write-audit-md`` 지정 시(Windows) 기본으로 새 PowerShell 창에서 감사 파일을 실시간 표시한다. 끄기: ``--no-audit-follow-window``.
"""
from __future__ import annotations

import argparse
import itertools
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import IO, Any

sys.dont_write_bytecode = True
_project_root = Path(__file__).resolve().parents[3]
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

_backend_root = _project_root / "backend"
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from features.analysis.api.jl_service import generate_jl_ticket_for_draw_and_set
from features.analysis.api.jl_service.start_numbers import _fetch_winner_for_draw
from backend.domain.services.lotto_rank import rank_lotto_ticket

from features.analysis.scripts.jl_wheel_batch_eval import (
    count_total_draws_in_db,
    single_ticket_fallback_score,
)


def _configure_stdio_utf8() -> None:
    for stream in (sys.stdout, sys.stderr):
        reconf = getattr(stream, "reconfigure", None)
        if callable(reconf):
            try:
                reconf(encoding="utf-8", errors="replace")
            except (AttributeError, OSError, ValueError, TypeError):
                pass


def _winner_summary(draw_no: int) -> str:
    w = _fetch_winner_for_draw(draw_no)
    if w is None:
        return "(없음)"
    main, bonus = w
    nums = ",".join(str(x) for x in sorted(main))
    return f"본6=[{nums}] 보너스={bonus}"


def _spawn_audit_follow_window(md_path: Path) -> None:
    """
    감사 MD를 실시간으로 따라가는 보조 창을 연다.

    Windows: 새 PowerShell 콘솔에서 ``Get-Content -Wait``.
    그 외: ``tail -f`` 안내 문구만 stderr에 출력.
    """
    path_str = str(md_path.resolve())
    if sys.platform == "win32":
        lit = json.dumps(path_str, ensure_ascii=False)
        ps_cmd = f"Get-Content -LiteralPath {lit} -Wait -Tail 35 -Encoding utf8"
        try:
            subprocess.Popen(
                [
                    "powershell.exe",
                    "-NoExit",
                    "-Command",
                    ps_cmd,
                ],
                creationflags=subprocess.CREATE_NEW_CONSOLE,
            )
            print(
                "감사 MD 실시간 보기: 새 PowerShell 창이 열렸습니다. "
                "이 창은 스크립트 종료 후 수동으로 닫으면 됩니다.",
                file=sys.stderr,
            )
        except OSError as e:
            print(f"경고: 실시간 보기 창을 열지 못했습니다: {e}", file=sys.stderr)
    else:
        print(
            f"[감사 실시간] 터미널에서 실행: tail -n 35 -f {path_str!r}",
            file=sys.stderr,
        )


def _fallback_pick_best(
    candidates: list[tuple[int, int, int, tuple[int, ...]]],
) -> tuple[int, tuple[int, ...]]:
    """
    ``candidates``: (w, matched, offset, perm) 목록.
    타이브레이크: (1) 가중치·매치 동일 시 (2) offset 오름차순 (3) 순열 튜플 오름차순.
    """
    if not candidates:
        raise ValueError("fallback 후보가 비었습니다.")
    best_w, best_m = max((c[0], c[1]) for c in candidates)
    pool = [c for c in candidates if c[0] == best_w and c[1] == best_m]
    pool.sort(key=lambda c: (c[2], c[3]))
    _, _, o, perm = pool[0]
    return o, perm


def main() -> None:
    _configure_stdio_utf8()
    parser = argparse.ArgumentParser(
        description="1등 offset·시작순열 선정 (P→시작, C에서만 1등 판정)",
    )
    parser.add_argument("--prev-draw", type=int, required=True, metavar="P", help="직전 회차")
    parser.add_argument("--current-draw", type=int, required=True, metavar="C", help="1등을 맞출 대상 회차")
    parser.add_argument("--set-index", type=int, required=True, metavar="S", help="세트 번호 1~20")
    parser.add_argument(
        "--write-pick",
        type=str,
        default=None,
        metavar="PATH",
        help="선정 결과 JSON 경로",
    )
    parser.add_argument(
        "--write-audit-md",
        type=str,
        default=None,
        metavar="PATH",
        help="전체 45×5040 후보를 일회성 MD로 기록(누락 검증·1등 grep용). 지정 시 1등이 나와도 끝까지 순회",
    )
    parser.add_argument(
        "--no-audit-follow-window",
        action="store_true",
        help="--write-audit-md 사용 시 Windows에서 열리는 실시간 보기 창을 끔",
    )
    args = parser.parse_args()

    p, c, s = args.prev_draw, args.current_draw, args.set_index
    if not 1 <= s <= 20:
        print("오류: --set-index 는 1~20 이어야 합니다.", file=sys.stderr)
        sys.exit(2)

    if _fetch_winner_for_draw(p) is None:
        print(f"오류: 회차 {p} 가 lotto_winners 에 없습니다.", file=sys.stderr)
        sys.exit(2)
    w_c = _fetch_winner_for_draw(c)
    if w_c is None:
        print(f"오류: 회차 {c} 가 lotto_winners 에 없습니다.", file=sys.stderr)
        sys.exit(2)

    main_c, bonus_c = w_c
    p_main, p_bonus = _fetch_winner_for_draw(p)
    assert p_main is not None
    prev_starts = sorted(int(x) for x in p_main)
    pb = int(p_bonus)
    if pb not in range(1, 46) or pb in prev_starts:
        print(
            f"오류: 회차 {p} 보너스({pb})가 없거나 본번호와 겹칩니다.",
            file=sys.stderr,
        )
        sys.exit(2)

    db_n = count_total_draws_in_db()
    print(
        f"요약: prev_draw={p}, current_draw={c}, set_index={s}, "
        f"C당첨={_winner_summary(c)}, "
        f"P시작7 본6=[{','.join(str(x) for x in prev_starts)}] 보너스={pb}, "
        f"DB총회차={db_n}"
    )
    if c != p + 1:
        print(
            f"경고: current_draw({c}) != prev_draw+1({p + 1}). "
            "엔진 기본 규칙과 어긋날 수 있으나 지정 (P,C) 로 진행합니다.",
            file=sys.stderr,
        )

    rank1_achieved = False
    fallback_used = False
    picked_o: int | None = None
    picked_perm: tuple[int, ...] | None = None
    candidates: list[tuple[int, int, int, tuple[int, ...]]] = []

    audit_path = Path(args.write_audit_md) if args.write_audit_md else None
    full_scan = audit_path is not None
    audit_fp: IO[str] | None = None
    seq = 0
    rank1_audit_lines: list[str] = []

    if audit_path is not None:
        audit_path.parent.mkdir(parents=True, exist_ok=True)
        audit_fp = open(audit_path, "w", encoding="utf-8", newline="\n")
        mc = ",".join(str(x) for x in sorted(main_c))
        audit_fp.write(
            f"# run_01 전체 후보 감사 로그 (일회성)\n\n"
            f"- 생성 시각(UTC): {datetime.now(timezone.utc).isoformat()}\n"
            f"- prev_draw={p}, current_draw={c}, set_index={s}\n"
            f"- C 본6(정렬)=[{mc}], C 보너스={bonus_c}\n"
            f"- P 본6(정렬)=[{','.join(str(x) for x in prev_starts)}], P 보너스={pb}\n"
            f"- 예상 행 수: 45×5040 = 226800\n\n"
            "## 검색 힌트\n\n"
            "- 표에서 **등수** 열이 `1`인 행이 1등 후보.\n"
            "- 아래 `## 1등 후보 목록`에 해당 행을 동일 형식으로 모아 둠.\n\n"
            "## 전체 후보\n\n"
            "| 넘버 | offset | 조합 | 등수 |\n"
            "|------|--------|------|------|\n"
        )
        audit_fp.flush()
        if not args.no_audit_follow_window:
            _spawn_audit_follow_window(audit_path)

    try:
        for o in range(45):
            for perm in itertools.permutations(range(7), 6):
                perm_t = tuple(int(x) for x in perm)
                row = generate_jl_ticket_for_draw_and_set(
                    c,
                    set_index=s,
                    offset=o,
                    start_permutation=perm_t,
                    forced_previous_main=list(prev_starts),
                    forced_previous_bonus=pb,
                )
                ticket = {
                    int(row["num1"]),
                    int(row["num2"]),
                    int(row["num3"]),
                    int(row["num4"]),
                    int(row["num5"]),
                    int(row["num6"]),
                }
                rnk = rank_lotto_ticket(main_c, bonus_c, ticket)
                w, m = single_ticket_fallback_score(main_c, bonus_c, ticket)
                candidates.append((w, m, o, perm_t))

                seq += 1
                if audit_fp is not None:
                    t_sorted = sorted(ticket)
                    t_str = ",".join(str(x) for x in t_sorted)
                    r_disp = str(rnk) if rnk is not None else "-"
                    audit_fp.write(
                        f"| {seq} | {o} | {t_str} | {r_disp} |\n"
                    )
                    audit_fp.flush()
                    if rnk == 1:
                        rank1_audit_lines.append(
                            f"| {seq} | {o} | {t_str} | 1 |"
                        )

                if rnk == 1:
                    if not rank1_achieved:
                        rank1_achieved = True
                        picked_o, picked_perm = o, perm_t
                        print(
                            f"1등 발견: prev={p}, current={c}, set={s}, offset={o}, perm={list(perm_t)}"
                        )
                    if not full_scan:
                        break
            if rank1_achieved and not full_scan:
                break
    finally:
        if audit_fp is not None:
            audit_fp.write("\n## 1등 후보 목록\n\n")
            if rank1_audit_lines:
                audit_fp.write("| 넘버 | offset | 조합 | 등수 |\n|------|--------|------|------|\n")
                audit_fp.write("\n".join(rank1_audit_lines))
                audit_fp.write("\n")
            else:
                audit_fp.write("(없음)\n")
            audit_fp.write(f"\n## 요약\n\n- 기록한 총 행: {seq}\n- 1등 개수: {len(rank1_audit_lines)}\n")
            audit_fp.close()
            print(f"감사 MD 저장: {audit_path.resolve()}")

    if not rank1_achieved:
        fallback_used = True
        picked_o, picked_perm = _fallback_pick_best(candidates)
        print(
            f"1등 없음(45×5040 종료). 폴백 확정: offset={picked_o}, perm={list(picked_perm)} "
            f"(타이브레이크: 동점 시 offset 오름차순 → 순열 튜플 사전순)"
        )

    assert picked_o is not None and picked_perm is not None

    payload: dict[str, Any] = {
        "prev_draw": p,
        "current_draw": c,
        "set_index": s,
        "offset": int(picked_o),
        "start_permutation": list(picked_perm),
        "prev_bonus": pb,
        "start_pick_mode": "seven_pool_p7_6",
        "rank1_achieved": rank1_achieved,
        "fallback_used": fallback_used,
        "picked_at_utc": datetime.now(timezone.utc).isoformat(),
    }

    if args.write_pick:
        out = Path(args.write_pick)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"pick 저장: {out.resolve()}")

    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
