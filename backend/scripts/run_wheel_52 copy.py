# -*- coding: utf-8 -*-
"""
JL 휠: **최신 52개 회차**(기본) × 20세트 당첨 비교.

- 시작 6번호: 평가 구간 상한 `up_to=max(draw_nos)`를 기준으로 **1~up_to회차** 공개 본번호 누적 합 상위 6개를 **1회 고정**.
- 회차 내 20세트: `generate_jl_wheel_sets(..., dedup_across_sets=True)` — 실제 생성 로직과 동일하게 세트 간 중복 조합을 사후 교체 규칙으로 해소.
- 세트#1~20: **명목 speed**만 다르고 `decel = speed / jl_service.FIXED_STOP_TIME` (정지 시간 공정 고정).
- `docs/당첨 이력.md` 는 **고정 양식**(`## 2. 속도 프로파일…` + 요약 + 표)만 전체 덮어씀.

사용 (backend 디렉터리):
  python -m scripts.run_wheel_52
  python -m scripts.run_wheel_52 --seed 42
  python -m scripts.run_wheel_52 --write-history docs/당첨 이력.md
  python -m scripts.run_wheel_52 --seed 42 --tune-reconcile --write-history docs/당첨 이력.md
  python -m scripts.run_wheel_52 --seed 42 --tune-reconcile --tune-delta 0.15 --write-history docs/당첨 이력.md
    → **5등 1회만** 당첨 세트 speed 상향 후, **기준(모듈) 대비 악화된 세트만** 롤백·재평가 (작업지시 1·2).
    → 과거 5등 2회만 대상: ``--tune-double-fifth``.
  python -m scripts.run_wheel_52 --seed 42 --refine-set 9 --refine-step 0.01 --write-history docs/당첨 이력.md
    → **세트#9만** 이웃 speed 사이 전 구간 그리드 탐색(다른 세트 기준 점수 보존), 로컬 최적까지.
"""
from __future__ import annotations

import argparse
import math
import random
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

sys.dont_write_bytecode = True
_backend_root = Path(__file__).resolve().parent.parent
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from domain.services.analysis.jl_service import (
    FIXED_STOP_TIME,
    TWENTY_BASE_SPEEDS,
    generate_jl_wheel_sets,
    get_global_top6_frequency_starts,
)
from domain.services.lotto_rank import rank_lotto_ticket
from infrastructure.persistence.database import get_connection

NUM_SETS_PER_DRAW = 20
REQUIRED_DRAW_COUNT = 52
DEFAULT_RANK_WEIGHTS: dict[int, int] = {
    1: 10**12,
    2: 10**9,
    3: 10**6,
    4: 10**3,
    5: 1,
}


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
    policy: Literal["double_fifth", "single_fifth"],
) -> list[float]:
    if policy == "double_fifth":
        return _nudge_speeds_double_fifth_only(
            baseline_speeds, by_set_index, delta=delta
        )
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
    tune_policy: Literal["double_fifth", "single_fifth"] = "single_fifth",
    rank_weights: dict[int, int] | None = None,
) -> tuple[dict[str, Any], list[float], list[int]]:
    """
    작업지시: (1) 튜닝 대상 세트 speed 조정 (2) 기준 대비 악화된 세트만 롤백 후 재평가.

    - 기본(``single_fifth``): 당첨이 **정확히 1건이고 5등만**인 세트.
    - ``double_fifth``: 당첨 2건·모두 5등(레거시).
    - 기준 speed: 현재 ``jl_service.TWENTY_BASE_SPEEDS`` 스냅샷.
    - 악화: 해당 세트의 가중치 점수가 기준 시뮬보다 작을 때.
    반환: (최종 result, 최종 speed 리스트, 롤백된 세트# 목록(마지막 라운드 누적)).
    """
    baseline = _normalize_strict_increasing_speeds(list(TWENTY_BASE_SPEEDS))
    if len(baseline) != 20:
        raise ValueError("TWENTY_BASE_SPEEDS 길이는 20이어야 합니다.")

    random.seed(seed)
    res0 = evaluate_wheel_52(draw_nos, seed=seed, base_speeds=baseline)
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
        res1 = evaluate_wheel_52(draw_nos, seed=seed, base_speeds=candidate)
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
    res_final = evaluate_wheel_52(draw_nos, seed=seed, base_speeds=candidate)
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
) -> tuple[dict[str, Any], list[float], float, int]:
    """
    **한 세트**의 명목 speed만 이웃(세트#-1, 세트#+1) 사이에서 그리드 탐색해 고도화.

    - **목표**: 해당 세트의 가중치 점수를 최대화 (상위 등수 절대 우선).
    - **protect_other_sets** (기본 True): 첫 기준 평가의 다른 세트 점수보다 **어느 세트도** 나빠지지 않는 후보만 허용 (작업지시 2 정렬).
    - **동점 타이브레이크**: 해당 세트 점수가 같으면 **speed가 더 큰** 값(고속 이웃 쪽)을 택함.
    - 이웃 명목 speed는 고정하고, 후보 speed는 ``(이전세트+0.01) .. (다음세트-0.01)`` 2자리 그리드.

    반환: ``(최종 result, 최종 20개 speed, 선택된 해당 세트 speed, 총 평가 횟수)``
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
    res0 = evaluate_wheel_52(draw_nos, seed=seed, base_speeds=base)
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
        res = evaluate_wheel_52(draw_nos, seed=seed, base_speeds=cand)
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
    best_result = evaluate_wheel_52(draw_nos, seed=seed, base_speeds=best_speeds)
    eval_count += 1
    return best_result, best_speeds, best_speed, eval_count


def refine_all_sets_speed_grid(
    draw_nos: tuple[int, ...],
    *,
    seed: int,
    baseline_speeds: list[float] | None = None,
    step: float = 0.5,
    speed_min: float = 75.0,
    speed_max: float = 130.0,
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
    result = evaluate_wheel_52(draw_nos, seed=seed, base_speeds=current)
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
        )
        total_eval += n_eval
    return result, current, total_eval


def evaluate_wheel_52(
    draw_nos: tuple[int, ...],
    *,
    num_sets: int = NUM_SETS_PER_DRAW,
    seed: int | None = None,
    base_speeds: list[float] | None = None,
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
    total_tickets = 0
    per_draw: dict[int, dict[int, int]] = {}
    hit_draws: list[tuple[int, int]] = []
    hit_rows: list[dict[str, Any]] = []
    by_set_index: dict[int, list[tuple[int, int]]] = {i: [] for i in range(1, 21)}
    top6_by_draw: dict[int, list[int]] = {}
    up_to = max(draw_nos)
    latest_top6 = get_global_top6_frequency_starts(up_to)
    speeds_used = (
        _normalize_strict_increasing_speeds(list(base_speeds))
        if base_speeds is not None
        else _normalize_strict_increasing_speeds(list(TWENTY_BASE_SPEEDS))
    )
    if len(speeds_used) != 20:
        raise ValueError("base_speeds 는 길이 20의 명목 speed 리스트여야 합니다.")
    custom_profiles = _profiles_from_base_speeds(speeds_used)

    for dn in draw_nos:
        if dn not in winners:
            continue
        main, bonus = winners[dn]
        # 작업지시: 기준 구간 **1회차 ~ 현재 회차(up_to)** 누적 상위 6개를 전 회차에 고정 적용
        start6 = latest_top6
        sets_rows = generate_jl_wheel_sets(
            dn,
            count=num_sets,
            start_index=0,
            fixed_start_nums=start6,
            profiles=custom_profiles,
            dedup_across_sets=True,
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
            rnk = rank_lotto_ticket(main, bonus, s)
            si = int(row["set_index"])
            sp = float(row["profile_speed"])
            dec = float(row["profile_deceleration"])

            if rnk is not None:
                ticket_counts[rnk] += 1
                dc[rnk] += 1
                if best is None or rnk < best:
                    best = rnk
                hit_rows.append(
                    {
                        "draw_no": dn,
                        "set_index": si,
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
        "total_combos": math.comb(45, 6),
        "hit_rows": hit_rows,
        "by_set_index": by_set_index,
        "top6_by_draw": top6_by_draw,
        "latest_top6_starts": latest_top6,
        "eval_max_draw_no": up_to,
        "fixed_top6_starts": latest_top6,
        "fixed_top6_up_to_draw": up_to,
        "nominal_base_speeds": speeds_used,
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
    if isinstance(latest, list) and latest and up is not None:
        lines.append(
            f"- 시작번호: **고정** — 평가 구간 상한 **{up}**회 기준 "
            f"**1~{up}회차** 본번호 누적 합 상위 6개: **{', '.join(str(int(x)) for x in latest)}** "
            f"(모든 평가 회차에 동일 적용)"
        )
    else:
        lines.append("- 시작번호: **고정 누적 TOP6** (상세는 결과 객체 `top6_by_draw` 참고)")
    nom = result.get("nominal_base_speeds")
    speed_note = (
        "이번 실행 명목 speed (`result['nominal_base_speeds']`)"
        if isinstance(nom, list) and len(nom) == 20
        else "`jl_service.TWENTY_BASE_SPEEDS`"
    )
    lines.append(
        f"- 세트별 속도: **20단계 초기 speed** ({speed_note}), "
        f"감속도는 정지 시간 **{FIXED_STOP_TIME:.6g}** 초 고정 → `decel = speed / FIXED_STOP_TIME`"
    )
    lines.append(f"- 회차당 생성 세트 수: **{result['num_sets_per_draw']}**")
    lines.append(f"- 비교한 총 게임 수: **{result['total_tickets']}** (= 52 × 20)")
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
    lines.append("## 2. 등수별 ‘해당 등수 당첨 세트가 있었던 회차’ 수")
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
    `backend/docs/당첨 이력.md` 고정 양식만 출력 (파일 전체 덮어쓰기).
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
    lines.append("## 2. 속도 프로파일(세트#)별 당첨 이력")
    lines.append("")
    lines.append(f"당첨 누적 회차 : {len(distinct_draws)}회")
    for t in (1, 2, 3, 4, 5):
        lines.append(f"{t}등 : {tier_hits[t]}번")
    lines.append("")
    lines.append("| 세트# | speed | decel | 회차(등수) |")
    lines.append("|-------|-------|-------|------------|")
    nominal = result.get("nominal_base_speeds")
    speed_row = list(nominal) if isinstance(nominal, list) and len(nominal) == 20 else list(TWENTY_BASE_SPEEDS)
    for si in range(1, 21):
        sp = float(speed_row[si - 1])
        dec_nominal = sp / FIXED_STOP_TIME
        hits = by_si.get(si, [])
        if not hits:
            cell = "-"
        else:
            parts = [f"{dn}({rnk}등)" for dn, rnk in hits]
            cell = ", ".join(parts)
        lines.append(
            f"| {si} | {sp} | {dec_nominal:.4g} | {cell} |"
        )
    lines.append("")
    _ = seed  # 시드는 고정 양식에 포함하지 않음(형식 유지)
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
        "--write-report",
        type=str,
        default=None,
        metavar="PATH",
        help="요약 보고서 Markdown 경로",
    )
    parser.add_argument(
        "--write-history",
        type=str,
        default="docs/당첨 이력.md",
        metavar="PATH",
        help="당첨 이력 상세 Markdown 경로 (기본: docs/당첨 이력.md)",
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
    if args.refine_all:
        seed_rf = args.seed if args.seed is not None else 42
        min_sp = args.refine_min_speed if args.refine_min_speed is not None else 75.0
        max_sp = args.refine_max_speed if args.refine_max_speed is not None else 130.0
        result, final_speeds, n_eval = refine_all_sets_speed_grid(
            draw_nos,
            seed=seed_rf,
            step=float(args.refine_step),
            speed_min=float(min_sp),
            speed_max=float(max_sp),
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
        policy = "double_fifth" if args.tune_double_fifth else "single_fifth"
        result, final_speeds, reverted = tune_reconcile_speeds(
            draw_nos,
            seed=seed_tr,
            delta=args.tune_delta,
            alternate_delta=args.tune_alt_delta,
            tune_policy=policy,
        )
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
        result = evaluate_wheel_52(draw_nos, seed=args.seed)

    md = _format_report(result, args.seed)
    hist_md = _format_history_md(result, args.seed)

    # 콘솔 출력 실패해도 산출물은 먼저 저장
    if not args.no_history and args.write_history:
        hist = _backend_root / args.write_history
        hist.parent.mkdir(parents=True, exist_ok=True)
        hist.write_text(hist_md, encoding="utf-8")
        print(f"당첨 이력 저장: {hist}")

    if args.write_report:
        out = _backend_root / args.write_report
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(md, encoding="utf-8")
        print(f"보고서 저장: {out}")

    print(md)


if __name__ == "__main__":
    main()
