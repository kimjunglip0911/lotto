# -*- coding: utf-8 -*-
"""
JL 기법 (JL Technique) — 실제 수치·로직은 모두 이 서비스에 적용됩니다.

반영 출처: 사용자 의견(균등 분포, 최대 간격 한계점) / AI 제안(Neighbor Momentum, 지수 가속 등)
/ 인터넷 검색(합계 100~170, 홀짝 극단 제외, 구간·고저 균형) / 기존 10개 기법에서 추출한 수치.

핵심 설계:
1. Dynamic Gap Exponential: Max Gap 대비 현재 갭이 임계 비율 이상이면 지수 가속.
2. Neighbor Momentum: 인접 번호(±1) 최근 출현 시 해당 번호 보너스.
3. 직전 회차 이월수 보너스 (대중 기피 역이용).
4. 최근 N회차 트렌드 가중.
5. 구간 균형(1~15 / 16~30 / 31~45) 보너스.

참고: 로또는 난수 추첨이므로 당첨 보장 불가. 통계 기반 참고용입니다.
"""
import math
from collections import Counter
from infrastructure.persistence.database import get_connection

# --- 점수 산출용 상수 (실제 수치는 여기만 변경) ---
MAX_HISTORY_DRAWS = 120          # 조회 회차
RECENT_TREND_N = 6               # 최근 N회차 트렌드/이웃 (회차 기준 1위 combo_trend_gap 반영)
GAP_THRESHOLD_RATIO = 0.80       # 갭 지수 가속 임계 (나머지 경우의 수: 0.80이 4등2·5등41로 상위)
GAP_EXP_SCALE = 3.0              # 지수 가속 강도 (회차 기준 1위 combo_trend_gap 반영)
LAST_DRAW_BONUS = 1.2            # 직전 회차 보너스 (52회 AI 경우의 수: 1.2가 4등 2회로 상위)
NEIGHBOR_BONUS_PER_HIT = 0.30    # 인접 번호 출현당 보너스 (combo_neighbor_last 반영)
GAP_LINEAR_BELOW_THRESHOLD = 0.35  # 비가속 구간 선형 계수 (나머지 경우의 수: 0.35가 4등2회)
ZONE_BALANCE_BONUS_SCALE = 2.0
ZONE_BALANCE_MAX_BONUS = 0.25
MIN_ROWS = 20

# --- 갭·구간 균형 가중치 (JL / JL3 튜닝 시 수동 조정) ---
DEFAULT_GAP_WEIGHT = 1.40
DEFAULT_ZONE_WEIGHT = 1.35
MY_THINKING_WEIGHT = 1.3  # gap/zone 미지정 시 폴백(동일값)

# --- 세트 생성·필터용 상수 (테스트 스크립트에서 import하여 사용) ---
TOP_POOL_SIZE = 22               # 상위 N개 번호 풀 (조합 다양도)
TOP_CANDIDATES_FOR_DIVERSITY = 90
SUM_MIN = 100                    # 인터넷 통계: 당첨 합계 다수 구간
SUM_MAX = 170
ODD_EVEN_EXTREME_FORBIDDEN = True  # 홀짝 6:0 / 0:6 제외


def _fetch_rows(
    draw_no: int,
    max_history_draws: int | None = None,
) -> list[tuple[int, tuple[int, ...]]]:
    """draw_no 미만 최근 회차 조회. (draw_no, (num1..num6)) 리스트, draw_no 내림차순."""
    limit = max_history_draws if max_history_draws is not None else MAX_HISTORY_DRAWS
    conn = get_connection()
    conn.row_factory = None
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT draw_no, num1, num2, num3, num4, num5, num6
        FROM lotto_winners
        WHERE draw_no < ?
        ORDER BY draw_no DESC
        LIMIT ?
        """,
        (draw_no, limit),
    )
    rows = cursor.fetchall()
    conn.close()
    return [(r[0], (r[1], r[2], r[3], r[4], r[5], r[6])) for r in rows]


def _compute_max_gap_and_current(
    draw_no: int, rows: list[tuple[int, tuple[int, ...]]]
) -> tuple[dict[int, int], dict[int, int]]:
    """
    번호별 역대 최대 갭(Max Gap)과 현재 갭(Current Gap) 계산.
    반환: (max_gap_by_num, current_gap_by_num)
    """
    sorted_rows = sorted(rows, key=lambda x: x[0])
    first_draw = sorted_rows[0][0] if sorted_rows else 0

    gap_history: dict[int, list[int]] = {n: [] for n in range(1, 46)}
    last_seen: dict[int, int] = {n: first_draw - 1 for n in range(1, 46)}

    for draw, nums in sorted_rows:
        for n in nums:
            if 1 <= n <= 45:
                if last_seen[n] >= first_draw:
                    gap_history[n].append(draw - last_seen[n])
                last_seen[n] = draw

    max_gap: dict[int, int] = {}
    for n in range(1, 46):
        gaps = gap_history[n]
        max_gap[n] = max(gaps) if gaps else 20

    current_gap = {n: (draw_no - 1) - last_seen[n] for n in range(1, 46)}
    return max_gap, current_gap


def _dynamic_gap_exponential_scores(
    max_gap: dict[int, int],
    current_gap: dict[int, int],
    *,
    gap_threshold_ratio: float | None = None,
    gap_exp_scale: float | None = None,
    gap_linear_below: float | None = None,
) -> dict[int, float]:
    """
    Dynamic Gap Exponential: 현재 갭이 Max Gap의 임계 비율 이상이면 지수 함수로 점수 증가.
    """
    thr = gap_threshold_ratio if gap_threshold_ratio is not None else GAP_THRESHOLD_RATIO
    exp_scale = gap_exp_scale if gap_exp_scale is not None else GAP_EXP_SCALE
    linear = gap_linear_below if gap_linear_below is not None else GAP_LINEAR_BELOW_THRESHOLD
    scores: dict[int, float] = {}
    for n in range(1, 46):
        cg = current_gap.get(n, 0)
        mg = max(1, max_gap.get(n, 20))
        ratio = cg / mg
        if ratio >= thr:
            boost = math.exp(exp_scale * (ratio - thr))
            scores[n] = 1.0 + boost
        else:
            scores[n] = 1.0 + linear * (cg / mg)
    return scores


def _zone_balance_scores(
    rows: list[tuple[int, tuple[int, ...]]],
    recent_n: int,
    *,
    zone_balance_bonus_scale: float | None = None,
    zone_balance_max_bonus: float | None = None,
) -> dict[int, float]:
    """
    구간 균형: 최근 recent_n회 구간별(1~15, 16~30, 31~45) 출현 비율이 낮은 구간의 번호에 보너스.
    """
    scale = zone_balance_bonus_scale if zone_balance_bonus_scale is not None else ZONE_BALANCE_BONUS_SCALE
    cap = zone_balance_max_bonus if zone_balance_max_bonus is not None else ZONE_BALANCE_MAX_BONUS
    use_rows = rows[:recent_n]
    if not use_rows:
        return {n: 1.0 for n in range(1, 46)}
    zone_count = [0.0, 0.0, 0.0]
    for _, nums in use_rows:
        for n in nums:
            if 1 <= n <= 15:
                zone_count[0] += 1
            elif 16 <= n <= 30:
                zone_count[1] += 1
            elif 31 <= n <= 45:
                zone_count[2] += 1
    total = sum(zone_count)
    if total <= 0:
        return {n: 1.0 for n in range(1, 46)}
    zone_ratio = [c / total for c in zone_count]
    scores: dict[int, float] = {}
    for n in range(1, 46):
        if 1 <= n <= 15:
            idx = 0
        elif 16 <= n <= 30:
            idx = 1
        else:
            idx = 2
        shortfall = (1.0 / 3.0) - zone_ratio[idx]
        bonus = shortfall * scale if shortfall > 0 else 0.0
        scores[n] = 1.0 + max(0.0, min(cap, bonus))
    return scores


def _neighbor_momentum_scores(
    rows: list[tuple[int, tuple[int, ...]]],
    recent_n: int | None = None,
    *,
    neighbor_bonus_per_hit: float | None = None,
) -> dict[int, float]:
    """
    Neighbor Momentum: 최근 recent_n회에서 인접 번호(±1) 출현 횟수만큼 해당 번호에 보너스.
    """
    n_use = recent_n if recent_n is not None else RECENT_TREND_N
    bonus_hit = neighbor_bonus_per_hit if neighbor_bonus_per_hit is not None else NEIGHBOR_BONUS_PER_HIT
    use_rows = rows[:n_use]
    recent_freq: Counter[int] = Counter()
    for _, nums in use_rows:
        for n in nums:
            if 1 <= n <= 45:
                recent_freq[n] += 1

    scores: dict[int, float] = {n: 1.0 for n in range(1, 46)}
    for n in range(1, 46):
        bonus = 0.0
        if n >= 2:
            bonus += recent_freq.get(n - 1, 0) * bonus_hit
        if n <= 44:
            bonus += recent_freq.get(n + 1, 0) * bonus_hit
        scores[n] = 1.0 + bonus
    return scores


def _last_draw_bonus_scores(
    rows: list[tuple[int, tuple[int, ...]]],
    *,
    last_draw_bonus: float | None = None,
) -> dict[int, float]:
    """직전 회차 출현 번호에 보너스 (대중 기피 역이용)."""
    b = last_draw_bonus if last_draw_bonus is not None else LAST_DRAW_BONUS
    if not rows:
        return {n: 1.0 for n in range(1, 46)}
    last_nums = set(rows[0][1])
    return {n: (1.0 + b if n in last_nums else 1.0) for n in range(1, 46)}


def _recent_trend_scores(
    rows: list[tuple[int, tuple[int, ...]]],
    recent_n: int | None = None,
) -> dict[int, float]:
    """최근 recent_n회 가중 빈도 (최신일수록 가중치 큼)."""
    n_use = recent_n if recent_n is not None else RECENT_TREND_N
    use_rows = rows[:n_use]
    if not use_rows:
        return {n: 1.0 for n in range(1, 46)}
    n_rows = len(use_rows)
    weights = [1.0 + (2.0 - 1.0) * (i / max(1, n_rows - 1)) for i in range(n_rows)]
    total_w = sum(weights)
    weighted: dict[int, float] = {n: 0.0 for n in range(1, 46)}
    for i, (_, nums) in enumerate(use_rows):
        for n in nums:
            if 1 <= n <= 45:
                weighted[n] += weights[i]
    for n in range(1, 46):
        weighted[n] = 1.0 + (weighted[n] / total_w * 2.0) if total_w > 0 else 1.0
    return weighted


def get_scores(
    draw_no: int,
    max_history_draws: int | None = None,
    recent_trend_n: int | None = None,
    use_zone_balance: bool = True,
    gap_weight: float | None = None,
    zone_weight: float | None = None,
    *,
    neighbor_bonus: float | None = None,
    last_draw_bonus: float | None = None,
    gap_exp_scale: float | None = None,
    gap_threshold_ratio: float | None = None,
    gap_linear_below: float | None = None,
    zone_balance_bonus_scale: float | None = None,
    zone_balance_max_bonus: float | None = None,
) -> list[float]:
    """
    JL 기법으로 1~45번 각 숫자의 정규화된 점수를 반환합니다.
    길이 45, 합 1.0.

    나의 생각 고정: gap_weight, zone_weight None이면 MY_THINKING_WEIGHT(둘다동일강조).
    너의 생각(AI) 오버라이드: neighbor_bonus, last_draw_bonus, gap_exp_scale 등.
    """
    rows = _fetch_rows(draw_no, max_history_draws=max_history_draws)
    if len(rows) < MIN_ROWS:
        return [1.0 / 45.0] * 45

    w_gap = gap_weight if gap_weight is not None else DEFAULT_GAP_WEIGHT
    w_zone = zone_weight if zone_weight is not None else DEFAULT_ZONE_WEIGHT

    n_trend = recent_trend_n if recent_trend_n is not None else RECENT_TREND_N
    max_gap, current_gap = _compute_max_gap_and_current(draw_no, rows)
    gap_scores = _dynamic_gap_exponential_scores(
        max_gap,
        current_gap,
        gap_threshold_ratio=gap_threshold_ratio,
        gap_exp_scale=gap_exp_scale,
        gap_linear_below=gap_linear_below,
    )
    neighbor_scores = _neighbor_momentum_scores(
        rows,
        recent_n=n_trend,
        neighbor_bonus_per_hit=neighbor_bonus,
    )
    last_draw_scores = _last_draw_bonus_scores(rows, last_draw_bonus=last_draw_bonus)
    trend_scores = _recent_trend_scores(rows, recent_n=n_trend)

    # 나의 생각 가중치: 갭(최대 간격 한계점)·구간 균형(균등 분포) 반영
    raw: dict[int, float] = {}
    for n in range(1, 46):
        raw[n] = (
            (gap_scores[n] ** w_gap)
            * neighbor_scores[n]
            * last_draw_scores[n]
            * trend_scores[n]
        )

    if use_zone_balance:
        zone_scores = _zone_balance_scores(
            rows,
            recent_n=n_trend,
            zone_balance_bonus_scale=zone_balance_bonus_scale,
            zone_balance_max_bonus=zone_balance_max_bonus,
        )
        for n in range(1, 46):
            raw[n] *= zone_scores[n] ** w_zone

    total = sum(raw.values())
    if total <= 0:
        return [1.0 / 45.0] * 45
    return [raw[i] / total for i in range(1, 46)]
