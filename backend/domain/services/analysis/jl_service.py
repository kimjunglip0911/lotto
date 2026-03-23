# -*- coding: utf-8 -*-
"""
JL 휠 시뮬레이션 (연속 등속 감속 물리 모델).

- **기본 시작 번호**: 1회차 ~ ``up_to``회차(공개 당첨) 구간에서 본번호 6개(num1~6) 출현 **누적 합**이 큰 순으로 6개.
  동률(6위권)은 **번호 오름차순**으로 순위를 매겨 6개 확정 (정렬 키: ``(-빈도, 번호)`` 후 상위 6개).
- API/저장 시 ``draw_no``는 ‘대상 회차’로 보고, 공개 데이터는 ``1 .. draw_no-1`` 까지 사용합니다.
- 배치 시뮬(``scripts.run_wheel_52``): 평가 구간 상한 ``up_to=max(draw_nos)`` 에 대해 ``get_global_top6_frequency_starts(up_to)`` 로 **1~up_to회차** 누적 상위 6개를 1회 확정하여 전 회차에 **고정 적용**합니다. 회차 내 세트 생성은 실제 생성과 동일하게 ``generate_jl_wheel_sets(..., dedup_across_sets=True)`` 를 사용해 사후 교체 규칙으로 중복 조합을 해소합니다. API·저장 경로도 동일 규칙입니다.
- **20세트**마다 서로 다른 초기 **speed** 를 적용합니다 (감속도는 정지 시간 고정 규칙에 따라 파생).
- 총 이동 거리: speed^2 / (2 * deceleration), 정지 시간: speed / deceleration
- **실험 규칙**: `FIXED_STOP_TIME` 으로 정지 시간을 고정하고, 세트별로는 **speed만** 바꾼다.  
  `deceleration = speed / FIXED_STOP_TIME` (재시도 시에도 현재 speed에 대해 동일 식 적용).

참고: 로또는 난수 추첨이므로 당첨 보장 불가.
"""
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from infrastructure.persistence.database import get_connection
from domain.services.lotto_rank import rank_lotto_ticket

METHOD_NAME = "JL Wheel Method"
MAX_DUPLICATE_RETRIES = 300
MAX_SET_DEDUP_RETRIES = 50
# 중복 재시도 시 프로파일을 유지하면서 미세 조정
RETRY_SPEED_JITTER = 1.25
# 세트 간 중복 사전 방지 시 speed 미세 조정 폭
PRE_DEDUP_SPEED_JITTER = 0.35

# --- 정지 시간 고정 (당첨 이력: 세트#2가 4등·5등 포함으로 상대적으로 우수 → 해당 stop_time 채택) ---
# stop_time = speed / deceleration → 세트#2: 82.11 / 1.88
FIXED_STOP_TIME: float = 82.11 / 1.88

# --- 20개 기준 속도 (세트#1~20). 감속도는 항상 speed / FIXED_STOP_TIME 으로 파생 ---
# 2026-03-20: 작업지시(5등 1회 세트 튜닝+악화 롤백, seed 42, tune-delta 0.15) 결과 반영.
# 재현:
# ``python -m scripts.run_wheel_52 --seed 42 --tune-reconcile --tune-delta 0.15 --write-history "docs/당첨 이력.md"``
TWENTY_BASE_SPEEDS: List[float] = [
    81.06,
    82.11,
    84.36,
    86.47,
    90.54,
    90.9,
    92.42,
    92.43,
    92.44,
    98.6,
    98.61,
    98.62,
    98.63,
    108.92,
    108.93,
    109.08,
    113.23,
    113.57,
    119.22,
    121.43,
]

TWENTY_SPEED_PROFILES: List[Tuple[float, float]] = [
    (s, s / FIXED_STOP_TIME) for s in TWENTY_BASE_SPEEDS
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
            # 동률이면 큰 번호를 우선 교체(결정적 동작 보장)
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
    base_speed: float,
    base_decel: float,
    fixed_stop_time: Optional[float],
    seen_sets: set[frozenset[int]],
    max_attempts: int = MAX_SET_DEDUP_RETRIES,
) -> List[int]:
    """
    세트 생성 단계에서 중복을 사전 방지한다.

    중복이면 시작번호 다양화 + speed 미세 조정을 적용해 재생성한다.
    """
    for attempt in range(max_attempts):
        starts = _diversify_start_nums(top6, set_index, attempt)
        speed_jitter = PRE_DEDUP_SPEED_JITTER * attempt
        speed = base_speed + (speed_jitter if attempt % 2 == 0 else -speed_jitter)
        speed = max(65.0, min(135.0, speed))
        nums, _ = draw_six_with_profile(
            starts,
            speed,
            base_decel,
            fixed_stop_time=fixed_stop_time,
        )
        key = frozenset(nums)
        if key not in seen_sets:
            return nums
    # 사전 방지로도 유니크 확보 실패 시 마지막 시도 결과를 fallback으로 반환
    nums, _ = draw_six_with_profile(
        _diversify_start_nums(top6, set_index, max_attempts - 1),
        base_speed,
        base_decel,
        fixed_stop_time=fixed_stop_time,
    )
    return nums


def get_top6_frequency_starts(draw_no: int) -> List[int]:
    """
    하위 호환: ``draw_no`` **미만** 회차만 집계 (과거 ‘해당 회차 직전까지’ 규칙).

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
) -> Tuple[List[int], List[WheelOutcome]]:
    """
    start_nums 길이 6: 각 휠의 시작 번호.
    6휠을 돌리되, 중복 시 speed에 지터를 줍니다.

    fixed_stop_time이 주어지면 매 시도마다 ``deceleration = speed / fixed_stop_time`` 으로 두어
    정지 시간을 일정하게 유지합니다. None이면 ``base_decel`` 을 그대로 씁니다.
    """
    if len(start_nums) != 6:
        raise ValueError("start_nums must have length 6")
    if fixed_stop_time is not None and fixed_stop_time <= 0:
        raise ValueError("fixed_stop_time must be positive when set")
    selected: List[int] = []
    outcomes: List[WheelOutcome] = []

    for wheel_idx, start in enumerate(start_nums):
        attempts = 0
        while attempts < max_retries_per_wheel:
            jitter = attempts * RETRY_SPEED_JITTER * (1.0 if attempts % 2 == 0 else -1.0)
            sp = max(65.0, min(135.0, base_speed + jitter))
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
    fixed_stop_time: Optional[float] = FIXED_STOP_TIME,
    fixed_start_nums: Optional[List[int]] = None,
    dedup_across_sets: bool = True,
    prevent_duplicates_before_replace: bool = True,
) -> List[Dict[str, object]]:
    """
    **시작 번호**: ``fixed_start_nums`` 가 있으면 그 6개를 사용(시뮬에서 회차 공통 고정).
    없으면 대상 회차 ``draw_no`` 기준 공개 데이터 ``1 .. draw_no-1`` 까지의 전역 누적 상위 6개
    (``get_global_top6_frequency_starts(draw_no - 1)``).

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
    profs = profiles if profiles is not None else TWENTY_SPEED_PROFILES
    if len(profs) < count:
        raise ValueError("프로파일 개수가 count보다 부족합니다.")

    if fixed_start_nums is not None:
        if len(fixed_start_nums) != 6:
            raise ValueError("fixed_start_nums 는 길이 6이어야 합니다.")
        top6 = [int(x) for x in fixed_start_nums]
        for n in top6:
            if not 1 <= n <= 45:
                raise ValueError("fixed_start_nums 는 1~45 정수여야 합니다.")
        if len(set(top6)) != 6:
            raise ValueError("fixed_start_nums 는 서로 달라야 합니다.")
    elif draw_no <= 1:
        top6 = [1, 2, 3, 4, 5, 6]
    else:
        top6 = get_global_top6_frequency_starts(draw_no - 1)
    from domain.services.generator_service import AI_METHODS

    results: List[Dict[str, object]] = []
    generated_nums: List[List[int]] = []
    generated_meta: List[Tuple[float, float, List[int], str]] = []
    seen_set_keys: set[frozenset[int]] = set()

    for i in range(count):
        speed, decel = profs[i]
        current_starts = _diversify_start_nums(top6, i, 0)
        row_decel = speed / fixed_stop_time if fixed_stop_time is not None else decel

        if prevent_duplicates_before_replace:
            nums = _draw_unique_set_with_variants(
                top6=top6,
                set_index=i,
                base_speed=speed,
                base_decel=decel,
                fixed_stop_time=fixed_stop_time,
                seen_sets=seen_set_keys,
            )
        else:
            nums, _ = draw_six_with_profile(
                current_starts,
                speed,
                decel,
                fixed_stop_time=fixed_stop_time,
            )
        base = AI_METHODS[(start_index + i) % len(AI_METHODS)]
        method = f"{METHOD_NAME} ({base})"
        generated_nums.append(sorted(nums))
        generated_meta.append((speed, row_decel, current_starts, method))
        seen_set_keys.add(frozenset(nums))

    if dedup_across_sets:
        freq_scope = draw_no - 1 if draw_no > 1 else 0
        freq_counter = _get_number_frequency_counter(freq_scope)
        replacement_pool = _replacement_pool_from_frequency(freq_counter, size=20)
        generated_nums = _replace_duplicate_sets_by_frequency(
            generated_nums, freq=freq_counter, replacement_pool=replacement_pool
        )

    for i in range(count):
        speed, row_decel, current_starts, method = generated_meta[i]
        nums = generated_nums[i]
        results.append(
            _row_dict(
                nums,
                method,
                set_index=i + 1,
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
