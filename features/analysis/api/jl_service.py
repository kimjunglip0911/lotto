# -*- coding: utf-8 -*-
"""
JL 휠 시뮬레이션 (연속 등속 감속 물리 모델).

- **기본 시작 번호**: 대상 회차 ``draw_no`` 의 **직전 회차(`draw_no-1`) 당첨 본번호 6개**.
- API/저장 시 ``draw_no``는 '대상 회차'로 보고, 시작번호는 ``draw_no-1`` 당첨번호를 사용합니다.
- 배치 시뮬(``scripts.run_wheel_52``): 각 평가 회차마다 해당 회차의 직전 회차 당첨번호를 시작번호로 사용합니다.
- **20세트**마다 서로 다른 초기 **speed** 를 적용합니다 (감속도는 정지 시간 고정 규칙에 따라 파생).
- 총 이동 거리: speed^2 / (2 * deceleration), 정지 시간: speed / deceleration
- **실험 규칙**: `FIXED_STOP_TIME` 으로 정지 시간을 고정하고, 세트별로는 **speed만** 바꾼다.  
  `deceleration = speed / FIXED_STOP_TIME` (재시도 시에도 현재 speed에 대해 동일 식 적용).

참고: 로또는 난수 추첨이므로 당첨 보장 불가.
"""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Any, Dict, List, Literal, Optional, Tuple

from backend.database import get_connection
from backend.domain.services.lotto_rank import rank_lotto_ticket

METHOD_NAME = "JL Wheel Method"
MAX_DUPLICATE_RETRIES = 300
MAX_SET_DEDUP_RETRIES = 50
RETRY_SPEED_JITTER = 1.25
PRE_DEDUP_SPEED_JITTER = 0.35

# --- jitter 호환용 내부 상수 (결과 동일성 보존 목적) ---
# 외부 모델은 offset 중심으로 전환하지만, 중복 재시도(jitter)는 기존 speed 기반 계산을 유지.
_FIXED_STOP_TIME: float = 82.11 / 1.88
_JITTER_K: float = _FIXED_STOP_TIME / 2.0

# 세트#1~20의 내부 jitter 기준 speed (기존 값 유지)
_JITTER_BASE_SPEEDS: List[float] = [
    81.06,
    82.57,
    83.58,
    89.59,
    90.6,
    90.9,
    90.91,
    91.42,
    96.43,
    97.94,
    98.61,
    98.62,
    108.63,
    108.92,
    108.93,
    110.44,
    112.45,
    113.46,
    117.97,
    123.98,
]

# 외부 공개 파라미터: 세트#1~20의 기준 offset (0~44)
TWENTY_BASE_OFFSETS: List[int] = [int(s * _JITTER_K) % 45 for s in _JITTER_BASE_SPEEDS]

# 하위 호환(외부 참조 유지): 점진적 전환을 위해 기존 식별자 제공
FIXED_STOP_TIME: float = _FIXED_STOP_TIME
TWENTY_BASE_SPEEDS: List[float] = list(_JITTER_BASE_SPEEDS)
TWENTY_SPEED_PROFILES: List[Tuple[float, float]] = [
    (s, s / FIXED_STOP_TIME) for s in TWENTY_BASE_SPEEDS
]

# 6휠 독립 speed offset (boundary_delta 배수).
# mod45 기준 약 7.5칸 간격으로 분산 → 각 번호가 서로 다른 칸수만큼 이동.
WHEEL_OFFSET_STEPS: List[int] = [0, 1, 3, 6, 10, 15]


def _derive_wheel_speeds(
    base_speed: float,
    offsets: Optional[List[int]] = None,
) -> List[float]:
    """base_speed로부터 6개 독립 wheel speed를 도출."""
    steps = offsets if offsets is not None else WHEEL_OFFSET_STEPS
    k = _JITTER_K
    delta = 1.0 / k
    return [base_speed + s * delta for s in steps]


def _speed_from_offset(offset: int, set_index: int) -> float:
    """
    offset(0~44)를 내부 jitter 계산용 speed로 변환한다.

    - 기본은 세트별 기존 speed를 우선 사용해 결과 동일성을 보존.
    - 세트 외 범위는 수학적 역변환(offset / K)으로 fallback.
    """
    if not 0 <= offset <= 44:
        raise ValueError("offset must be in 0..44")
    if 0 <= set_index < len(_JITTER_BASE_SPEEDS):
        return float(_JITTER_BASE_SPEEDS[set_index])
    return float(offset) / _JITTER_K

AI_METHODS = [
    "MLP TOP6 (Pure)",
    "MLP TOP6 (Prob)",
    "RF TOP6 (Pure)",
    "RF TOP6 (Prob)",
    "군집화 및 PCA (Fallback)",
    "군집화 및 PCA (Fallback)",
    "회귀 분석 (Fallback)",
    "회귀 분석 (Fallback)",
    "LightGBM 앙상블",
    "XGBoost 패턴 예측",
    "LSTM 시계열 분석",
    "LSTM 시계열 (변동값)",
    "Transformer 어텐션",
    "몬테카를로 시뮬레이션",
    "순서 통계량 (이론 vs 실제)",
    "이동 평균 (EMA) 분석",
    "과거 당첨 빈도 유사도 (KNN)",
    "출현 주기 (Gap) 극대화",
    "생성형 적대 신경망 (GAN)",
    "심층 강화학습 (RL) 추천",
]


@dataclass(frozen=True)
class WheelOutcome:
    number: int
    initial_speed: float
    deceleration: float
    total_distance: float
    stop_time: float


def _top6_from_frequency_counter(freq: Counter[int]) -> List[int]:
    """빈도 상위 6개. 타이브레이크: 빈도 내림차순, 동률이면 번호 오름차순."""
    if not freq:
        return [1, 2, 3, 4, 5, 6]
    ordered = sorted(freq.items(), key=lambda x: (-x[1], x[0]))
    top6 = [n for n, _ in ordered[:6]]
    while len(top6) < 6:
        for c in range(1, 46):
            if c not in top6:
                top6.append(c)
            if len(top6) >= 6:
                break
    return top6[:6]


def _get_number_frequency_counter(up_to_draw_inclusive: int) -> Counter[int]:
    """1~up_to_draw_inclusive 본번호(num1~6) 기준 번호별 누적 빈도."""
    if up_to_draw_inclusive < 1:
        return Counter()
    conn = get_connection()
    conn.row_factory = None
    cur = conn.cursor()
    cur.execute(
        """
        SELECT num1, num2, num3, num4, num5, num6
        FROM lotto_winners
        WHERE draw_no >= 1 AND draw_no <= ?
        """,
        (up_to_draw_inclusive,),
    )
    freq: Counter[int] = Counter()
    for row in cur.fetchall():
        for n in row:
            if isinstance(n, int) and 1 <= n <= 45:
                freq[n] += 1
    conn.close()
    return freq


def get_global_top6_frequency_starts(up_to_draw_inclusive: int) -> List[int]:
    """
    **1회차 ~ up_to_draw_inclusive 회차**까지 공개된 당첨 본번호(num1~6)만 누적하여
    번호별 출현 합이 가장 큰 6개를 반환합니다.

    - 타이브레이크(6위권 동점 등): 빈도가 같으면 **번호 오름차순**으로 앞선 번호가 유리
      (정렬 키 ``(-빈도, 번호)`` 상위 6개).
    """
    if up_to_draw_inclusive < 1:
        return [1, 2, 3, 4, 5, 6]

    freq = _get_number_frequency_counter(up_to_draw_inclusive)
    return _top6_from_frequency_counter(freq)


def _replacement_pool_from_frequency(
    freq: Counter[int], size: int = 20
) -> List[int]:
    """빈도 하위 번호 풀(동률 시 번호 오름차순)."""
    ordered = sorted(((n, freq.get(n, 0)) for n in range(1, 46)), key=lambda x: (x[1], x[0]))
    return [n for n, _ in ordered[: max(1, min(size, 45))]]


def _replace_duplicate_sets_by_frequency(
    set_nums: List[List[int]],
    *,
    freq: Counter[int],
    replacement_pool: List[int],
) -> List[List[int]]:
    """
    세트#1은 유지하고, 세트#2부터 중복 조합이면 교체 풀 번호로 치환한다.

    - 교체 대상: 해당 세트 6개 중 누적 빈도가 가장 큰 번호 1개
    - 교체 번호: 교체 풀에서 낮은 번호부터 순차 사용(전역 커서 방식)
    """
    if not set_nums:
        return set_nums

    replaced: List[List[int]] = [sorted(set_nums[0])]
    replacement_cursor = 0
    pool_len = len(replacement_pool)
    if pool_len == 0:
        return [sorted(nums) for nums in set_nums]

    for nums in set_nums[1:]:
        candidate_nums = sorted(nums)
        while frozenset(candidate_nums) in {frozenset(x) for x in replaced}:
            max_freq = max(freq.get(n, 0) for n in candidate_nums)
            target = max((n for n in candidate_nums if freq.get(n, 0) == max_freq))
            target_index = candidate_nums.index(target)

            replacement_number: Optional[int] = None
            scanned = 0
            while scanned < pool_len:
                rep = replacement_pool[(replacement_cursor + scanned) % pool_len]
                if rep not in candidate_nums:
                    replacement_number = rep
                    replacement_cursor = (replacement_cursor + scanned + 1) % pool_len
                    break
                scanned += 1
            if replacement_number is None:
                break
            candidate_nums[target_index] = replacement_number
            candidate_nums = sorted(candidate_nums)
        replaced.append(candidate_nums)
    return replaced


def _rows_to_number_lists(rows: List[Dict[str, object]]) -> List[List[int]]:
    return [
        [
            int(r["num1"]),
            int(r["num2"]),
            int(r["num3"]),
            int(r["num4"]),
            int(r["num5"]),
            int(r["num6"]),
        ]
        for r in rows
    ]


def _find_duplicate_groups(set_nums: List[List[int]]) -> List[Dict[str, object]]:
    """
    동일 조합이 반복된 세트 그룹을 반환.
    예: set#2, set#7 이 동일하면 {"set_indexes":[2,7], "numbers":[...]}
    """
    groups: Dict[Tuple[int, ...], List[int]] = {}
    for i, nums in enumerate(set_nums, start=1):
        key = tuple(sorted(int(x) for x in nums))
        groups.setdefault(key, []).append(i)
    out: List[Dict[str, object]] = []
    for key, indexes in groups.items():
        if len(indexes) >= 2:
            out.append({"set_indexes": indexes, "numbers": list(key), "count": len(indexes)})
    out.sort(key=lambda x: (-int(x["count"]), x["set_indexes"][0]))  # type: ignore[index]
    return out


def _fetch_winner_for_draw(draw_no: int) -> Optional[Tuple[set[int], int]]:
    conn = get_connection()
    conn.row_factory = None
    cur = conn.cursor()
    cur.execute(
        """
        SELECT num1, num2, num3, num4, num5, num6, bonus_num
        FROM lotto_winners
        WHERE draw_no = ?
        """,
        (draw_no,),
    )
    row = cur.fetchone()
    conn.close()
    if row is None:
        return None
    main = {int(row[0]), int(row[1]), int(row[2]), int(row[3]), int(row[4]), int(row[5])}
    bonus = int(row[6] or 0)
    return main, bonus


def get_previous_draw_winning_starts(draw_no: int) -> List[int]:
    """
    대상 회차 ``draw_no`` 의 직전 회차(``draw_no-1``) 당첨 본번호 6개를 반환.

    - draw_no <= 1 이면 기본값 ``[1..6]`` 반환
    - 직전 회차 데이터가 없으면 fallback 으로 누적 TOP6 반환
    """
    if draw_no <= 1:
        return [1, 2, 3, 4, 5, 6]
    prev = _fetch_winner_for_draw(draw_no - 1)
    if prev is None:
        return get_global_top6_frequency_starts(draw_no - 1)
    main, _ = prev
    return sorted(int(x) for x in main)


def _fetch_recent_main_sets(end_draw_inclusive: int, window: int) -> List[set[int]]:
    """end_draw_inclusive 기준 최근 window회 본번호 집합을 반환."""
    if end_draw_inclusive <= 0 or window <= 0:
        return []
    conn = get_connection()
    conn.row_factory = None
    cur = conn.cursor()
    cur.execute(
        """
        SELECT num1, num2, num3, num4, num5, num6
        FROM lotto_winners
        WHERE draw_no >= 1 AND draw_no <= ?
        ORDER BY draw_no DESC
        LIMIT ?
        """,
        (end_draw_inclusive, window),
    )
    rows = cur.fetchall()
    conn.close()
    return [{int(r[0]), int(r[1]), int(r[2]), int(r[3]), int(r[4]), int(r[5])} for r in rows]


def get_blended_start_nums(
    draw_no: int,
    *,
    hot_window: int = 20,
    overdue_window: int = 30,
) -> List[int]:
    """
    D-1용 시작번호 블렌딩.

    - 직전 회차 번호(재출현 경향): 강가중
    - 최근 hot_window 핫번호: 중가중
    - 최근 overdue_window 미출현(과숙) 번호: 약가중
    """
    if draw_no <= 1:
        return [1, 2, 3, 4, 5, 6]
    end_draw = draw_no - 1
    prev_starts = get_previous_draw_winning_starts(draw_no)
    freq_window = _get_number_frequency_counter(max(1, end_draw - hot_window + 1))
    recent_sets = _fetch_recent_main_sets(end_draw, hot_window)
    recent_freq: Counter[int] = Counter()
    for s in recent_sets:
        for n in s:
            recent_freq[n] += 1
    overdue_sets = _fetch_recent_main_sets(end_draw, overdue_window)
    overdue_recent_union = set().union(*overdue_sets) if overdue_sets else set()

    scores: Dict[int, float] = {n: 0.0 for n in range(1, 46)}

    for n in prev_starts:
        scores[n] += 3.0

    hot_ranked = sorted(((n, recent_freq.get(n, 0)) for n in range(1, 46)), key=lambda x: (-x[1], x[0]))
    for rank, (n, _) in enumerate(hot_ranked[:15], start=1):
        scores[n] += max(0.0, 2.0 - (rank - 1) * 0.1)

    overdue_candidates = [n for n in range(1, 46) if n not in overdue_recent_union]
    for n in overdue_candidates[:10]:
        scores[n] += 0.9

    for n in range(1, 46):
        scores[n] += min(1.2, freq_window.get(n, 0) / 100.0)

    top6 = [n for n, _ in sorted(scores.items(), key=lambda x: (-x[1], x[0]))[:6]]
    return sorted(top6)


def _build_hit_rows(
    rows: List[Dict[str, object]],
    winning_main: set[int],
    bonus: int,
) -> List[Dict[str, object]]:
    hits: List[Dict[str, object]] = []
    for r in rows:
        nums = {
            int(r["num1"]),
            int(r["num2"]),
            int(r["num3"]),
            int(r["num4"]),
            int(r["num5"]),
            int(r["num6"]),
        }
        rank = rank_lotto_ticket(winning_main, bonus, nums)
        if rank is None:
            continue
        hits.append(
            {
                "set_index": int(r["set_index"]),
                "rank": int(rank),
                "numbers": sorted(nums),
                "speed": float(r["profile_speed"]),
                "deceleration": float(r["profile_deceleration"]),
            }
        )
    hits.sort(key=lambda x: (int(x["rank"]), int(x["set_index"])))  # type: ignore[index]
    return hits


def analyze_draw_duplicate_sets(draw_no: int, *, count: int = 20) -> Dict[str, Any]:
    """
    특정 회차의 세트 중복(교체 전/후)과 당첨 세트 번호를 함께 분석.

    - raw_pre_replace: 시작번호 다양화/사후교체 모두 비활성
    - diversified_pre_replace: 시작번호 다양화만 활성, 사후교체 비활성
    - final_post_replace: 시작번호 다양화 + 사후교체 활성(현재 기본 동작)
    """
    if draw_no <= 0:
        raise ValueError("draw_no must be positive")
    if not 1 <= count <= 20:
        raise ValueError("count는 1~20만 허용합니다.")

    winner = _fetch_winner_for_draw(draw_no)
    if winner is None:
        raise ValueError(f"draw_no={draw_no} 당첨 데이터가 없습니다.")
    winning_main, bonus = winner

    raw_rows = generate_jl_wheel_sets(
        draw_no,
        count=count,
        dedup_across_sets=False,
        prevent_duplicates_before_replace=False,
    )
    diversified_rows = generate_jl_wheel_sets(
        draw_no,
        count=count,
        dedup_across_sets=False,
        prevent_duplicates_before_replace=True,
    )
    final_rows = generate_jl_wheel_sets(
        draw_no,
        count=count,
        dedup_across_sets=True,
        prevent_duplicates_before_replace=True,
    )

    raw_nums = _rows_to_number_lists(raw_rows)
    diversified_nums = _rows_to_number_lists(diversified_rows)
    final_nums = _rows_to_number_lists(final_rows)

    return {
        "draw_no": draw_no,
        "count": count,
        "winning_numbers": sorted(winning_main),
        "bonus_number": bonus,
        "raw_pre_replace": {
            "duplicate_groups": _find_duplicate_groups(raw_nums),
            "duplicate_set_count": sum(
                len(g["set_indexes"]) for g in _find_duplicate_groups(raw_nums)  # type: ignore[index]
            ),
            "hit_sets": _build_hit_rows(raw_rows, winning_main, bonus),
        },
        "diversified_pre_replace": {
            "duplicate_groups": _find_duplicate_groups(diversified_nums),
            "duplicate_set_count": sum(
                len(g["set_indexes"]) for g in _find_duplicate_groups(diversified_nums)  # type: ignore[index]
            ),
            "hit_sets": _build_hit_rows(diversified_rows, winning_main, bonus),
        },
        "final_post_replace": {
            "duplicate_groups": _find_duplicate_groups(final_nums),
            "duplicate_set_count": sum(
                len(g["set_indexes"]) for g in _find_duplicate_groups(final_nums)  # type: ignore[index]
            ),
            "hit_sets": _build_hit_rows(final_rows, winning_main, bonus),
        },
    }


def _rotate_start_nums(top6: List[int], shift: int) -> List[int]:
    """길이 6 시작번호를 결정적으로 회전."""
    if len(top6) != 6:
        raise ValueError("top6 must have length 6")
    k = shift % 6
    if k == 0:
        return list(top6)
    return list(top6[k:] + top6[:k])


def _diversify_start_nums(top6: List[int], set_index: int, attempt: int) -> List[int]:
    """
    세트별 시작번호를 다양화한다.

    - set_index/attempt 조합으로 회전량을 달리해 교체 전 중복을 줄인다.
    - 일부 시도에서는 양 끝 번호를 교환해 동일 회전 반복을 피한다.
    """
    base = _rotate_start_nums(top6, set_index + attempt)
    if ((set_index + attempt) // 6) % 2 == 1:
        base[0], base[-1] = base[-1], base[0]
    return base


def _draw_unique_set_with_variants(
    *,
    top6: List[int],
    set_index: int,
    base_offset: int,
    set_index_for_speed: int,
    base_decel: float,
    fixed_stop_time: Optional[float],
    seen_sets: set[frozenset[int]],
    max_attempts: int = MAX_SET_DEDUP_RETRIES,
    independent_wheels: bool = False,
) -> List[int]:
    """
    세트 생성 단계에서 중복을 사전 방지한다.

    중복이면 시작번호 다양화 + jitter(내부 speed 기반)를 적용해 재생성한다.
    independent_wheels=True 이면 6휠 각각에 독립 speed를 부여한다.
    """
    for attempt in range(max_attempts):
        starts = _diversify_start_nums(top6, set_index, attempt)
        base_speed = _speed_from_offset(base_offset, set_index_for_speed)
        speed_jitter = PRE_DEDUP_SPEED_JITTER * attempt
        speed = base_speed + (speed_jitter if attempt % 2 == 0 else -speed_jitter)
        speed = max(65.0, min(135.0, speed))
        ws = _derive_wheel_speeds(speed) if independent_wheels else None
        nums, _ = draw_six_with_profile(
            starts,
            speed,
            base_decel,
            fixed_stop_time=fixed_stop_time,
            wheel_speeds=ws,
        )
        key = frozenset(nums)
        if key not in seen_sets:
            return nums
    fallback_speed = _speed_from_offset(base_offset, set_index_for_speed)
    ws = _derive_wheel_speeds(fallback_speed) if independent_wheels else None
    nums, _ = draw_six_with_profile(
        _diversify_start_nums(top6, set_index, max_attempts - 1),
        fallback_speed,
        base_decel,
        fixed_stop_time=fixed_stop_time,
        wheel_speeds=ws,
    )
    return nums


def get_top6_frequency_starts(draw_no: int) -> List[int]:
    """
    하위 호환: ``draw_no`` **미만** 회차만 집계 (과거 '해당 회차 직전까지' 규칙).

    신규 기본 로직은 ``get_global_top6_frequency_starts(draw_no - 1)`` 과 동치입니다.
    """
    if draw_no <= 1:
        return [1, 2, 3, 4, 5, 6]
    return get_global_top6_frequency_starts(draw_no - 1)


def _total_distance_continuous(initial_speed: float, deceleration: float) -> float:
    if deceleration <= 0:
        raise ValueError("deceleration must be positive")
    return (initial_speed**2) / (2.0 * deceleration)


def _stop_time_continuous(initial_speed: float, deceleration: float) -> float:
    if deceleration <= 0:
        raise ValueError("deceleration must be positive")
    return initial_speed / deceleration


def simulate_wheel_continuous(
    start_num: int,
    *,
    initial_speed: float,
    deceleration: float,
) -> WheelOutcome:
    if not 1 <= start_num <= 45:
        raise ValueError("start_num must be in 1..45")
    speed = float(initial_speed)
    decel = float(deceleration)
    dist = _total_distance_continuous(speed, decel)
    t_stop = _stop_time_continuous(speed, decel)
    idx = (start_num - 1 + int(dist)) % 45
    return WheelOutcome(
        number=idx + 1,
        initial_speed=speed,
        deceleration=decel,
        total_distance=dist,
        stop_time=t_stop,
    )


def draw_six_with_profile(
    start_nums: List[int],
    base_speed: float,
    base_decel: float,
    *,
    max_retries_per_wheel: int = MAX_DUPLICATE_RETRIES,
    fixed_stop_time: Optional[float] = None,
    wheel_speeds: Optional[List[float]] = None,
) -> Tuple[List[int], List[WheelOutcome]]:
    """
    start_nums 길이 6: 각 휠의 시작 번호.
    6휠을 돌리되, 중복 시 speed에 지터를 줍니다.

    wheel_speeds 가 주어지면 각 휠이 독립 speed를 사용합니다 (길이 6).
    미제공 시 모든 휠이 base_speed를 공유합니다 (기존 동작).

    fixed_stop_time이 주어지면 매 시도마다 ``deceleration = speed / fixed_stop_time`` 으로 두어
    정지 시간을 일정하게 유지합니다. None이면 ``base_decel`` 을 그대로 씁니다.
    """
    if len(start_nums) != 6:
        raise ValueError("start_nums must have length 6")
    if fixed_stop_time is not None and fixed_stop_time <= 0:
        raise ValueError("fixed_stop_time must be positive when set")
    if wheel_speeds is not None and len(wheel_speeds) != 6:
        raise ValueError("wheel_speeds must have length 6")
    selected: List[int] = []
    outcomes: List[WheelOutcome] = []

    for wheel_idx, start in enumerate(start_nums):
        nominal = wheel_speeds[wheel_idx] if wheel_speeds else base_speed
        attempts = 0
        while attempts < max_retries_per_wheel:
            jitter = attempts * RETRY_SPEED_JITTER * (1.0 if attempts % 2 == 0 else -1.0)
            sp = max(65.0, min(135.0, nominal + jitter))
            if fixed_stop_time is not None:
                decel = sp / fixed_stop_time
            else:
                decel = base_decel
            out = simulate_wheel_continuous(start, initial_speed=sp, deceleration=decel)
            attempts += 1
            if out.number not in selected:
                selected.append(out.number)
                outcomes.append(out)
                break
        else:
            raise RuntimeError(
                f"draw_six_with_profile: wheel {wheel_idx} exceeded retries"
            )

    selected.sort()
    return selected, outcomes


def _row_dict(
    nums: List[int],
    method: str,
    *,
    set_index: int,
    offset: int,
    speed: float,
    deceleration: float,
    top6_starts: List[int],
) -> Dict[str, object]:
    return {
        "num1": nums[0],
        "num2": nums[1],
        "num3": nums[2],
        "num4": nums[3],
        "num5": nums[4],
        "num6": nums[5],
        "method": method,
        "set_index": set_index,
        "profile_offset": int(offset),
        "profile_speed": round(speed, 4),
        "profile_deceleration": round(deceleration, 4),
        "top6_starts": list(top6_starts),
    }


def generate_jl_wheel_sets(
    draw_no: int,
    count: int = 20,
    *,
    start_index: int = 0,
    profiles: Optional[List[Tuple[float, float]]] = None,
    offsets: Optional[List[int]] = None,
    fixed_stop_time: Optional[float] = FIXED_STOP_TIME,
    fixed_start_nums: Optional[List[int]] = None,
    start_strategy: Literal["previous", "blended", "frequency"] = "previous",
    dedup_across_sets: bool = True,
    prevent_duplicates_before_replace: bool = True,
    independent_wheels: bool = False,
) -> List[Dict[str, object]]:
    """
    **시작 번호**: ``fixed_start_nums`` 가 있으면 그 6개를 사용.
    없으면 대상 회차 ``draw_no`` 의 직전 회차(``draw_no-1``) 당첨 본번호 6개를 사용.

    속도 프로파일: count=20 기본. ``fixed_stop_time`` 이 있으면 세트별 ``deceleration = speed / 고정값``.

    과거처럼 (speed, decel) 쌍을 그대로 쓰려면 ``fixed_stop_time=None`` 을 넘깁니다.

    ``prevent_duplicates_before_replace`` (기본 True): 세트 생성 단계에서 시작번호 회전/미세 speed 조정으로
    이전 세트와 동일 조합 생성을 줄입니다.

    ``dedup_across_sets`` (기본 True): 같은 회차에서 이전 세트와 6조합이 겹치면
    세트#2부터 해당 세트의 '누적 빈도 최다 번호 1개'를 '빈도 하위 20개 번호 풀'에서
    낮은 번호부터 순차 치환해 중복을 해소합니다.
    ``False`` 는 회차 내 세트를 독립 생성(작업지시: 세트 간 **속도만** 비교하는 52회차 평가용).
    """
    if not 1 <= count <= 20:
        raise ValueError("count는 1~20만 허용합니다.")
    offs = offsets if offsets is not None else TWENTY_BASE_OFFSETS
    if len(offs) < count:
        raise ValueError("offset 개수가 count보다 부족합니다.")

    if fixed_start_nums is not None:
        if len(fixed_start_nums) != 6:
            raise ValueError("fixed_start_nums 는 길이 6이어야 합니다.")
        top6 = [int(x) for x in fixed_start_nums]
        for n in top6:
            if not 1 <= n <= 45:
                raise ValueError("fixed_start_nums 는 1~45 정수여야 합니다.")
        if len(set(top6)) != 6:
            raise ValueError("fixed_start_nums 는 서로 달라야 합니다.")
    else:
        if start_strategy == "blended":
            top6 = get_blended_start_nums(draw_no)
        elif start_strategy == "frequency":
            top6 = get_global_top6_frequency_starts(draw_no - 1)
        else:
            top6 = get_previous_draw_winning_starts(draw_no)
    results: List[Dict[str, object]] = []
    generated_nums: List[List[int]] = []
    generated_meta: List[Tuple[int, float, float, List[int], str]] = []
    seen_set_keys: set[frozenset[int]] = set()

    for i in range(count):
        offset = int(offs[i]) % 45
        speed = _speed_from_offset(offset, i)
        decel = speed / FIXED_STOP_TIME
        current_starts = _diversify_start_nums(top6, i, 0)
        row_decel = speed / fixed_stop_time if fixed_stop_time is not None else decel

        ws = _derive_wheel_speeds(speed) if independent_wheels else None
        if prevent_duplicates_before_replace:
            nums = _draw_unique_set_with_variants(
                top6=top6,
                set_index=i,
                base_offset=offset,
                set_index_for_speed=i,
                base_decel=decel,
                fixed_stop_time=fixed_stop_time,
                seen_sets=seen_set_keys,
                independent_wheels=independent_wheels,
            )
        else:
            nums, _ = draw_six_with_profile(
                current_starts,
                speed,
                decel,
                fixed_stop_time=fixed_stop_time,
                wheel_speeds=ws,
            )
        base = AI_METHODS[(start_index + i) % len(AI_METHODS)]
        method = f"{METHOD_NAME} ({base})"
        generated_nums.append(sorted(nums))
        generated_meta.append((offset, speed, row_decel, current_starts, method))
        seen_set_keys.add(frozenset(nums))

    if dedup_across_sets:
        freq_scope = draw_no - 1 if draw_no > 1 else 0
        freq_counter = _get_number_frequency_counter(freq_scope)
        replacement_pool = _replacement_pool_from_frequency(freq_counter, size=20)
        generated_nums = _replace_duplicate_sets_by_frequency(
            generated_nums, freq=freq_counter, replacement_pool=replacement_pool
        )

    for i in range(count):
        offset, speed, row_decel, current_starts, method = generated_meta[i]
        nums = generated_nums[i]
        results.append(
            _row_dict(
                nums,
                method,
                set_index=i + 1,
                offset=offset,
                speed=speed,
                deceleration=row_decel,
                top6_starts=current_starts,
            )
        )
    return results


# --- 하위 호환: 기존 wheel_simulator_service 호출부용 별칭 ---
def generate_wheel_sets(
    count: int = 20,
    start_index: int = 0,
    draw_no: int | None = None,
    **kwargs: object,
) -> List[Dict[str, object]]:
    """
    draw_no가 있으면 JL 규칙(TOP6 + 프로파일). 없으면 최신 회차+1 추정.
    kwargs 무시(구 API 호환).
    """
    _ = kwargs
    if draw_no is None:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT COALESCE(MAX(draw_no), 0) + 1 FROM lotto_winners")
        draw_no = int(cur.fetchone()[0])
        conn.close()
    c = min(20, max(1, count))
    return generate_jl_wheel_sets(draw_no, count=c, start_index=start_index)


def find_speed_decel_for_number(
    target: int,
    *,
    speed_min: float = 80.0,
    speed_max: float = 120.0,
    decel_min: float = 0.5,
    decel_max: float = 2.0,
    decel_step: float = 0.01,
    speed_step: float = 0.1,
    start_num: int = 1,
) -> Optional[Tuple[float, float]]:
    if not 1 <= target <= 45:
        raise ValueError("target must be in 1..45")
    want_idx = (target - 1) % 45
    s = speed_min
    while s <= speed_max + 1e-9:
        d = decel_min
        while d <= decel_max + 1e-9:
            dist = _total_distance_continuous(s, d)
            idx = (start_num - 1 + int(dist)) % 45
            if idx == want_idx:
                return (round(s, 6), round(d, 6))
            d += decel_step
        s += speed_step
    return None


def find_params_for_six_numbers(
    targets: List[int],
    *,
    start_num: int = 1,
) -> Optional[List[Tuple[float, float]]]:
    if len(targets) != 6 or len(set(targets)) != 6:
        raise ValueError("targets must be 6 distinct numbers in 1..45")
    params: List[Tuple[float, float]] = []
    for t in targets:
        pair = find_speed_decel_for_number(t, start_num=start_num)
        if pair is None:
            return None
        params.append(pair)
    return params
