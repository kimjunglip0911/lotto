# -*- coding: utf-8 -*-
"""
JL3 기법 — 5년(260회차) 윈도우 기반 독자 분석.

규칙 요약:
1+2. 회차당 1주, 5년 = 260회차 슬라이딩 윈도우.
3. 번호별 출현 횟수 평균 이상 감점, 이하 가점.
4. 연속 출현 스트릭이 역대 최대에 근접할수록 감점.
5. 연속 출현 후 쿨다운 기간 동안 해당 번호 제외.
6. 현재 미출현 갭이 45개 평균(갭=1 제외)보다 높으면 가점, 낮으면 감점.
7. 현재 갭이 역대 최대 초과 시 강제 선정.

상위 8개 번호 추출 → C(8,6)=28세트 전수 조합 생성.
실구매 비용을 고려해 기본 TOP_N=8(28세트)을 유지합니다.

참고: 로또는 난수 추첨이므로 당첨 보장 불가. 통계 기반 참고용입니다.
"""
from __future__ import annotations

import itertools
from collections import Counter

from domain.services.analysis.jl_service import (
    _fetch_rows,
    _compute_max_gap_and_current,
    _dynamic_gap_exponential_scores,
    _zone_balance_scores,
    _neighbor_momentum_scores,
    _recent_trend_scores,
    _last_draw_bonus_scores,
)

# --- JL3 상수 ---
WINDOW_SIZE = 390  # 분석 윈도우 회차 (run_jl3_auto_tune Phase 0 + Phase 3 best)
TOP_N = 8          # 상위 추출 번호 수 → C(8,6) = 28세트 (실구매 가능 범위)
MIN_ROWS = 20      # 최소 분석 회차 (데이터 부족 시 균등 점수 반환)
METHOD_NAME_JL3 = "기법52_JL3"  # 검증 스크립트 저장용 기법명

# Rule 3: 출현 빈도 가/감점 강도 (평균 대비) — Phase 3 전체 파이프라인 best (phase3_best.json)
FREQ_BELOW_AVG_SCALE = 2.3   # 평균 이하일 때 가점 계수 (factor > 1)
FREQ_ABOVE_AVG_SCALE = 0.5   # 평균 이상일 때 감점 계수 (factor < 1)

# Rule 4: 연속 출현 스트릭 감점 (최대에 근접할수록 감점)
STREAK_NEAR_MAX_PENALTY = 0.45  # 현재 스트릭/최대 비율 1일 때 최소 배율

# Rule 5: 쿨다운 미관찰 시 제외 안 함 (min_cooldown이 관찰된 경우만 제외)

# Rule 6: 미출현 갭 평균 대비 가/감점 강도
GAP_ABOVE_AVG_BONUS_SCALE = 1.162  # 갭 > 평균(오래 안 나옴) 시 가점
GAP_BELOW_AVG_PENALTY_SCALE = 0.82  # 갭 < 평균(최근 나옴) 시 감점

# JL 확장: 갭 지수 가속 / 이웃·구간·트렌드·직전회차 (기본값은 무효화로 기존 동작 유지)
USE_GAP_EXPONENTIAL_DEFAULT = False
GAP_THRESHOLD_RATIO = 0.80
GAP_EXP_SCALE = 3.0
GAP_LINEAR_BELOW = 0.35
RECENT_N = 3  # Phase 0 best + Phase 3 best
NEIGHBOR_WEIGHT_DEFAULT = 0.0
NEIGHBOR_BONUS_PER_HIT_DEFAULT = 0.05
ZONE_WEIGHT_DEFAULT = 0.0
TREND_WEIGHT_DEFAULT = 0.0
LAST_DRAW_BONUS_DEFAULT = 1.0


def _fetch_window_rows(
    draw_no: int,
    window_size: int | None = None,
) -> list[tuple[int, tuple[int, ...]]]:
    """draw_no 미만 직전 N회차 데이터 조회. draw_no 내림차순. N은 window_size 또는 WINDOW_SIZE."""
    size = window_size if window_size is not None else WINDOW_SIZE
    return _fetch_rows(draw_no, max_history_draws=size)


def _frequency_scores(
    rows: list[tuple[int, tuple[int, ...]]],
    *,
    below_scale: float | None = None,
    above_scale: float | None = None,
) -> dict[int, float]:
    """
    Rule 3: 5년 윈도우 내 번호별 출현 횟수 → 평균 대비 가/감점.
    평균 이하 → factor > 1 (가점), 평균 이상 → factor < 1 (감점).
    반환: 1~45번에 대한 배율(dict).
    """
    scale_below = below_scale if below_scale is not None else FREQ_BELOW_AVG_SCALE
    scale_above = above_scale if above_scale is not None else FREQ_ABOVE_AVG_SCALE
    count_by_num: dict[int, int] = {n: 0 for n in range(1, 46)}
    for _, nums in rows:
        for n in nums:
            if 1 <= n <= 45:
                count_by_num[n] += 1
    total = sum(count_by_num.values())
    n_nums = 45
    if n_nums <= 0 or total <= 0:
        return {n: 1.0 for n in range(1, 46)}
    avg = total / n_nums
    scores: dict[int, float] = {}
    for n in range(1, 46):
        c = count_by_num[n]
        if c <= avg:
            # 평균 이하 → 가점 (1.0 ~ scale_below)
            if avg <= 0:
                scores[n] = 1.0
            else:
                ratio = 1.0 - (c / avg)  # 0 ~ 1 (적을수록 큼)
                scores[n] = 1.0 + (scale_below - 1.0) * ratio
        else:
            # 평균 이상 → 감점 (scale_above ~ 1.0)
            excess = (c - avg) / avg if avg > 0 else 0.0
            scores[n] = max(scale_above, 1.0 - (1.0 - scale_above) * min(1.0, excess))
    return scores


def _consecutive_streak_analysis(
    rows: list[tuple[int, tuple[int, ...]]],
    draw_no: int,
    current_gap_by_num: dict[int, int],
    *,
    streak_penalty: float | None = None,
) -> tuple[dict[int, float], set[int]]:
    """
    Rule 4: 연속 출현 스트릭이 역대 최대에 근접할수록 감점 → streak_scores.
    Rule 5: 연속 출현 후 쿨다운 기간 내 번호 → excluded.
    반환: (streak_scores 1~45, excluded set).
    """
    penalty = streak_penalty if streak_penalty is not None else STREAK_NEAR_MAX_PENALTY
    sorted_rows = sorted(rows, key=lambda x: x[0])
    max_streak: dict[int, int] = {n: 0 for n in range(1, 46)}
    current_streak: dict[int, int] = {n: 0 for n in range(1, 46)}
    min_cooldown: dict[int, int | None] = {n: None for n in range(1, 46)}
    in_gap_after_streak: dict[int, bool] = {n: False for n in range(1, 46)}
    gap_count: dict[int, int] = {n: 0 for n in range(1, 46)}
    last_seen_ended_streak: dict[int, bool] = {n: False for n in range(1, 46)}

    for draw, nums in sorted_rows:
        for n in range(1, 46):
            if n in nums:
                if in_gap_after_streak[n] and gap_count[n] > 0:
                    c = gap_count[n]
                    min_cooldown[n] = c if min_cooldown[n] is None else min(min_cooldown[n], c)
                in_gap_after_streak[n] = False
                gap_count[n] = 0
                current_streak[n] += 1
                max_streak[n] = max(max_streak[n], current_streak[n])
            else:
                if current_streak[n] > 0:
                    last_seen_ended_streak[n] = True
                    in_gap_after_streak[n] = True
                    gap_count[n] = 1
                else:
                    if in_gap_after_streak[n]:
                        gap_count[n] += 1
                current_streak[n] = 0

    streak_scores: dict[int, float] = {}
    for n in range(1, 46):
        ms = max(1, max_streak[n])
        cs = current_streak[n]
        if cs <= 0:
            streak_scores[n] = 1.0
        else:
            ratio = cs / ms
            streak_scores[n] = 1.0 - (1.0 - penalty) * ratio
        streak_scores[n] = max(penalty, streak_scores[n])

    excluded: set[int] = set()
    for n in range(1, 46):
        if not last_seen_ended_streak[n]:
            continue
        mc = min_cooldown[n]
        if mc is None:
            continue
        cg = current_gap_by_num.get(n, 0)
        if 1 <= cg <= mc:
            excluded.add(n)

    return streak_scores, excluded


def _gap_analysis(
    rows: list[tuple[int, tuple[int, ...]]],
    draw_no: int,
    *,
    above_bonus: float | None = None,
    below_penalty: float | None = None,
) -> tuple[dict[int, float], set[int]]:
    """
    Rule 6: 45개 번호의 현재 갭 평균(갭=1 제외) 대비 가/감점.
    현재 갭 > 평균 → 가점, 현재 갭 < 평균 → 감점.
    Rule 7: 현재 갭이 역대 최대 초과 → force_selected.
    반환: (gap_avg_scores 1~45, force_selected set).
    """
    above_scale = above_bonus if above_bonus is not None else GAP_ABOVE_AVG_BONUS_SCALE
    below_scale = below_penalty if below_penalty is not None else GAP_BELOW_AVG_PENALTY_SCALE
    max_gap, current_gap = _compute_max_gap_and_current(draw_no, rows)
    gaps_excl_1 = [current_gap[n] for n in range(1, 46) if current_gap[n] != 1]
    if not gaps_excl_1:
        avg_gap = 1.0
    else:
        avg_gap = sum(gaps_excl_1) / len(gaps_excl_1)

    gap_scores: dict[int, float] = {}
    force_selected: set[int] = set()
    for n in range(1, 46):
        cg = current_gap[n]
        mg = max_gap[n]
        if cg > mg:
            force_selected.add(n)
        if avg_gap <= 0:
            gap_scores[n] = 1.0
            continue
        if cg > avg_gap:
            ratio = (cg - avg_gap) / avg_gap
            gap_scores[n] = 1.0 + (above_scale - 1.0) * min(1.0, ratio)
        elif cg < avg_gap:
            ratio = (avg_gap - cg) / avg_gap
            gap_scores[n] = max(below_scale, 1.0 - (1.0 - below_scale) * min(1.0, ratio))
        else:
            gap_scores[n] = 1.0

    return gap_scores, force_selected


# 튜닝 스크립트용 파라미터 키 (run_jl3_auto_tune에서 사용)
TUNE_PARAM_KEYS = (
    "freq_below_avg_scale",
    "freq_above_avg_scale",
    "streak_near_max_penalty",
    "gap_above_avg_bonus_scale",
    "gap_below_avg_penalty_scale",
    "use_gap_exponential",
    "gap_threshold_ratio",
    "gap_exp_scale",
    "gap_linear_below",
    "neighbor_weight",
    "neighbor_bonus_per_hit",
    "zone_weight",
    "trend_weight",
    "last_draw_bonus",
    "recent_n",
    "window_size",
    "sum_margin_ratio",
    "odd_even_min_ratio",
)


def get_analysis(
    draw_no: int,
    *,
    freq_below_avg_scale: float | None = None,
    freq_above_avg_scale: float | None = None,
    streak_near_max_penalty: float | None = None,
    gap_above_avg_bonus_scale: float | None = None,
    gap_below_avg_penalty_scale: float | None = None,
    use_gap_exponential: bool = USE_GAP_EXPONENTIAL_DEFAULT,
    gap_threshold_ratio: float | None = None,
    gap_exp_scale: float | None = None,
    gap_linear_below: float | None = None,
    neighbor_weight: float | None = None,
    neighbor_bonus_per_hit: float | None = None,
    zone_weight: float | None = None,
    trend_weight: float | None = None,
    last_draw_bonus: float | None = None,
    recent_n: int | None = None,
    window_size: int | None = None,
) -> dict:
    """
    JL3 전체 분석 결과 반환.
    반환: scores, excluded, force_selected, top8, combinations.
    기존 5개 상수 + JL 확장 파라미터(갭 지수, 이웃·구간·트렌드·직전회차) 오버라이드 가능.
    """
    rows = _fetch_window_rows(draw_no, window_size=window_size)
    if len(rows) < MIN_ROWS:
        uniform = [1.0 / 45.0] * 45
        return {
            "scores": uniform,
            "excluded": [],
            "force_selected": [],
            "top8": list(range(1, TOP_N + 1)),
            "combinations": _make_combinations(list(range(1, TOP_N + 1))),
            "rows": rows,
        }

    n_recent = recent_n if recent_n is not None else RECENT_N
    max_gap, current_gap = _compute_max_gap_and_current(draw_no, rows)
    freq_scores = _frequency_scores(
        rows,
        below_scale=freq_below_avg_scale,
        above_scale=freq_above_avg_scale,
    )
    streak_scores, excluded = _consecutive_streak_analysis(
        rows,
        draw_no,
        current_gap,
        streak_penalty=streak_near_max_penalty,
    )
    gap_avg_scores, force_selected = _gap_analysis(
        rows,
        draw_no,
        above_bonus=gap_above_avg_bonus_scale,
        below_penalty=gap_below_avg_penalty_scale,
    )

    if use_gap_exponential:
        gap_scores = _dynamic_gap_exponential_scores(
            max_gap,
            current_gap,
            gap_threshold_ratio=gap_threshold_ratio or GAP_THRESHOLD_RATIO,
            gap_exp_scale=gap_exp_scale or GAP_EXP_SCALE,
            gap_linear_below=gap_linear_below or GAP_LINEAR_BELOW,
        )
    else:
        gap_scores = gap_avg_scores

    nw = neighbor_weight if neighbor_weight is not None else NEIGHBOR_WEIGHT_DEFAULT
    zw = zone_weight if zone_weight is not None else ZONE_WEIGHT_DEFAULT
    tw = trend_weight if trend_weight is not None else TREND_WEIGHT_DEFAULT
    nb = neighbor_bonus_per_hit if neighbor_bonus_per_hit is not None else NEIGHBOR_BONUS_PER_HIT_DEFAULT
    ld_bonus = last_draw_bonus if last_draw_bonus is not None else LAST_DRAW_BONUS_DEFAULT

    neighbor_scores = _neighbor_momentum_scores(
        rows, recent_n=n_recent, neighbor_bonus_per_hit=nb
    )
    zone_scores = _zone_balance_scores(rows, recent_n=n_recent)
    trend_scores = _recent_trend_scores(rows, recent_n=n_recent)
    last_draw_scores = _last_draw_bonus_scores(rows, last_draw_bonus=ld_bonus)

    raw: dict[int, float] = {}
    for n in range(1, 46):
        if n in excluded:
            raw[n] = 0.0
        else:
            v = (
                freq_scores[n]
                * streak_scores[n]
                * gap_scores[n]
                * (neighbor_scores[n] ** nw)
                * (zone_scores[n] ** zw)
                * (trend_scores[n] ** tw)
                * last_draw_scores[n]
            )
            raw[n] = v

    total = sum(raw.values())
    if total <= 0:
        scores_list = [1.0 / 45.0] * 45
    else:
        scores_list = [raw[i] / total for i in range(1, 46)]

    top8 = get_top8_from_analysis(
        scores_list, excluded, force_selected, current_gap
    )
    combinations = _make_combinations(top8)

    return {
        "scores": scores_list,
        "excluded": sorted(excluded),
        "force_selected": sorted(force_selected),
        "top8": top8,
        "combinations": combinations,
        "rows": rows,
    }


def get_top8_from_analysis(
    scores: list[float],
    excluded: set[int],
    force_selected: set[int],
    current_gap: dict[int, int],
) -> list[int]:
    """
    점수·제외·강제선정을 반영해 상위 TOP_N개 번호 결정.
    force_selected 우선 포함(TOP_N 초과 시 갭 큰 순 TOP_N개), excluded 제외, 나머지 점수 순.
    """
    candidates = [n for n in range(1, 46) if n not in excluded]
    forced = sorted(force_selected, key=lambda n: -current_gap.get(n, 0))
    if len(forced) >= TOP_N:
        return forced[:TOP_N]
    rest = [n for n in candidates if n not in force_selected]
    rest.sort(key=lambda n: -scores[n - 1])
    result = forced + rest[: TOP_N - len(forced)]
    return result[:TOP_N]


def _make_combinations(pool: list[int]) -> list[tuple[int, ...]]:
    """pool에서 6개 조합 전수 생성. pool 길이 n이면 C(n,6)개."""
    pool = sorted(pool)
    return [tuple(c) for c in itertools.combinations(pool, 6)]


# 동적 필터용: 윈도우 데이터에서 합계·홀짝 범위 산출
ODD_EVEN_MIN_RATIO = 0.01  # 출현 비율 이하면 홀짝 비율 제외


def _compute_dynamic_sum_range(
    rows: list[tuple[int, tuple[int, ...]]],
) -> tuple[int, int]:
    """
    윈도우 내 당첨번호 6개 합계의 최소·최대 반환.
    반환: (sum_min, sum_max). rows 비어 있으면 (0, 999).
    """
    if not rows:
        return 0, 999
    sums = [sum(nums) for _, nums in rows]
    return min(sums), max(sums)


def _compute_allowed_odd_counts(
    rows: list[tuple[int, tuple[int, ...]]],
    min_ratio: float = ODD_EVEN_MIN_RATIO,
) -> set[int]:
    """
    윈도우 내 회차별 홀수 개수(0~6) 빈도 분포에서,
    출현 비율이 min_ratio 미만인 홀수 개수는 제외한 허용 집합 반환.
    """
    if not rows:
        return set(range(7))  # 전부 허용
    odd_counts = [sum(1 for n in nums if n % 2 == 1) for _, nums in rows]
    total = len(odd_counts)
    counter = Counter(odd_counts)
    return {
        k for k in range(7)
        if counter.get(k, 0) / total >= min_ratio
    }


def get_scores(
    draw_no: int,
    *,
    freq_below_avg_scale: float | None = None,
    freq_above_avg_scale: float | None = None,
    streak_near_max_penalty: float | None = None,
    gap_above_avg_bonus_scale: float | None = None,
    gap_below_avg_penalty_scale: float | None = None,
    use_gap_exponential: bool = USE_GAP_EXPONENTIAL_DEFAULT,
    gap_threshold_ratio: float | None = None,
    gap_exp_scale: float | None = None,
    gap_linear_below: float | None = None,
    neighbor_weight: float | None = None,
    neighbor_bonus_per_hit: float | None = None,
    zone_weight: float | None = None,
    trend_weight: float | None = None,
    last_draw_bonus: float | None = None,
    recent_n: int | None = None,
    window_size: int | None = None,
) -> list[float]:
    """호환용: 길이 45, 합 1.0. 제외번호=0 반영. 튜닝용 파라미터 오버라이드 가능."""
    a = get_analysis(
        draw_no,
        freq_below_avg_scale=freq_below_avg_scale,
        freq_above_avg_scale=freq_above_avg_scale,
        streak_near_max_penalty=streak_near_max_penalty,
        gap_above_avg_bonus_scale=gap_above_avg_bonus_scale,
        gap_below_avg_penalty_scale=gap_below_avg_penalty_scale,
        use_gap_exponential=use_gap_exponential,
        gap_threshold_ratio=gap_threshold_ratio,
        gap_exp_scale=gap_exp_scale,
        gap_linear_below=gap_linear_below,
        neighbor_weight=neighbor_weight,
        neighbor_bonus_per_hit=neighbor_bonus_per_hit,
        zone_weight=zone_weight,
        trend_weight=trend_weight,
        last_draw_bonus=last_draw_bonus,
        recent_n=recent_n,
        window_size=window_size,
    )
    return a["scores"]


def get_top8(
    draw_no: int,
    *,
    freq_below_avg_scale: float | None = None,
    freq_above_avg_scale: float | None = None,
    streak_near_max_penalty: float | None = None,
    gap_above_avg_bonus_scale: float | None = None,
    gap_below_avg_penalty_scale: float | None = None,
    use_gap_exponential: bool = USE_GAP_EXPONENTIAL_DEFAULT,
    gap_threshold_ratio: float | None = None,
    gap_exp_scale: float | None = None,
    gap_linear_below: float | None = None,
    neighbor_weight: float | None = None,
    neighbor_bonus_per_hit: float | None = None,
    zone_weight: float | None = None,
    trend_weight: float | None = None,
    last_draw_bonus: float | None = None,
    recent_n: int | None = None,
    window_size: int | None = None,
) -> list[int]:
    """점수 상위 TOP_N개 번호 (force_selected 우선, excluded 제외). 튜닝용 파라미터 오버라이드 가능."""
    a = get_analysis(
        draw_no,
        freq_below_avg_scale=freq_below_avg_scale,
        freq_above_avg_scale=freq_above_avg_scale,
        streak_near_max_penalty=streak_near_max_penalty,
        gap_above_avg_bonus_scale=gap_above_avg_bonus_scale,
        gap_below_avg_penalty_scale=gap_below_avg_penalty_scale,
        use_gap_exponential=use_gap_exponential,
        gap_threshold_ratio=gap_threshold_ratio,
        gap_exp_scale=gap_exp_scale,
        gap_linear_below=gap_linear_below,
        neighbor_weight=neighbor_weight,
        neighbor_bonus_per_hit=neighbor_bonus_per_hit,
        zone_weight=zone_weight,
        trend_weight=trend_weight,
        last_draw_bonus=last_draw_bonus,
        recent_n=recent_n,
        window_size=window_size,
    )
    return a["top8"]


def generate_combinations(
    draw_no: int,
    *,
    apply_sum_filter: bool = True,
    apply_odd_even_filter: bool = True,
    sum_margin_ratio: float = 0.0,
    odd_even_min_ratio: float | None = None,
    freq_below_avg_scale: float | None = None,
    freq_above_avg_scale: float | None = None,
    streak_near_max_penalty: float | None = None,
    gap_above_avg_bonus_scale: float | None = None,
    gap_below_avg_penalty_scale: float | None = None,
    use_gap_exponential: bool = USE_GAP_EXPONENTIAL_DEFAULT,
    gap_threshold_ratio: float | None = None,
    gap_exp_scale: float | None = None,
    gap_linear_below: float | None = None,
    neighbor_weight: float | None = None,
    neighbor_bonus_per_hit: float | None = None,
    zone_weight: float | None = None,
    trend_weight: float | None = None,
    last_draw_bonus: float | None = None,
    recent_n: int | None = None,
    window_size: int | None = None,
) -> list[tuple[int, ...]]:
    """
    상위 TOP_N개에서 C(TOP_N,6)개 전수 6번호 조합 생성.
    기본으로 윈도우 데이터 기반 동적 합계 범위·홀짝 비율 필터 적용.
    apply_sum_filter=False, apply_odd_even_filter=False 로 필터 비활성화 가능.
    sum_margin_ratio: 동적 합계 범위 확장 비율(0~1). 예: 0.05면 범위의 5%만큼 양쪽 여유.
    odd_even_min_ratio: 홀짝 허용 비율 기준. None이면 ODD_EVEN_MIN_RATIO 사용.
    튜닝용 파라미터 오버라이드 가능.
    """
    a = get_analysis(
        draw_no,
        freq_below_avg_scale=freq_below_avg_scale,
        freq_above_avg_scale=freq_above_avg_scale,
        streak_near_max_penalty=streak_near_max_penalty,
        gap_above_avg_bonus_scale=gap_above_avg_bonus_scale,
        gap_below_avg_penalty_scale=gap_below_avg_penalty_scale,
        use_gap_exponential=use_gap_exponential,
        gap_threshold_ratio=gap_threshold_ratio,
        gap_exp_scale=gap_exp_scale,
        gap_linear_below=gap_linear_below,
        neighbor_weight=neighbor_weight,
        neighbor_bonus_per_hit=neighbor_bonus_per_hit,
        zone_weight=zone_weight,
        trend_weight=trend_weight,
        last_draw_bonus=last_draw_bonus,
        recent_n=recent_n,
        window_size=window_size,
    )
    combos = a["combinations"]
    rows = a.get("rows", [])

    if apply_sum_filter and rows:
        sum_min, sum_max = _compute_dynamic_sum_range(rows)
        if sum_margin_ratio > 0:
            r = max(1, sum_max - sum_min)
            margin = r * sum_margin_ratio
            sum_min = max(0, int(sum_min - margin))
            sum_max = int(sum_max + margin)
        combos = [c for c in combos if sum_min <= sum(c) <= sum_max]
    if apply_odd_even_filter and rows:
        min_ratio = odd_even_min_ratio if odd_even_min_ratio is not None else ODD_EVEN_MIN_RATIO
        allowed = _compute_allowed_odd_counts(rows, min_ratio=min_ratio)
        if not allowed:
            allowed = set(range(1, 6))  # 극단(6:0, 0:6)만 제외
        combos = [c for c in combos if sum(1 for x in c if x % 2 == 1) in allowed]
    return combos


def secondary_purchase_score(combo: tuple[int, ...] | list[int] | set[int]) -> float:
    """
    §4.6: TOP8·28세트 구조는 유지한 채, 실구매 시 k세트만 고를 때 쓰는 2차 선호 점수.
    당첨 확률과 무관한 휴리스틱(합·홀짝·구간 분산·연번)이며 참고용입니다.
    """
    nums = sorted(combo) if isinstance(combo, set) else sorted(combo)
    if len(nums) != 6:
        return 0.0
    total = sum(nums)
    # 역사적 분포 중심(대략 115~155)에 가까울수록 높은 점수
    sum_part = max(0.0, 1.0 - abs(total - 135) / 85.0)
    odd_ct = sum(1 for n in nums if n % 2)
    odd_pref = {2: 1.0, 3: 1.0, 4: 1.0, 1: 0.72, 5: 0.72, 0: 0.45, 6: 0.45}[odd_ct]
    z = [0, 0, 0]
    for n in nums:
        if n <= 15:
            z[0] += 1
        elif n <= 30:
            z[1] += 1
        else:
            z[2] += 1
    zones_used = sum(1 for x in z if x > 0)
    zone_part = zones_used / 3.0
    consec = sum(1 for i in range(5) if nums[i + 1] == nums[i] + 1)
    consec_part = max(0.0, 1.0 - consec * 0.14)
    return sum_part * 0.34 + odd_pref * 0.26 + zone_part * 0.26 + consec_part * 0.14


def rank_jl3_combos_for_purchase(
    combos: list[tuple[int, ...]],
    *,
    top_k: int = 5,
) -> list[tuple[float, tuple[int, ...]]]:
    """2차 점수 내림차순 상위 top_k개 (동점 시 번호 오름차순 튜플로 안정 정렬)."""
    scored = [(secondary_purchase_score(c), c) for c in combos]
    scored.sort(key=lambda x: (-x[0], x[1]))
    return scored[: max(0, top_k)]
