# -*- coding: utf-8 -*-
"""
JL 휠: **최신 52개 회차**(기본) × 20세트 당첨 비교.

- 시작 6번호: 평가 구간 상한 `up_to=max(draw_nos)`를 기준으로 **1~up_to회차** 공개 본번호 누적 합 상위 6개를 **1회 고정**.
- 회차 내 20세트: `generate_jl_wheel_sets(..., dedup_across_sets=True)` — 실제 생성 로직과 동일하게 세트 간 중복 조합을 사후 교체 규칙으로 해소.
- 세트#1~20: **명목 speed**만 다르고 `decel = speed / jl_service.FIXED_STOP_TIME` (정지 시간 공정 고정).
- `docs/당첨 이력.md` 는 **고정 양식**(`## 2. 속도 프로파일…` + 요약 + 표)만 전체 덮어씀.

사용 (프로젝트 루트):
  python -m features.analysis.scripts.run_wheel_52
  python -m features.analysis.scripts.run_wheel_52 --seed 42
  python -m features.analysis.scripts.run_wheel_52 --write-history "features/analysis/scripts/당첨 이력.md"
  python -m features.analysis.scripts.run_wheel_52 --seed 42 --tune-reconcile --tune-delta 0.15
"""
from __future__ import annotations

import argparse
import ast
import math
import random
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

sys.dont_write_bytecode = True
_project_root = Path(__file__).resolve().parents[3]
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

_backend_root = _project_root / "backend"
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from features.analysis.api.jl_service import (
    FIXED_STOP_TIME,
    TWENTY_BASE_OFFSETS,
    TWENTY_BASE_SPEEDS,
    WHEEL_OFFSET_STEPS,
    generate_jl_wheel_sets,
    get_blended_start_nums,
    get_global_top6_frequency_starts,
    get_previous_draw_winning_starts,
)
from backend.domain.services.lotto_rank import rank_lotto_ticket
from backend.database import get_connection

NUM_SETS_PER_DRAW = 20
REQUIRED_DRAW_COUNT = 52
DEFAULT_RANK_WEIGHTS: dict[int, int] = {
    1: 10**12,
    2: 10**9,
    3: 10**6,
    4: 10**3,
    5: 1,
}

JL_SERVICE_FILE = _project_root / "features" / "analysis" / "api" / "jl_service.py"


def _format_float_list(values: list[float]) -> str:
    body = "\n".join(f"    {float(v)!r}," for v in values)
    return "[\n" + body + "\n]"


def _format_int_list(values: list[int], *, per_line: int = 10) -> str:
    rows: list[str] = []
    for i in range(0, len(values), per_line):
        chunk = values[i:i + per_line]
        rows.append("    " + ", ".join(str(int(x)) for x in chunk) + ",")
    return "[\n" + "\n".join(rows) + "\n]"


def _replace_typed_list_literal(src: str, var_name: str, new_list_literal: str) -> tuple[str, bool]:
    pattern = re.compile(
        rf"({re.escape(var_name)}\s*:\s*List\[[^\]]+\]\s*=\s*)(\[[\s\S]*?\])",
        re.MULTILINE,
    )
    updated, n = pattern.subn(r"\1" + new_list_literal, src, count=1)
    return updated, n == 1


def _persist_offset_speed_update(set_index_1based: int, new_offset: int, new_speed: float) -> None:
    if not JL_SERVICE_FILE.exists():
        raise FileNotFoundError(f"jl_service.py를 찾을 수 없습니다: {JL_SERVICE_FILE}")

    src = JL_SERVICE_FILE.read_text(encoding="utf-8")

    m_speed = re.search(
        r"_JITTER_BASE_SPEEDS\s*:\s*List\[[^\]]+\]\s*=\s*(\[[\s\S]*?\])",
        src,
        re.MULTILINE,
    )
    m_offset = re.search(
        r"TWENTY_BASE_OFFSETS\s*:\s*List\[[^\]]+\]\s*=\s*(\[[\s\S]*?\])",
        src,
        re.MULTILINE,
    )
    if not m_speed or not m_offset:
        raise ValueError("jl_service.py에서 기준 리스트를 찾지 못했습니다.")

    speeds = list(ast.literal_eval(m_speed.group(1)))
    offsets = list(ast.literal_eval(m_offset.group(1)))
    idx = int(set_index_1based) - 1
    if not (0 <= idx < len(speeds) and 0 <= idx < len(offsets)):
        raise IndexError(f"세트 인덱스 범위 오류: {set_index_1based}")

    speeds[idx] = float(new_speed)
    offsets[idx] = int(new_offset) % 45

    src2, ok1 = _replace_typed_list_literal(src, "_JITTER_BASE_SPEEDS", _format_float_list(speeds))
    if not ok1:
        raise ValueError("_JITTER_BASE_SPEEDS 치환 실패")
    src3, ok2 = _replace_typed_list_literal(src2, "TWENTY_BASE_OFFSETS", _format_int_list(offsets))
    if not ok2:
        raise ValueError("TWENTY_BASE_OFFSETS 치환 실패")

    if src3 != src:
        JL_SERVICE_FILE.write_text(src3, encoding="utf-8")


def fetch_latest_draw_nos_ascending(count: int = REQUIRED_DRAW_COUNT) -> tuple[int, ...]:
    """`lotto_winners` 기준 최신 `count`개 회차 번호(오름차순)."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT draw_no FROM lotto_winners
        ORDER BY draw_no DESC
        LIMIT ?
        """,
        (count,),
    )
    rows = cur.fetchall()
    conn.close()
    if len(rows) != count:
        raise ValueError(
            f"DB에 당첨 회차가 {count}개 미만입니다 (현재 {len(rows)}개). 데이터를 확인하세요."
        )
    nos = [int(r["draw_no"]) for r in rows]
    nos.reverse()
    return tuple(nos)


def _ticket_row_to_set(row: dict[str, Any]) -> set[int]:
    return {
        int(row["num1"]),
        int(row["num2"]),
        int(row["num3"]),
        int(row["num4"]),
        int(row["num5"]),
        int(row["num6"]),
    }


def _fmt_nums(s: set[int]) -> str:
    return ",".join(str(x) for x in sorted(s))


def _theoretical_single_ticket_probs() -> dict[int, float]:
    total = math.comb(45, 6)
    counts = {
        1: 1,
        2: 6,
        3: 6 * 38,
        4: math.comb(6, 4) * math.comb(39, 2),
        5: math.comb(6, 3) * math.comb(39, 3),
    }
    return {t: counts[t] / total for t in (1, 2, 3, 4, 5)}


def _profiles_from_base_speeds(speeds: list[float]) -> list[tuple[float, float]]:
    """명목 speed 리스트 → ``generate_jl_wheel_sets``용 (decel은 고정 정지시간 규칙으로 재계산됨)."""
    return [(float(s), float(s) / FIXED_STOP_TIME) for s in speeds]


def _offsets_from_base_speeds(speeds: list[float]) -> list[int]:
    """명목 speed 리스트를 기준 offset(0~44) 리스트로 변환."""
    k = FIXED_STOP_TIME / 2.0
    return [int(float(s) * k) % 45 for s in speeds]


def _per_set_hit_counts(hits: list[tuple[int, int]]) -> dict[int, int]:
    """세트별 등수 개수 집계."""
    c = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for _, r in hits:
        if r in c:
            c[r] += 1
    return c


def _weighted_hit_score(
    hits: list[tuple[int, int]],
    *,
    rank_weights: dict[int, int] | None = None,
) -> int:
    """세트별 당첨 품질 점수 (큰 쪽이 유리). 상위 등수 가중치 절대 우선."""
    c = _per_set_hit_counts(hits)
    weights = rank_weights or DEFAULT_RANK_WEIGHTS
    return sum(c[t] * int(weights.get(t, 0)) for t in (1, 2, 3, 4, 5))


def _passes_priority_gate(
    baseline: dict[str, Any],
    candidate: dict[str, Any],
) -> tuple[bool, str]:
    """
    작업지시 우선순위 게이트.

    - 상위 등수(1~4, 1~3)는 baseline 대비 절대 악화 금지
    - 5등 증가만으로 상위 등수 악화를 덮지 않음
    """
    b = baseline["ticket_counts"]
    c = candidate["ticket_counts"]
    b_1_4 = sum(int(b.get(t, 0)) for t in (1, 2, 3, 4))
    c_1_4 = sum(int(c.get(t, 0)) for t in (1, 2, 3, 4))
    b_1_3 = sum(int(b.get(t, 0)) for t in (1, 2, 3))
    c_1_3 = sum(int(c.get(t, 0)) for t in (1, 2, 3))
    b_hit_draws = len(baseline.get("hit_draws", []))
    c_hit_draws = len(candidate.get("hit_draws", []))
    if c_1_4 < b_1_4:
        return (
            False,
            f"기각: 1~4등 합계 악화 ({b_1_4} -> {c_1_4})",
        )
    if c_1_3 < b_1_3:
        return (
            False,
            f"기각: 1~3등 합계 악화 ({b_1_3} -> {c_1_3})",
        )
    if c_1_4 == b_1_4 and c_1_3 == b_1_3 and c_hit_draws > b_hit_draws:
        return (
            True,
            "채택(우수): 상위 등수 유지 + 당첨 누적 회차 증가 "
            f"({b_hit_draws} -> {c_hit_draws})",
        )
    return (
        True,
        "채택: 상위 등수 비악화 "
        f"(1~4등 {b_1_4}->{c_1_4}, 1~3등 {b_1_3}->{c_1_3}, "
        f"누적회차 {b_hit_draws}->{c_hit_draws})",
    )


def _apply_alternate_delta_on_regressed_sets(
    baseline_speeds: list[float],
    candidate_speeds: list[float],
    regressed_set_indexes: list[int],
    *,
    alternate_delta: float,
) -> tuple[list[float], list[int]]:
    """
    악화 세트를 기준 speed로 복구한 뒤, 반대 방향(음수) delta를 1회 적용.

    반환:
      - 조정된 speed 배열
      - 실제 반대 방향 재튜닝이 수행된 세트 번호 목록
    """
    out = list(candidate_speeds)
    adjusted: list[int] = []
    alt = abs(float(alternate_delta))
    for si in regressed_set_indexes:
        idx = si - 1
        out[idx] = baseline_speeds[idx]
        before = out[idx]
        _nudge_speed_in_place(out, idx, -alt)
        if abs(out[idx] - before) > 1e-12:
            adjusted.append(si)
    out = _normalize_strict_increasing_speeds(out)
    return out, adjusted


def _is_single_fifth_only(hits: list[tuple[int, int]]) -> bool:
    return len(hits) == 1 and hits[0][1] == 5


def _is_double_fifth_only(hits: list[tuple[int, int]]) -> bool:
    """당첨 2건이 있고 **모두 5등** (3·4등 혼재 없음). 레거시 정책용."""
    return len(hits) == 2 and hits[0][1] == 5 and hits[1][1] == 5


def _is_unhit(hits: list[tuple[int, int]]) -> bool:
    return len(hits) == 0


def _normalize_strict_increasing_speeds(speeds: list[float]) -> list[float]:
    """2자리 반올림 후 세트# 순 엄격 증가 보장."""
    out = [round(float(s), 2) for s in speeds]
    for i in range(1, 20):
        if out[i] <= out[i - 1]:
            out[i] = round(out[i - 1] + 0.01, 2)
    return out


def _nudge_speed_in_place(speeds: list[float], index: int, delta: float) -> None:
    """이웃 명목 speed 사이로 클램프하며 ``index`` 번째만 조정."""
    i = index
    speeds[i] += delta
    lo = speeds[i - 1] + 1e-3 if i > 0 else 65.0
    hi = speeds[i + 1] - 1e-3 if i < 19 else 124.0
    speeds[i] = round(max(lo, min(hi, speeds[i])), 2)


def _nudge_speeds_single_fifth_only(
    baseline_speeds: list[float],
    by_set_index: dict[int, list[tuple[int, int]]],
    *,
    delta: float = 0.35,
) -> list[float]:
    """당첨 1회·5등만인 세트: 고속 이웃 쪽으로 ``delta`` 만큼 (클램프)."""
    out = list(baseline_speeds)
    for si in range(1, 21):
        hits = by_set_index.get(si, [])
        if not _is_single_fifth_only(hits):
            continue
        i = si - 1
        _nudge_speed_in_place(out, i, delta)
    return out


def _nudge_speeds_double_fifth_only(
    baseline_speeds: list[float],
    by_set_index: dict[int, list[tuple[int, int]]],
    *,
    delta: float = 0.35,
) -> list[float]:
    """당첨 2회·**모두 5등**인 세트: 고속 이웃 쪽으로 ``delta`` 만큼 (클램프)."""
    out = list(baseline_speeds)
    for si in range(1, 21):
        hits = by_set_index.get(si, [])
        if not _is_double_fifth_only(hits):
            continue
        i = si - 1
        _nudge_speed_in_place(out, i, delta)
    return out


def _nudge_speeds_for_tune_policy(
    baseline_speeds: list[float],
    by_set_index: dict[int, list[tuple[int, int]]],
    *,
    delta: float,
    policy: Literal["double_fifth", "single_fifth", "unhit"],
) -> list[float]:
    if policy == "double_fifth":
        return _nudge_speeds_double_fifth_only(
            baseline_speeds, by_set_index, delta=delta
        )
    if policy == "unhit":
        out = list(baseline_speeds)
        for si in range(1, 21):
            hits = by_set_index.get(si, [])
            if not _is_unhit(hits):
                continue
            _nudge_speed_in_place(out, si - 1, delta)
        return out
    return _nudge_speeds_single_fifth_only(baseline_speeds, by_set_index, delta=delta)


def _baseline_scores_from_result(
    result: dict[str, Any],
    *,
    rank_weights: dict[int, int] | None = None,
) -> dict[int, int]:
    by_si: dict[int, list[tuple[int, int]]] = result["by_set_index"]
    return {
        si: _weighted_hit_score(by_si.get(si, []), rank_weights=rank_weights)
        for si in range(1, 21)
    }


def tune_reconcile_speeds(
    draw_nos: tuple[int, ...],
    *,
    seed: int,
    max_rounds: int = 12,
    delta: float = 0.35,
    alternate_delta: float | None = None,
    tune_policy: Literal["double_fifth", "single_fifth", "unhit"] = "unhit",
    rank_weights: dict[int, int] | None = None,
    start_strategy: Literal["global_top6_fixed", "previous_draw", "blended"] = "previous_draw",
    independent_wheels: bool = False,
) -> tuple[dict[str, Any], list[float], list[int]]:
    """
    작업지시: (1) 튜닝 대상 세트 speed 조정 (2) 기준 대비 악화된 세트만 롤백 후 재평가.

    - 기본(``unhit``): **미당첨 세트(당첨 0건)**.
    - ``single_fifth``: 당첨이 정확히 1건이고 5등만인 세트.
    - ``double_fifth``: 당첨 2건·모두 5등(레거시).
    - 기준 speed: 현재 ``jl_service.TWENTY_BASE_SPEEDS`` 스냅샷.
    - 악화: 해당 세트의 가중치 점수가 기준 시뮬보다 작을 때.
    반환: (최종 result, 최종 speed 리스트, 롤백된 세트# 목록(마지막 라운드 누적)).
    """
    baseline = _normalize_strict_increasing_speeds(list(TWENTY_BASE_SPEEDS))
    if len(baseline) != 20:
        raise ValueError("TWENTY_BASE_SPEEDS 길이는 20이어야 합니다.")

    random.seed(seed)
    res0 = evaluate_wheel_52(
        draw_nos, seed=seed, base_speeds=baseline, start_strategy=start_strategy,
        independent_wheels=independent_wheels,
    )
    scores0 = _baseline_scores_from_result(res0, rank_weights=rank_weights)

    candidate = _normalize_strict_increasing_speeds(
        _nudge_speeds_for_tune_policy(
            baseline, res0["by_set_index"], delta=delta, policy=tune_policy
        )
    )
    reverted_all: list[int] = []
    alt_retuned_all: list[int] = []
    alt_delta = abs(float(alternate_delta if alternate_delta is not None else delta))

    for _ in range(max_rounds):
        random.seed(seed)
        res1 = evaluate_wheel_52(
            draw_nos, seed=seed, base_speeds=candidate, start_strategy=start_strategy,
            independent_wheels=independent_wheels,
        )
        regressed = [
            si
            for si in range(1, 21)
            if _weighted_hit_score(
                res1["by_set_index"][si],
                rank_weights=rank_weights,
            )
            < scores0[si]
        ]
        if not regressed:
            if alt_retuned_all:
                res1["alt_retuned_sets"] = list(sorted(alt_retuned_all))
            return res1, candidate, reverted_all
        for si in regressed:
            if si not in reverted_all:
                reverted_all.append(si)
        reverted_all.sort()
        candidate, alt_sets = _apply_alternate_delta_on_regressed_sets(
            baseline,
            candidate,
            regressed,
            alternate_delta=alt_delta,
        )
        for si in alt_sets:
            if si not in alt_retuned_all:
                alt_retuned_all.append(si)
        alt_retuned_all.sort()

    random.seed(seed)
    res_final = evaluate_wheel_52(
        draw_nos, seed=seed, base_speeds=candidate, start_strategy=start_strategy,
        independent_wheels=independent_wheels,
    )
    if alt_retuned_all:
        res_final["alt_retuned_sets"] = list(sorted(alt_retuned_all))
    return res_final, candidate, reverted_all


def _iter_speed_grid(lo: float, hi: float, step: float) -> list[float]:
    """[lo, hi] 구간을 step 간격으로 순회 (2자리 반올림, 무한 루프 방지)."""
    if step <= 0:
        raise ValueError("step must be positive")
    out: list[float] = []
    x = round(float(lo), 2)
    end = round(float(hi), 2)
    n = 0
    while x <= end + 1e-9 and n < 20000:
        out.append(x)
        x = round(x + float(step), 2)
        n += 1
    return out


def refine_one_set_speed_grid(
    draw_nos: tuple[int, ...],
    *,
    set_index: int,
    seed: int,
    baseline_speeds: list[float] | None = None,
    step: float = 0.01,
    protect_other_sets: bool = True,
    speed_min: float | None = None,
    speed_max: float | None = None,
    start_strategy: Literal["global_top6_fixed", "previous_draw", "blended"] = "previous_draw",
    independent_wheels: bool = False,
) -> tuple[dict[str, Any], list[float], float, int]:
    """
    **한 세트**의 명목 speed만 이웃(세트#-1, 세트#+1) 사이에서 그리드 탐색해 고도화.

    - **목표**: 해당 세트의 가중치 점수를 최대화 (상위 등수 절대 우선).
    - **protect_other_sets** (기본 True): 첫 기준 평가의 다른 세트 점수보다 **어느 세트도** 나빠지지 않는 후보만 허용.
    - **동점 타이브레이크**: 해당 세트 점수가 같으면 **speed가 더 큰** 값(고속 이웃 쪽)을 택함.
    """
    if not 1 <= set_index <= 20:
        raise ValueError("set_index는 1~20이어야 합니다.")
    base = _normalize_strict_increasing_speeds(
        list(baseline_speeds) if baseline_speeds is not None else list(TWENTY_BASE_SPEEDS)
    )
    if len(base) != 20:
        raise ValueError("baseline_speeds 길이는 20이어야 합니다.")

    idx = set_index - 1
    lo = round(base[idx - 1] + 0.01, 2) if idx > 0 else 65.0
    hi = round(base[idx + 1] - 0.01, 2) if idx < 19 else 124.0
    if speed_min is not None:
        lo = max(lo, round(float(speed_min), 2))
    if speed_max is not None:
        hi = min(hi, round(float(speed_max), 2))
    if lo > hi:
        raise ValueError(f"세트#{set_index} speed 탐색 구간이 비었습니다 (lo={lo}, hi={hi}).")

    random.seed(seed)
    res0 = evaluate_wheel_52(
        draw_nos, seed=seed, base_speeds=base, start_strategy=start_strategy,
        independent_wheels=independent_wheels,
    )
    scores0 = _baseline_scores_from_result(res0)
    eval_count = 1

    best_speed = float(base[idx])
    best_score = _weighted_hit_score(res0["by_set_index"][set_index])
    best_result = res0
    best_speeds = list(base)

    for trial_sp in _iter_speed_grid(lo, hi, step):
        if abs(trial_sp - base[idx]) < 1e-9:
            continue
        cand = list(base)
        cand[idx] = trial_sp
        if cand[idx] <= base[idx - 1] + 1e-9:
            continue
        if idx < 19 and cand[idx] >= base[idx + 1] - 1e-9:
            continue

        random.seed(seed)
        res = evaluate_wheel_52(
            draw_nos, seed=seed, base_speeds=cand, start_strategy=start_strategy,
            independent_wheels=independent_wheels,
        )
        eval_count += 1

        if protect_other_sets:
            bad = False
            for si in range(1, 21):
                if si == set_index:
                    continue
                if _weighted_hit_score(res["by_set_index"][si]) < scores0[si]:
                    bad = True
                    break
            if bad:
                continue

        sc = _weighted_hit_score(res["by_set_index"][set_index])
        if sc > best_score or (
            sc == best_score and trial_sp > best_speed
        ):
            best_score = sc
            best_speed = trial_sp
            best_result = res
            best_speeds = cand

    best_speeds = _normalize_strict_increasing_speeds(best_speeds)
    random.seed(seed)
    best_result = evaluate_wheel_52(
        draw_nos, seed=seed, base_speeds=best_speeds, start_strategy=start_strategy,
        independent_wheels=independent_wheels,
    )
    eval_count += 1
    return best_result, best_speeds, best_speed, eval_count


def refine_one_set_offset_search(
    draw_nos: tuple[int, ...],
    *,
    set_index: int,
    seed: int,
    search_range: int = 5,
    full_search: bool = False,
    protect_other_sets: bool = True,
    start_strategy: Literal["global_top6_fixed", "previous_draw", "blended"] = "previous_draw",
    independent_wheels: bool = False,
    rank_weights: dict[int, int] | None = None,
) -> tuple[dict[str, Any], list[int], int, list[dict[str, Any]]]:
    """
    워크플로우 Step 2~3: 세트#N의 offset을 정수 공간(0~44)에서 체계적으로 탐색.

    분석 내용:
    - 2-1. 후보 공간 정의: 국소(±search_range) 또는 전체(0~44)
    - 2-2. 방향성 연구: +1 vs -1 비교
    - 2-3. 범위/제약 연구: 이웃 세트 충돌, 다른 세트 점수 보호

    반환:
    - best_result: 최적 offset의 52회차 평가 결과
    - best_offsets: 최적 offset 배열 (20개)
    - best_offset: 세트#N의 최적 offset 값
    - analysis: 각 후보별 분석 리스트
    """
    if not 1 <= set_index <= 20:
        raise ValueError("set_index는 1~20이어야 합니다.")

    idx = set_index - 1
    base_offsets = list(TWENTY_BASE_OFFSETS)
    current_offset = base_offsets[idx]
    weights = rank_weights or DEFAULT_RANK_WEIGHTS

    random.seed(seed)
    res0 = evaluate_wheel_52(
        draw_nos, seed=seed, base_offsets=base_offsets,
        start_strategy=start_strategy, independent_wheels=independent_wheels,
    )
    scores0 = _baseline_scores_from_result(res0, rank_weights=weights)
    baseline_score = _weighted_hit_score(res0["by_set_index"][set_index], rank_weights=weights)
    baseline_counts = _per_set_hit_counts(res0["by_set_index"][set_index])
    eval_count = 1

    if full_search:
        candidates = [o for o in range(45) if o != current_offset]
    else:
        seen: set[int] = set()
        candidates = []
        for delta in range(1, search_range + 1):
            for sign in [1, -1]:
                c = (current_offset + sign * delta) % 45
                if c not in seen and c != current_offset:
                    seen.add(c)
                    candidates.append(c)

    neighbor_offsets = []
    if idx > 0:
        neighbor_offsets.append(base_offsets[idx - 1])
    if idx < 19:
        neighbor_offsets.append(base_offsets[idx + 1])

    analysis: list[dict[str, Any]] = []
    best_offset = current_offset
    best_score = baseline_score
    best_result = res0
    best_offsets = list(base_offsets)

    for trial_offset in candidates:
        trial_offsets = list(base_offsets)
        trial_offsets[idx] = trial_offset

        random.seed(seed)
        res = evaluate_wheel_52(
            draw_nos, seed=seed, base_offsets=trial_offsets,
            start_strategy=start_strategy, independent_wheels=independent_wheels,
        )
        eval_count += 1

        sc = _weighted_hit_score(res["by_set_index"][set_index], rank_weights=weights)
        counts = _per_set_hit_counts(res["by_set_index"][set_index])
        total_hits_all = sum(res["ticket_counts"].values())

        passed = True
        fail_reason = ""
        if protect_other_sets:
            for si in range(1, 21):
                if si == set_index:
                    continue
                if _weighted_hit_score(res["by_set_index"][si], rank_weights=weights) < scores0[si]:
                    passed = False
                    fail_reason = f"세트#{si} 점수 악화"
                    break

        neighbor_min_dist = 45
        if neighbor_offsets:
            for no in neighbor_offsets:
                d = min((trial_offset - no) % 45, (no - trial_offset) % 45)
                neighbor_min_dist = min(neighbor_min_dist, d)

        if passed:
            if sc > best_score:
                best_score = sc
                best_offset = trial_offset
                best_result = res
                best_offsets = list(trial_offsets)
            elif sc == best_score and trial_offset != current_offset:
                cur_min_dist = 45
                if neighbor_offsets:
                    for no in neighbor_offsets:
                        d = min((best_offset - no) % 45, (no - best_offset) % 45)
                        cur_min_dist = min(cur_min_dist, d)
                if neighbor_min_dist > cur_min_dist:
                    best_offset = trial_offset
                    best_result = res
                    best_offsets = list(trial_offsets)

        signed_delta = trial_offset - current_offset
        if signed_delta > 22:
            signed_delta -= 45
        elif signed_delta < -22:
            signed_delta += 45

        if not passed:
            reason = f"보호위반({fail_reason})"
        elif sc > baseline_score:
            reason = "개선"
        elif sc == baseline_score:
            reason = "유지"
        else:
            reason = "악화"

        analysis.append({
            "offset": trial_offset,
            "delta": signed_delta,
            "score": sc,
            "counts": counts,
            "total_hits": sum(counts.values()),
            "total_hits_all": total_hits_all,
            "neighbor_min_dist": neighbor_min_dist,
            "passed": passed,
            "reason": reason,
        })

    analysis.sort(key=lambda x: x["offset"])

    return best_result, best_offsets, best_offset, analysis


def _format_offset_analysis(
    set_index: int,
    current_offset: int,
    baseline_counts: dict[int, int],
    baseline_score: int,
    best_offset: int,
    analysis: list[dict[str, Any]],
    neighbor_offsets: list[int],
    eval_count: int,
) -> str:
    """워크플로우 Step 2~3 분석 보고서를 마크다운 형식으로 생성."""
    lines: list[str] = []
    lines.append(f"[방향 1] 세트#{set_index} Offset 파라미터 분석")
    lines.append("=" * 50)
    lines.append("")

    lines.append("▶ 현재 상태 (Baseline)")
    lines.append(f"  - 현재 offset: {current_offset}")
    lines.append(f"  - 이웃 세트 offset: {neighbor_offsets}")
    b = baseline_counts
    lines.append(
        f"  - Baseline: 3등 {b.get(3, 0)} / 4등 {b.get(4, 0)} / 5등 {b.get(5, 0)} "
        f"/ 합계 {sum(b.values())} / 가중점수 {baseline_score}"
    )
    lines.append("")

    passed_list = [a for a in analysis if a["passed"]]
    blocked_count = len(analysis) - len(passed_list)
    lines.append("▶ 2-1. 후보 공간 정의")
    if len(analysis) >= 44:
        lines.append(f"  - 탐색 범위: 0~44 전체 (후보 {len(analysis)}개)")
    else:
        deltas = [a["delta"] for a in analysis]
        lo_d = min(deltas) if deltas else 0
        hi_d = max(deltas) if deltas else 0
        lines.append(f"  - 탐색 범위: offset {current_offset}{lo_d:+d}~{current_offset}{hi_d:+d} (후보 {len(analysis)}개)")
    lines.append(f"  - 다른 세트 보호 위반으로 제외: {blocked_count}개")
    lines.append(f"  - 유효 후보: {len(passed_list)}개")
    lines.append(f"  - 총 평가 횟수: {eval_count}회")
    lines.append("")

    plus1 = [a for a in analysis if a["delta"] == 1]
    minus1 = [a for a in analysis if a["delta"] == -1]
    lines.append("▶ 2-2. 방향성 연구 (+1 vs -1)")
    if plus1:
        a = plus1[0]
        lines.append(f"  offset {a['offset']} (+1): 가중점수 {a['score']}, "
                      f"3등 {a['counts'].get(3,0)} / 4등 {a['counts'].get(4,0)} / 5등 {a['counts'].get(5,0)} "
                      f"→ {a['reason']}")
    if minus1:
        a = minus1[0]
        lines.append(f"  offset {a['offset']} (-1): 가중점수 {a['score']}, "
                      f"3등 {a['counts'].get(3,0)} / 4등 {a['counts'].get(4,0)} / 5등 {a['counts'].get(5,0)} "
                      f"→ {a['reason']}")
    if plus1 and minus1:
        p, m = plus1[0], minus1[0]
        if p["score"] > m["score"]:
            lines.append("  → +1 방향이 우세")
        elif m["score"] > p["score"]:
            lines.append("  → -1 방향이 우세")
        else:
            lines.append("  → 동점 (이웃 세트 충돌 거리로 판단)")
    lines.append("")

    lines.append("▶ 2-3. 범위/제약 연구 (이웃 세트 offset 충돌)")
    for no in neighbor_offsets:
        lines.append(f"  - 이웃 offset {no}: 현재값과 거리 = {min((current_offset - no) % 45, (no - current_offset) % 45)}")
    lines.append("")

    lines.append("▶ 후보별 52회차 평가 결과")
    lines.append(f"  | {'offset':>6} | {'delta':>5} | {'3등':>3} | {'4등':>3} | {'5등':>3} | {'합계':>4} | {'가중점수':>8} | {'이웃거리':>6} | {'판정':<12} |")
    lines.append(f"  |{'-'*8}|{'-'*7}|{'-'*5}|{'-'*5}|{'-'*5}|{'-'*6}|{'-'*10}|{'-'*8}|{'-'*14}|")
    baseline_entry = {
        "offset": current_offset, "delta": 0, "score": baseline_score,
        "counts": baseline_counts, "total_hits": sum(baseline_counts.values()),
        "neighbor_min_dist": min(
            min((current_offset - no) % 45, (no - current_offset) % 45) for no in neighbor_offsets
        ) if neighbor_offsets else 45,
        "passed": True, "reason": "★현재값",
    }
    all_entries = sorted(analysis + [baseline_entry], key=lambda x: x["offset"])
    for a in all_entries:
        c = a["counts"]
        marker = " ★" if a["offset"] == best_offset and a["offset"] != current_offset else ""
        lines.append(
            f"  | {a['offset']:>6} | {a['delta']:>+5d} | {c.get(3,0):>3} | {c.get(4,0):>3} | {c.get(5,0):>3} "
            f"| {a['total_hits']:>4} | {a['score']:>8} | {a['neighbor_min_dist']:>6} | {a['reason']:<12}{marker} |"
        )
    lines.append("")

    lines.append("▶ 최적 offset 선정")
    if best_offset == current_offset:
        lines.append(f"  - 추천: 현재값 유지 (offset {current_offset})")
        lines.append("  - 근거: 유효 후보 중 현재값보다 우수한 offset이 없음")
    else:
        best_a = next((a for a in analysis if a["offset"] == best_offset), None)
        lines.append(f"  - 추천 offset: {best_offset} (현재 {current_offset} → {best_offset}, delta {best_offset - current_offset:+d})")
        if best_a:
            bc = best_a["counts"]
            lines.append(
                f"  - 근거: 가중점수 {baseline_score} → {best_a['score']}, "
                f"3등 {baseline_counts.get(3,0)}→{bc.get(3,0)} / "
                f"4등 {baseline_counts.get(4,0)}→{bc.get(4,0)} / "
                f"5등 {baseline_counts.get(5,0)}→{bc.get(5,0)}"
            )
            lines.append(f"  - 이웃 세트 offset 거리: {best_a['neighbor_min_dist']}")
    lines.append("")

    return "\n".join(lines)


def _speed_for_target_offset(
    target_offset: int, neighbor_lo: float, neighbor_hi: float
) -> float | None:
    """target_offset(0~44)을 만드는 speed를 neighbor_lo~neighbor_hi 사이에서 찾는다."""
    k = FIXED_STOP_TIME / 2.0
    for n in range(200):
        speed = (target_offset + 45 * n) / k
        if speed < neighbor_lo - 0.1:
            continue
        if speed > neighbor_hi + 0.1:
            break
        actual = int(speed * k) % 45
        if actual == target_offset and neighbor_lo < speed < neighbor_hi:
            return round(speed, 2)
    return None


def refine_all_sets_speed_grid(
    draw_nos: tuple[int, ...],
    *,
    seed: int,
    baseline_speeds: list[float] | None = None,
    step: float = 0.5,
    speed_min: float = 75.0,
    speed_max: float = 130.0,
    start_strategy: Literal["global_top6_fixed", "previous_draw", "blended"] = "previous_draw",
    independent_wheels: bool = False,
) -> tuple[dict[str, Any], list[float], int]:
    """
    세트#1~20을 순차로 1회씩 그리드 탐색.

    - 각 세트는 ``speed_min~speed_max``와 이웃 세트 경계의 교집합에서 탐색
    - 다른 세트 점수 보호(`protect_other_sets=True`)
    """
    current = _normalize_strict_increasing_speeds(
        list(baseline_speeds) if baseline_speeds is not None else list(TWENTY_BASE_SPEEDS)
    )
    if len(current) != 20:
        raise ValueError("baseline_speeds 길이는 20이어야 합니다.")

    total_eval = 0
    result = evaluate_wheel_52(
        draw_nos, seed=seed, base_speeds=current, start_strategy=start_strategy,
        independent_wheels=independent_wheels,
    )
    total_eval += 1
    for si in range(1, 21):
        result, current, _, n_eval = refine_one_set_speed_grid(
            draw_nos,
            set_index=si,
            seed=seed,
            baseline_speeds=current,
            step=step,
            protect_other_sets=True,
            speed_min=speed_min,
            speed_max=speed_max,
            start_strategy=start_strategy,
            independent_wheels=independent_wheels,
        )
        total_eval += n_eval
    return result, current, total_eval


def evaluate_wheel_52(
    draw_nos: tuple[int, ...],
    *,
    num_sets: int = NUM_SETS_PER_DRAW,
    seed: int | None = None,
    base_speeds: list[float] | None = None,
    base_offsets: list[int] | None = None,
    start_strategy: Literal["global_top6_fixed", "previous_draw", "blended"] = "previous_draw",
    independent_wheels: bool = False,
    combo_filter: bool = False,
) -> dict[str, Any]:
    if len(draw_nos) != REQUIRED_DRAW_COUNT:
        raise ValueError(
            f"회차 개수는 정확히 {REQUIRED_DRAW_COUNT}개여야 합니다 (현재 {len(draw_nos)}개)."
        )
    if num_sets != 20:
        raise ValueError("JL 분석은 회차당 20세트 고정입니다.")

    if seed is not None:
        random.seed(seed)

    conn = get_connection()
    cursor = conn.cursor()
    ph = ",".join("?" * len(draw_nos))
    cursor.execute(
        f"""
        SELECT draw_no, num1, num2, num3, num4, num5, num6, bonus_num
        FROM lotto_winners
        WHERE draw_no IN ({ph})
        ORDER BY draw_no
        """,
        draw_nos,
    )
    winners: dict[int, tuple[set[int], int]] = {}
    for r in cursor.fetchall():
        d = dict(r)
        dn = int(d["draw_no"])
        main = {d["num1"], d["num2"], d["num3"], d["num4"], d["num5"], d["num6"]}
        winners[dn] = (main, int(d.get("bonus_num") or 0))
    conn.close()

    ticket_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    match_distribution_total: dict[int, int] = {k: 0 for k in range(0, 7)}
    match_distribution_by_set: dict[int, dict[int, int]] = {
        i: {k: 0 for k in range(0, 7)} for i in range(1, 21)
    }
    total_tickets = 0
    per_draw: dict[int, dict[int, int]] = {}
    hit_draws: list[tuple[int, int]] = []
    hit_rows: list[dict[str, Any]] = []
    by_set_index: dict[int, list[tuple[int, int]]] = {i: [] for i in range(1, 21)}
    top6_by_draw: dict[int, list[int]] = {}
    up_to = max(draw_nos)
    latest_top6 = get_global_top6_frequency_starts(up_to)
    if base_offsets is not None:
        offsets_used = [int(x) % 45 for x in list(base_offsets)]
    elif base_speeds is not None:
        speeds_used = _normalize_strict_increasing_speeds(list(base_speeds))
        offsets_used = _offsets_from_base_speeds(speeds_used)
    else:
        offsets_used = [int(x) % 45 for x in list(TWENTY_BASE_OFFSETS)]
    if len(offsets_used) != 20:
        raise ValueError("base_offsets 는 길이 20의 offset 리스트여야 합니다.")

    for dn in draw_nos:
        if dn not in winners:
            continue
        main, bonus = winners[dn]
        if start_strategy == "global_top6_fixed":
            start6 = latest_top6
        elif start_strategy == "previous_draw":
            start6 = get_previous_draw_winning_starts(dn)
        else:
            start6 = get_blended_start_nums(dn)
        sets_rows = generate_jl_wheel_sets(
            dn,
            count=num_sets,
            start_index=0,
            fixed_start_nums=start6,
            offsets=offsets_used,
            dedup_across_sets=True,
            independent_wheels=independent_wheels,
            combo_filter=combo_filter,
        )
        if sets_rows:
            t0 = sets_rows[0].get("top6_starts")
            if isinstance(t0, list):
                top6_by_draw[dn] = [int(x) for x in t0]
        dc = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        best: int | None = None
        for row in sets_rows:
            total_tickets += 1
            s = _ticket_row_to_set(row)
            match_count = len(main.intersection(s))
            rnk = rank_lotto_ticket(main, bonus, s)
            si = int(row["set_index"])
            off = int(row.get("profile_offset", 0))
            sp = float(row.get("profile_speed", 0.0))
            dec = float(row.get("profile_deceleration", 0.0))
            match_distribution_total[match_count] += 1
            match_distribution_by_set[si][match_count] += 1

            if rnk is not None:
                ticket_counts[rnk] += 1
                dc[rnk] += 1
                if best is None or rnk < best:
                    best = rnk
                hit_rows.append(
                    {
                        "draw_no": dn,
                        "set_index": si,
                        "offset": off,
                        "speed": sp,
                        "deceleration": dec,
                        "rank": rnk,
                        "picked": _fmt_nums(s),
                        "winning": _fmt_nums(main),
                        "bonus": bonus,
                    }
                )
                by_set_index[si].append((dn, rnk))
        per_draw[dn] = dc
        if best is not None:
            hit_draws.append((dn, best))

    draws_per_tier = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for dn, dc in per_draw.items():
        for t in (1, 2, 3, 4, 5):
            if dc[t] > 0:
                draws_per_tier[t] += 1

    theo = _theoretical_single_ticket_probs()
    expected = {t: theo[t] * total_tickets for t in (1, 2, 3, 4, 5)}
    avg_match = (
        sum(match * cnt for match, cnt in match_distribution_total.items()) / total_tickets
        if total_tickets > 0
        else 0.0
    )

    return {
        "draw_nos": draw_nos,
        "num_draws": len(per_draw),
        "num_sets_per_draw": num_sets,
        "total_tickets": total_tickets,
        "ticket_counts": ticket_counts,
        "per_draw": per_draw,
        "hit_draws": hit_draws,
        "draws_per_tier": draws_per_tier,
        "theoretical_per_ticket": theo,
        "expected_counts": expected,
        "match_distribution_total": match_distribution_total,
        "match_distribution_by_set": match_distribution_by_set,
        "avg_match": avg_match,
        "total_combos": math.comb(45, 6),
        "hit_rows": hit_rows,
        "by_set_index": by_set_index,
        "top6_by_draw": top6_by_draw,
        "latest_top6_starts": latest_top6,
        "eval_max_draw_no": up_to,
        "fixed_top6_starts": latest_top6,
        "fixed_top6_up_to_draw": up_to,
        "nominal_base_offsets": offsets_used,
        "start_strategy": start_strategy,
        "independent_wheels": independent_wheels,
    }


def _format_report(result: dict[str, Any], seed: int | None) -> str:
    lines: list[str] = []
    lines.append("# JL 휠 시뮬레이션 52회차 × 20세트 당첨 빈도 보고서")
    lines.append("")
    lines.append(f"- 생성 시각(UTC): {datetime.now(timezone.utc).isoformat()}")
    lines.append(
        f"- 검증 회차: **{result['draw_nos'][0]}~{result['draw_nos'][-1]}** (총 **{REQUIRED_DRAW_COUNT}개 회차**)"
    )
    up = result.get("eval_max_draw_no") or result.get("fixed_top6_up_to_draw")
    latest = result.get("latest_top6_starts") or result.get("fixed_top6_starts")
    strategy = result.get("start_strategy", "global_top6_fixed")
    if isinstance(latest, list) and latest and up is not None:
        if strategy == "global_top6_fixed":
            lines.append(
                f"- 시작번호 전략: **global_top6_fixed** — 평가 구간 상한 **{up}**회 기준 "
                f"**1~{up}회차** 본번호 누적 합 상위 6개: **{', '.join(str(int(x)) for x in latest)}** "
                f"(모든 평가 회차에 동일 적용)"
            )
        elif strategy == "previous_draw":
            lines.append("- 시작번호 전략: **previous_draw** — 각 회차 직전 당첨 본번호 6개 사용")
        else:
            lines.append("- 시작번호 전략: **blended** — 직전 회차 + 핫번호 + 과숙번호 가중 블렌딩")
    else:
        lines.append("- 시작번호 전략: 결과 객체 `start_strategy`/`top6_by_draw` 참고")
    nom = result.get("nominal_base_offsets")
    offset_note = (
        "이번 실행 기준 offset (`result['nominal_base_offsets']`)"
        if isinstance(nom, list) and len(nom) == 20
        else "`jl_service.TWENTY_BASE_OFFSETS`"
    )
    lines.append(f"- 세트별 기준값: **20단계 offset** ({offset_note})")
    lines.append(f"- 회차당 생성 세트 수: **{result['num_sets_per_draw']}**")
    lines.append(f"- 비교한 총 게임 수: **{result['total_tickets']}** (= 52 × 20)")
    lines.append(f"- 평균 매치 수(본번호 6개 기준): **{result.get('avg_match', 0.0):.4f}**")
    if seed is not None:
        lines.append(f"- 난수 시드: `{seed}` (재현용, 중복 재시도 지터에만 영향)")
    lines.append("")
    lines.append("## 1. 요약")
    lines.append("")
    lines.append("| 등수 | 당첨 세트 수 | 이론 기대값(동일 게임 수) |")
    lines.append("|------|-------------|---------------------------|")
    theo = result["theoretical_per_ticket"]
    exp = result["expected_counts"]
    tc = result["ticket_counts"]
    for t in (1, 2, 3, 4, 5):
        lines.append(f"| {t}등 | {tc[t]} | {exp[t]:.4f} |")
    any_hit = sum(tc.values())
    lines.append(f"| **합계 (1~5등)** | **{any_hit}** | **{sum(exp.values()):.4f}** |")
    lines.append("")
    lines.append("### 관측 당첨률 (세트 1장 기준, 경험적)")
    lines.append("")
    n = result["total_tickets"]
    for t in (1, 2, 3, 4, 5):
        p_obs = tc[t] / n if n else 0.0
        lines.append(f"- **{t}등**: {p_obs:.6%} (관측 {tc[t]}/{n}), 이론 {theo[t]:.6%}")
    lines.append("")
    lines.append(f"- **임의 1게임당 1~5등 합산 이론확률**: {sum(theo.values()):.6%}")
    lines.append(f"- **총 {n}게임 중 1~5등 적중 세트 수**: {any_hit}")
    lines.append("")
    md = result.get("match_distribution_total", {})
    if md:
        lines.append("### 매치 수 분포 (본번호 6개 일치 개수)")
        lines.append("")
        lines.append("| 매치 수 | 세트 수 | 비율(%) |")
        lines.append("|---------|---------|---------|")
        total_tickets = max(1, int(result["total_tickets"]))
        for m in range(6, -1, -1):
            cnt = int(md.get(m, 0))
            pct = (cnt / total_tickets) * 100.0
            lines.append(f"| {m}개 | {cnt} | {pct:.4f}% |")
        lines.append("")
    lines.append("## 2. 등수별 '해당 등수 당첨 세트가 있었던 회차' 수")
    lines.append("")
    lines.append("(각 회차 20세트 중 **그 등수**로 당첨된 세트가 1장 이상인 회차만 카운트합니다.)")
    lines.append("")
    dpt = result["draws_per_tier"]
    lines.append("| 등수 | 회차 수 |")
    lines.append("|------|---------|")
    for t in (1, 2, 3, 4, 5):
        lines.append(f"| {t}등 발생 회차 | {dpt[t]} |")
    lines.append("")
    lines.append(
        f"- **어떤 등수로든 당첨 세트가 1장 이상 나온 회차**: {len(result['hit_draws'])} / {REQUIRED_DRAW_COUNT}"
    )
    lines.append("")
    lines.append("## 3. 이론값 참고")
    lines.append("")
    lines.append(f"- 전체 조합 수 C(45,6) = **{result['total_combos']:,}**")
    lines.append("- 단일 무작위 6번호 세트의 등수별 당첨 조합 수: 1등 1, 2등 6, 3등 228, 4등 11,115, 5등 182,780")
    lines.append("")
    lines.append("## 4. 회차별 당첨 세트 수 (20세트 중)")
    lines.append("")
    lines.append("| 회차 | 1등 | 2등 | 3등 | 4등 | 5등 | 합계 |")
    lines.append("|------|-----|-----|-----|-----|-----|------|")
    for dn in result["draw_nos"]:
        if dn not in result["per_draw"]:
            continue
        dc = result["per_draw"][dn]
        sm = sum(dc[t] for t in (1, 2, 3, 4, 5))
        lines.append(
            f"| {dn} | {dc[1]} | {dc[2]} | {dc[3]} | {dc[4]} | {dc[5]} | {sm} |"
        )
    lines.append("")
    lines.append("> 로또는 난수 추첨입니다. 본 보고서는 시뮬레이션·통계 참고용이며 당첨을 보장하지 않습니다.")
    lines.append("")
    return "\n".join(lines)


def _format_history_md(result: dict[str, Any], seed: int | None) -> str:
    """
    당첨 이력 고정 양식만 출력 (파일 전체 덮어쓰기).
    표의 speed/decel은 공정 비교용 **명목 프로파일** (BASE speed 및 speed/FIXED_STOP_TIME).
    """
    by_si: dict[int, list[tuple[int, int]]] = result["by_set_index"]
    distinct_draws: set[int] = set()
    tier_hits = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for si in range(1, 21):
        for dn, rnk in by_si.get(si, []):
            distinct_draws.add(dn)
            if rnk in tier_hits:
                tier_hits[rnk] += 1

    lines: list[str] = []
    lines.append("## 2. 오프셋 프로파일(세트#)별 당첨 이력")
    lines.append("")
    lines.append(f"당첨 누적 회차 : {len(distinct_draws)}회")
    for t in (1, 2, 3, 4, 5):
        lines.append(f"{t}등 : {tier_hits[t]}번")
    lines.append("")
    lines.append("| 세트# | offset | 회차(등수) |")
    lines.append("|-------|--------|------------|")
    nominal = result.get("nominal_base_offsets")
    offset_row = list(nominal) if isinstance(nominal, list) and len(nominal) == 20 else list(TWENTY_BASE_OFFSETS)
    for si in range(1, 21):
        off = int(offset_row[si - 1]) % 45
        hits = by_si.get(si, [])
        if not hits:
            cell = "-"
        else:
            parts = [f"{dn}({rnk}등)" for dn, rnk in hits]
            cell = ", ".join(parts)
        lines.append(f"| {si} | {off} | {cell} |")
    lines.append("")
    _ = seed
    return "\n".join(lines)


def _configure_stdio_utf8() -> None:
    """Windows 기본 콘솔(cp949)에서 마크다운 출력 시 UnicodeEncodeError 방지."""
    for stream in (sys.stdout, sys.stderr):
        reconf = getattr(stream, "reconfigure", None)
        if callable(reconf):
            try:
                reconf(encoding="utf-8", errors="replace")
            except (AttributeError, OSError, ValueError, TypeError):
                pass


def main() -> None:
    _configure_stdio_utf8()
    parser = argparse.ArgumentParser(
        description="JL 휠: 52개 회차 × 회차당 20세트 당첨 비교 보고",
    )
    parser.add_argument("--seed", type=int, default=None, help="재현용 난수 시드")
    parser.add_argument(
        "--start-strategy",
        choices=["global_top6_fixed", "previous_draw", "blended"],
        default="previous_draw",
        help="시작번호 전략 (기본: previous_draw — 직전 회차 당첨번호)",
    )
    parser.add_argument(
        "--write-report",
        type=str,
        default=None,
        metavar="PATH",
        help="요약 보고서 Markdown 경로",
    )
    parser.add_argument(
        "--write-history",
        type=str,
        default="features/analysis/scripts/당첨 이력.md",
        metavar="PATH",
        help="당첨 이력 상세 Markdown 경로 (기본: features/analysis/scripts/당첨 이력.md)",
    )
    parser.add_argument("--no-history", action="store_true", help="당첨 이력 파일 생략")
    parser.add_argument("--draw-start", type=int, default=None, metavar="N")
    parser.add_argument("--draw-end", type=int, default=None, metavar="N")
    parser.add_argument(
        "--tune-reconcile",
        action="store_true",
        help="5등 1회만(기본) 또는 2회만(옵션) 세트 speed 1차 조정 후, 악화 세트는 롤백+반대방향 2차 재튜닝 (--seed 권장)",
    )
    parser.add_argument(
        "--tune-double-fifth",
        action="store_true",
        help="--tune-reconcile 시 대상을 '5등 2회만' 세트로 변경 (기본은 5등 1회만)",
    )
    parser.add_argument(
        "--tune-unhit",
        action="store_true",
        help="--tune-reconcile 시 대상을 미당첨(0건) 세트로 설정 (기본값)",
    )
    parser.add_argument(
        "--tune-delta",
        type=float,
        default=0.35,
        help="--tune-reconcile 시 튜닝 대상 세트에 더할 speed (기본 0.35, 필요 시 0.15)",
    )
    parser.add_argument(
        "--tune-alt-delta",
        type=float,
        default=None,
        help="--tune-reconcile 악화 세트의 반대방향 2차 재튜닝 폭(기본: --tune-delta와 동일)",
    )
    parser.add_argument(
        "--refine-set",
        type=int,
        default=None,
        metavar="N",
        help="세트# N 명목 speed만 이웃 구간에서 그리드 탐색(다른 세트는 기준 대비 악화 불가). --tune-reconcile 보다 우선",
    )
    parser.add_argument(
        "--refine-step",
        type=float,
        default=0.01,
        help="--refine-set 그리드 간격 (기본 0.01)",
    )
    parser.add_argument(
        "--refine-min-speed",
        type=float,
        default=None,
        help="--refine-set 탐색 최소 speed (미지정 시 이웃 경계만 사용)",
    )
    parser.add_argument(
        "--refine-max-speed",
        type=float,
        default=None,
        help="--refine-set 탐색 최대 speed (미지정 시 이웃 경계만 사용)",
    )
    parser.add_argument(
        "--refine-all",
        action="store_true",
        help="세트#1~20 전체를 순차 그리드 탐색(--refine-step 권장: 0.25~0.5)",
    )
    parser.add_argument(
        "--refine-offset",
        type=int,
        default=None,
        metavar="N",
        help="세트#N의 offset을 정수 공간(0~44)에서 체계적으로 탐색 (워크플로우 Step 2~3)",
    )
    parser.add_argument(
        "--offset-range",
        type=int,
        default=5,
        metavar="R",
        help="--refine-offset 탐색 범위 ±R (기본: 5)",
    )
    parser.add_argument(
        "--offset-full",
        action="store_true",
        help="--refine-offset 시 0~44 전체 탐색",
    )
    parser.add_argument(
        "--independent-wheels",
        action="store_true",
        help="6휠 독립 speed 모드: 각 휠이 서로 다른 speed로 회전하여 별자리 제약 해소",
    )
    parser.add_argument(
        "--combo-filter",
        action="store_true",
        help="조합 필터(합계/홀짝/고저) 적용: 비현실적 조합을 offset 조정으로 재생성",
    )
    args = parser.parse_args()

    draw_nos: tuple[int, ...]
    if args.draw_start is not None or args.draw_end is not None:
        if args.draw_start is None or args.draw_end is None:
            print("오류: --draw-start 와 --draw-end 를 함께 지정하세요.", file=sys.stderr)
            sys.exit(2)
        if args.draw_end < args.draw_start:
            print("오류: --draw-end >= --draw-start 여야 합니다.", file=sys.stderr)
            sys.exit(2)
        draw_nos = tuple(range(args.draw_start, args.draw_end + 1))
        if len(draw_nos) != REQUIRED_DRAW_COUNT:
            print(
                f"오류: 회차 구간 길이는 정확히 {REQUIRED_DRAW_COUNT}개여야 합니다 (현재 {len(draw_nos)}개).",
                file=sys.stderr,
            )
            sys.exit(2)
    else:
        draw_nos = fetch_latest_draw_nos_ascending(REQUIRED_DRAW_COUNT)

    print(f"[JL 휠] {REQUIRED_DRAW_COUNT}개 회차 × 회차당 {NUM_SETS_PER_DRAW}세트 평가 중...")
    print(f"  회차 범위: {draw_nos[0]} ~ {draw_nos[-1]}")
    if args.refine_offset is not None:
        seed_ro = args.seed if args.seed is not None else 42
        si = int(args.refine_offset)
        idx = si - 1
        base_offsets = list(TWENTY_BASE_OFFSETS)
        current_off = base_offsets[idx]

        neighbor_offs: list[int] = []
        if idx > 0:
            neighbor_offs.append(base_offsets[idx - 1])
        if idx < 19:
            neighbor_offs.append(base_offsets[idx + 1])

        random.seed(seed_ro)
        res_baseline = evaluate_wheel_52(
            draw_nos, seed=seed_ro, base_offsets=base_offsets,
            start_strategy=args.start_strategy,
            independent_wheels=args.independent_wheels,
        )
        bl_counts = _per_set_hit_counts(res_baseline["by_set_index"][si])
        bl_score = _weighted_hit_score(res_baseline["by_set_index"][si])

        result, best_offsets, best_off, analysis = refine_one_set_offset_search(
            draw_nos,
            set_index=si,
            seed=seed_ro,
            search_range=int(args.offset_range),
            full_search=args.offset_full,
            start_strategy=args.start_strategy,
            independent_wheels=args.independent_wheels,
        )

        report = _format_offset_analysis(
            si, current_off, bl_counts, bl_score,
            best_off, analysis, neighbor_offs,
            eval_count=len(analysis) + 1,
        )
        print(report)

        if best_off != current_off:
            lo_sp = TWENTY_BASE_SPEEDS[idx - 1] + 0.01 if idx > 0 else 65.0
            hi_sp = TWENTY_BASE_SPEEDS[idx + 1] - 0.01 if idx < 19 else 124.0
            new_speed = _speed_for_target_offset(best_off, lo_sp, hi_sp)
            if new_speed is not None:
                print(f"  [채택 안내] offset {current_off} → {best_off}")
                print(f"  [코드 반영] _JITTER_BASE_SPEEDS[{idx}]: {TWENTY_BASE_SPEEDS[idx]} → {new_speed}")
                try:
                    _persist_offset_speed_update(
                        set_index_1based=si,
                        new_offset=int(best_off),
                        new_speed=float(new_speed),
                    )
                    print(
                        f"  [파일 반영 완료] 세트#{si} offset={int(best_off)}, speed={float(new_speed)} "
                        f"-> {JL_SERVICE_FILE}"
                    )
                except Exception as e:
                    print(f"  [파일 반영 실패] {e}", file=sys.stderr)
            else:
                print(f"  [주의] offset {best_off}에 대응하는 speed를 {lo_sp}~{hi_sp} 범위에서 찾지 못했습니다.")
        else:
            print("  [결론] 현재 offset이 최적이므로 변경 불필요.")

    elif args.refine_all:
        seed_rf = args.seed if args.seed is not None else 42
        min_sp = args.refine_min_speed if args.refine_min_speed is not None else 75.0
        max_sp = args.refine_max_speed if args.refine_max_speed is not None else 130.0
        result, final_speeds, n_eval = refine_all_sets_speed_grid(
            draw_nos,
            seed=seed_rf,
            step=float(args.refine_step),
            speed_min=float(min_sp),
            speed_max=float(max_sp),
            start_strategy=args.start_strategy,
            independent_wheels=args.independent_wheels,
        )
        print(
            f"  [--refine-all] 범위 {min_sp}~{max_sp}, step={args.refine_step}, "
            f"총 평가 약 {n_eval}회"
        )
        norm_mod = _normalize_strict_increasing_speeds(list(TWENTY_BASE_SPEEDS))
        if final_speeds != norm_mod:
            print(
                "  [참고] 최종 명목 speed가 모듈과 다릅니다. `jl_service.TWENTY_BASE_SPEEDS` 를 아래에 맞추면 재현됩니다:"
            )
            print("  TWENTY_BASE_SPEEDS = [")
            print("    " + ",\n    ".join(f"{x}" for x in final_speeds))
            print("  ]")
    elif args.refine_set is not None:
        if args.tune_reconcile:
            print(
                "  (--refine-set 지정: --tune-reconcile 은 건너뜁니다.)",
                file=sys.stderr,
            )
        seed_rf = args.seed if args.seed is not None else 42
        if args.seed is None:
            print(f"  (--refine-set: 시드 미지정 → {seed_rf} 사용)")
        result, final_speeds, chosen_sp, n_eval = refine_one_set_speed_grid(
            draw_nos,
            set_index=int(args.refine_set),
            seed=seed_rf,
            step=float(args.refine_step),
            speed_min=args.refine_min_speed,
            speed_max=args.refine_max_speed,
            start_strategy=args.start_strategy,
            independent_wheels=args.independent_wheels,
        )
        print(
            f"  [--refine-set #{args.refine_set}] 그리드 평가 약 {n_eval}회, "
            f"선택 명목 speed={chosen_sp}"
        )
        norm_mod = _normalize_strict_increasing_speeds(list(TWENTY_BASE_SPEEDS))
        if final_speeds != norm_mod:
            print(
                "  [참고] 최종 명목 speed가 모듈과 다릅니다. `jl_service.TWENTY_BASE_SPEEDS` 를 아래에 맞추면 재현됩니다:"
            )
            print("  TWENTY_BASE_SPEEDS = [")
            print("    " + ",\n    ".join(f"{x}" for x in final_speeds))
            print("  ]")
    elif args.tune_reconcile:
        seed_tr = args.seed if args.seed is not None else 42
        if args.seed is None:
            print(f"  (--tune-reconcile: 시드 미지정 → {seed_tr} 사용)")
        baseline_before_tune = evaluate_wheel_52(
            draw_nos,
            seed=seed_tr,
            start_strategy=args.start_strategy,
            independent_wheels=args.independent_wheels,
        )
        if args.tune_double_fifth:
            policy = "double_fifth"
        elif args.tune_unhit:
            policy = "unhit"
        else:
            policy = "unhit"
        result, final_speeds, reverted = tune_reconcile_speeds(
            draw_nos,
            seed=seed_tr,
            delta=args.tune_delta,
            alternate_delta=args.tune_alt_delta,
            tune_policy=policy,
            start_strategy=args.start_strategy,
            independent_wheels=args.independent_wheels,
        )
        passed, gate_msg = _passes_priority_gate(baseline_before_tune, result)
        print(f"  [우선순위 게이트] {gate_msg}")
        if not passed:
            print("  [자동 롤백] 튜닝 결과를 기각하고 baseline 결과로 되돌립니다.")
            result = baseline_before_tune
        if reverted:
            print(
                f"  [튜닝·악화 처리] 세트# {reverted} 는 기준 speed 복구 후 "
                f"반대방향 2차 재튜닝을 적용했습니다."
            )
        alt_retuned_sets = result.get("alt_retuned_sets")
        if isinstance(alt_retuned_sets, list) and alt_retuned_sets:
            print(f"  [2차 재튜닝 반영] 세트# {alt_retuned_sets}")
        norm_mod = _normalize_strict_increasing_speeds(list(TWENTY_BASE_SPEEDS))
        if final_speeds != norm_mod:
            print("  [참고] 최종 명목 speed가 모듈과 다릅니다. `jl_service.TWENTY_BASE_SPEEDS` 를 아래에 맞추면 재현됩니다:")
            print("  TWENTY_BASE_SPEEDS = [")
            print("    " + ",\n    ".join(f"{x}" for x in final_speeds))
            print("  ]")
    else:
        result = evaluate_wheel_52(
            draw_nos,
            seed=args.seed,
            start_strategy=args.start_strategy,
            independent_wheels=args.independent_wheels,
            combo_filter=args.combo_filter,
        )

    md = _format_report(result, args.seed)
    hist_md = _format_history_md(result, args.seed)

    if not args.no_history and args.write_history:
        hist = _project_root / args.write_history
        hist.parent.mkdir(parents=True, exist_ok=True)
        hist.write_text(hist_md, encoding="utf-8")
        print(f"당첨 이력 저장: {hist}")

    if args.write_report:
        out = _project_root / args.write_report
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(md, encoding="utf-8")
        print(f"보고서 저장: {out}")

    print(md)


if __name__ == "__main__":
    main()
