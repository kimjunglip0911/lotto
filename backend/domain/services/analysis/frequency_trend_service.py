"""
출현 빈도 및 추세 기법 - 로또 번호 추천.

4가지 지표를 가중 합산하여 번호별 점수를 산출합니다:
1. 출현 빈도: 최근 50회 가중 빈도 (최신 회차 가중치 부여)
2. 다음 출현 확률: 직전 출현 이후 k회 경과 시의 출현 확률 (역사적 갭 분포 기반)
3. 갭 오버듀: 현재 갭 / 평균 갭 비율이 클수록 오버듀 → 점수 가산 (Hot/Cold 참고)
4. 50회 추세: 5구간(10회씩) 빈도 추이로 상승·바닥 번호 식별

참고: 로또는 난수 추첨이므로 당첨 보장 불가. 통계 기반 참고용입니다.
"""
from infrastructure.persistence.database import get_connection

# --- 조정 가능 수치 (최근 5회차 5등 이상 목표 튜닝) ---
# v2: 최근 회차 강조 + 갭 오버듀(냉번) 비중 상승 → 번호 분포 다양화
MAX_HISTORY_DRAWS = 100
RECENT_FREQ_N = 36  # 50→36: 최근 패턴 반영 강화
RECENT_FREQ_WEIGHT_FACTOR = 2.0  # 1.5→2.0: 최신 회차 가중치 상향
TREND_WINDOWS = 5
TREND_WINDOW_SIZE = 10
MIN_ROWS = 20

# 4요소 가중치 (합=1.0) — 갭/다음출현↑ → 저·고번대 커버리지 확대
WEIGHT_FREQ = 0.22
WEIGHT_NEXT_PROB = 0.30
WEIGHT_GAP_OVERDUE = 0.32
WEIGHT_TREND = 0.16


def _fetch_rows(draw_no: int) -> list[tuple[int, tuple[int, ...]]]:
    """draw_no 미만 최근 회차 조회. (draw_no, (num1..num6)) 리스트, draw_no 내림차순."""
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
        (draw_no, MAX_HISTORY_DRAWS),
    )
    rows = cursor.fetchall()
    conn.close()
    return [(r[0], (r[1], r[2], r[3], r[4], r[5], r[6])) for r in rows]


def _compute_gap_stats(rows: list[tuple[int, tuple[int, ...]]]) -> dict[int, tuple[float, list[int]]]:
    """
    번호별 평균 갭 및 갭 이력 계산.
    반환: {num: (avg_gap, [gap1, gap2, ...])}
    rows는 draw_no 내림차순(최신 먼저)
    """
    # draw_no 오름차순으로 변환 (과거→최신)
    sorted_rows = sorted(rows, key=lambda x: x[0])
    draw_nums = [r[0] for r in sorted_rows]

    gap_history: dict[int, list[int]] = {n: [] for n in range(1, 46)}
    last_seen: dict[int, int] = {}

    for draw_no, nums in sorted_rows:
        for n in nums:
            if 1 <= n <= 45:
                if n in last_seen:
                    gap_history[n].append(draw_no - last_seen[n])
                last_seen[n] = draw_no

    result: dict[int, tuple[float, list[int]]] = {}
    for n in range(1, 46):
        gaps = gap_history[n]
        avg = sum(gaps) / len(gaps) if gaps else 7.5
        result[n] = (avg, gaps)
    return result


def _compute_current_gap(draw_no: int, rows: list[tuple[int, tuple[int, ...]]]) -> dict[int, int]:
    """각 번호의 마지막 출현 회차로부터 현재(draw_no 직전)까지의 갭. 미출현 번호는 draw_no로 간주."""
    sorted_rows = sorted(rows, key=lambda x: x[0])
    last_draw_in_data = sorted_rows[-1][0] if sorted_rows else 0
    first_draw_in_data = sorted_rows[0][0] if sorted_rows else 0

    last_seen: dict[int, int] = {n: first_draw_in_data - 1 for n in range(1, 46)}
    for draw, nums in sorted_rows:
        for n in nums:
            if 1 <= n <= 45:
                last_seen[n] = draw

    return {n: (draw_no - 1) - last_seen[n] for n in range(1, 46)}


def _compute_next_appearance_prob(
    num: int, current_gap: int, gap_stats: dict[int, tuple[float, list[int]]]
) -> float:
    """
    갭 분포 기반 다음 출현 확률.
    현재 갭이 평균보다 크면(오버듀) 출현 확률이 높다고 간주.
    """
    if num not in gap_stats:
        return 1.0 / 45.0
    avg_gap, gaps = gap_stats[num]
    if not gaps or avg_gap <= 0:
        return 1.0 / 45.0
    ratio = current_gap / avg_gap
    if ratio >= 2.0:
        return 2.0  # 오버듀 가산 상한 확대 (1.5→2.0)
    if ratio <= 0.5:
        return 0.5
    return min(2.0, max(0.5, ratio))


def _compute_freq_scores(rows: list[tuple[int, tuple[int, ...]]]) -> dict[int, float]:
    """최근 RECENT_FREQ_N회 가중 빈도 점수. 최신일수록 가중치 큼."""
    use_rows = rows[:RECENT_FREQ_N]
    if not use_rows:
        return {n: 1.0 / 45.0 for n in range(1, 46)}

    n_rows = len(use_rows)
    weights = [
        1.0 + (RECENT_FREQ_WEIGHT_FACTOR - 1.0) * (i / max(1, n_rows - 1))
        for i in range(n_rows)
    ]
    total_w = sum(weights)
    weighted_freq: dict[int, float] = {n: 0.0 for n in range(1, 46)}
    for i, (_, nums) in enumerate(use_rows):
        for n in nums:
            if 1 <= n <= 45:
                weighted_freq[n] += weights[i]
    for n in range(1, 46):
        weighted_freq[n] = weighted_freq[n] / total_w if total_w > 0 else 1.0 / 45.0
    return weighted_freq


def _compute_gap_overdue_scores(
    current_gaps: dict[int, int], gap_stats: dict[int, tuple[float, list[int]]]
) -> dict[int, float]:
    """현재 갭/평균 갭 비율이 클수록(오버듀) 높은 점수."""
    scores: dict[int, float] = {}
    for n in range(1, 46):
        cg = current_gaps.get(n, 0)
        if n not in gap_stats:
            scores[n] = 1.0
            continue
        avg_gap, _ = gap_stats[n]
        if avg_gap <= 0:
            scores[n] = 1.0
            continue
        ratio = cg / avg_gap
        scores[n] = min(2.5, max(0.5, ratio))  # 갭 오버듀 상한 2.0→2.5
    return scores


def _compute_trend_scores(rows: list[tuple[int, tuple[int, ...]]]) -> dict[int, float]:
    """최근 50회를 5구간으로 나눠 추세(최근-과거) 점수. 상승=높은 점수, 하락=낮은 점수."""
    use_rows = rows[: RECENT_FREQ_N]
    if len(use_rows) < TREND_WINDOW_SIZE * 2:
        return {n: 1.0 for n in range(1, 46)}

    window_size = len(use_rows) // TREND_WINDOWS
    if window_size < 1:
        return {n: 1.0 for n in range(1, 46)}

    scores: dict[int, float] = {n: 1.0 for n in range(1, 46)}
    for num in range(1, 46):
        old_freq = 0.0
        new_freq = 0.0
        old_count = 0
        new_count = 0
        n_win = min(TREND_WINDOWS, len(use_rows) // max(1, window_size))
        for w in range(n_win):
            start = w * window_size
            end = min((w + 1) * window_size, len(use_rows))
            if start >= end:
                continue
            window_rows = use_rows[start:end]
            cnt = sum(1 for _, nums in window_rows if num in nums)
            if w < n_win // 2:
                new_freq += cnt
                new_count += 1
            else:
                old_freq += cnt
                old_count += 1
        old_avg = old_freq / old_count if old_count > 0 else 0
        new_avg = new_freq / new_count if new_count > 0 else 0
        trend = new_avg - old_avg
        scores[num] = 1.0 + trend * 0.5
    return scores


def get_scores(draw_no: int) -> list[float]:
    """
    출현 빈도 및 추세 기법으로 1~45번 각 숫자의 정규화된 점수를 반환합니다.
    길이 45, 합 1.0.
    """
    rows = _fetch_rows(draw_no)
    if len(rows) < MIN_ROWS:
        return [1.0 / 45.0] * 45

    gap_stats = _compute_gap_stats(rows)
    current_gaps = _compute_current_gap(draw_no, rows)

    freq_scores = _compute_freq_scores(rows)
    gap_overdue_scores = _compute_gap_overdue_scores(current_gaps, gap_stats)
    trend_scores = _compute_trend_scores(rows)

    raw_scores: dict[int, float] = {}
    for n in range(1, 46):
        next_prob = _compute_next_appearance_prob(n, current_gaps.get(n, 0), gap_stats)
        raw_scores[n] = (
            WEIGHT_FREQ * freq_scores.get(n, 1.0 / 45.0)
            + WEIGHT_NEXT_PROB * next_prob
            + WEIGHT_GAP_OVERDUE * gap_overdue_scores.get(n, 1.0)
            + WEIGHT_TREND * trend_scores.get(n, 1.0)
        )

    total = sum(raw_scores.values())
    if total <= 0:
        return [1.0 / 45.0] * 45
    return [raw_scores[i] / total for i in range(1, 46)]
