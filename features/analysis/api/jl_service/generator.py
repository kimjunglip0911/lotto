# -*- coding: utf-8 -*-
"""
JL 휠 — 세트 생성 엔진.

20세트 번호를 생성하는 파이프라인:
  1) 시작번호 결정 (직전 회차 당첨번호 6개, 고정)
  2) 세트별 시작번호 조합 다양화 (회전 + 교환)
  3) 세트별 offset → steps 변환 (physics)
  4) 6휠 드로우 + 사전 중복 방지 (physics + dedup)
  5) 조합 교정 (합계/홀짝/고저 위반 시 번호 교체)
  6) 사후 중복 교체 (dedup)
"""
from __future__ import annotations

from collections import Counter
from typing import Dict, List, Optional, Sequence, Tuple

from backend.database import get_connection

from .config import (
    COMBO_FILTER_HIGH_MAX,
    COMBO_FILTER_HIGH_MIN,
    COMBO_FILTER_ODD_MAX,
    COMBO_FILTER_ODD_MIN,
    COMBO_FILTER_SUM_MAX,
    COMBO_FILTER_SUM_MIN,
    METHOD_NAME,
    TWENTY_BASE_OFFSETS,
)
from .dedup import (
    _diversify_start_nums,
    _draw_unique_set_with_variants,
    _replace_duplicate_sets_by_frequency,
    _replacement_pool_from_frequency,
)
from .physics import (
    _derive_wheel_steps,
    _steps_from_offset,
    draw_six,
)
from .start_numbers import (
    _get_number_frequency_counter,
    get_previous_draw_winning_starts,
)


# ── 헬퍼 ─────────────────────────────────────────────────────

def _row_dict(
    nums: List[int],
    method: str,
    *,
    set_index: int,
    offset: int,
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
        "top6_starts": list(top6_starts),
    }


# ── 조합 교정 ────────────────────────────────────────────────

def _repair_combo(nums: List[int], freq: Counter[int]) -> List[int]:
    """
    합계/홀짝/고저 위반 시 문제 번호를 교체하여 교정한다.

    교체 전략 (매 반복마다 번호 1개 교체):
      - 교체 대상: 고빈도 번호 우선 (출현 빈도가 높을수록 교체 우선)
      - 교체 후보: 저빈도 번호 우선 + 위반 해소 방향
      - 합계: 부족하면 더 큰 번호로, 초과하면 더 작은 번호로
      - 홀짝: 가장 가까운 반대 성질 번호로
      - 고저: 가장 가까운 반대 구간 번호로

    최대 6회 반복하여 모든 조건 충족을 목표로 한다.
    """
    result = sorted(nums)

    for _ in range(6):
        s = sum(result)
        odds = sum(1 for n in result if n % 2 == 1)
        highs = sum(1 for n in result if n >= 23)

        sum_ok = COMBO_FILTER_SUM_MIN <= s <= COMBO_FILTER_SUM_MAX
        odd_ok = COMBO_FILTER_ODD_MIN <= odds <= COMBO_FILTER_ODD_MAX
        high_ok = COMBO_FILTER_HIGH_MIN <= highs <= COMBO_FILTER_HIGH_MAX

        if sum_ok and odd_ok and high_ok:
            return result

        if not sum_ok:
            if s < COMBO_FILTER_SUM_MIN:
                targets = sorted(result, key=lambda n: (-freq.get(n, 0), n))
                for target in targets:
                    candidates = [c for c in range(target + 1, 46) if c not in result]
                    candidates.sort(key=lambda c: (-c, freq.get(c, 0)))
                    if candidates:
                        result = sorted([n for n in result if n != target] + [candidates[0]])
                        break
            else:
                targets = sorted(result, key=lambda n: (-freq.get(n, 0), -n))
                for target in targets:
                    candidates = [c for c in range(1, target) if c not in result]
                    candidates.sort(key=lambda c: (c, freq.get(c, 0)))
                    if candidates:
                        result = sorted([n for n in result if n != target] + [candidates[0]])
                        break
            continue

        if not odd_ok:
            need_more_odd = (odds < COMBO_FILTER_ODD_MIN)
            targets = sorted(result, key=lambda n: (-freq.get(n, 0), n))
            for target in targets:
                if need_more_odd and target % 2 == 0:
                    candidates = [c for c in range(1, 46) if c % 2 == 1 and c not in result]
                elif not need_more_odd and target % 2 == 1:
                    candidates = [c for c in range(1, 46) if c % 2 == 0 and c not in result]
                else:
                    continue
                candidates.sort(key=lambda c: (abs(c - target), freq.get(c, 0), c))
                if candidates:
                    result = sorted([n for n in result if n != target] + [candidates[0]])
                    break
            continue

        if not high_ok:
            need_more_high = (highs < COMBO_FILTER_HIGH_MIN)
            targets = sorted(result, key=lambda n: (-freq.get(n, 0), n))
            for target in targets:
                if need_more_high and target < 23:
                    candidates = [c for c in range(23, 46) if c not in result]
                elif not need_more_high and target >= 23:
                    candidates = [c for c in range(1, 23) if c not in result]
                else:
                    continue
                candidates.sort(key=lambda c: (abs(c - target), freq.get(c, 0), c))
                if candidates:
                    result = sorted([n for n in result if n != target] + [candidates[0]])
                    break
            continue

    return result


# ── 메인 생성 함수 ───────────────────────────────────────────

def generate_jl_wheel_sets(
    draw_no: int,
    count: int = 20,
    *,
    offsets: Optional[List[int]] = None,
    dedup_across_sets: bool = True,
    prevent_duplicates_before_replace: bool = True,
    start_permutation_overrides: Optional[Dict[int, Tuple[int, ...]]] = None,
    **_kwargs: object,
) -> List[Dict[str, object]]:
    """
    JL 휠 방식으로 count개 세트(각 6번호)를 생성한다.

    핵심: 결과번호 = (시작번호 - 1 + offset) mod 45 + 1

    시작번호: 항상 직전 회차(draw_no-1) 당첨 본번호 6개.
    세트별 다양화: 시작번호 6개의 순열을 세트마다 다르게 적용.
    독립 휠: 6개 휠 각각에 황금각 기반 step을 부여하여 결과 다양화.
    오프셋: offsets 또는 TWENTY_BASE_OFFSETS에서 세트별 적용.
    중복 방지: prevent_duplicates_before_replace(사전) + dedup_across_sets(사후).
    조합 교정: 합계/홀짝/고저 위반 시 번호 1개를 빈도 기반으로 자동 교체.

    start_permutation_overrides: 세트 인덱스(0 기준) → 0~5 순열. 해당 세트의 첫 시도 시작 배치만
    주입(중복 재시도 시에는 기본 START_PERMUTATIONS 로직).
    """
    if not 1 <= count <= 20:
        raise ValueError("count는 1~20만 허용합니다.")
    offs = offsets if offsets is not None else TWENTY_BASE_OFFSETS
    if len(offs) < count:
        raise ValueError("offset 개수가 count보다 부족합니다.")

    top6 = get_previous_draw_winning_starts(draw_no)

    freq_scope = draw_no - 1 if draw_no > 1 else 0
    freq_counter = _get_number_frequency_counter(freq_scope)

    results: List[Dict[str, object]] = []
    generated_nums: List[List[int]] = []
    generated_meta: List[Tuple[int, List[int], str]] = []
    seen_set_keys: set[frozenset[int]] = set()

    for i in range(count):
        offset = int(offs[i]) % 45
        base_steps = _steps_from_offset(offset, i)
        perm_ov = (
            start_permutation_overrides.get(i)
            if start_permutation_overrides is not None
            else None
        )
        current_starts = _diversify_start_nums(top6, i, 0, permutation_override=perm_ov)

        ws = _derive_wheel_steps(base_steps, set_index=i)

        if prevent_duplicates_before_replace:
            nums = _draw_unique_set_with_variants(
                top6=top6,
                set_index=i,
                base_offset=offset,
                set_index_for_steps=i,
                seen_sets=seen_set_keys,
                permutation_override=perm_ov,
            )
        else:
            nums = draw_six(current_starts, base_steps, wheel_steps=ws)

        nums = _repair_combo(nums, freq_counter)

        method = METHOD_NAME
        generated_nums.append(sorted(nums))
        generated_meta.append((offset, current_starts, method))
        seen_set_keys.add(frozenset(nums))

    if dedup_across_sets:
        replacement_pool = _replacement_pool_from_frequency(freq_counter, size=20)
        generated_nums = _replace_duplicate_sets_by_frequency(
            generated_nums, freq=freq_counter, replacement_pool=replacement_pool
        )

    generated_nums = [_repair_combo(nums, freq_counter) for nums in generated_nums]

    for i in range(count):
        offset, current_starts, method = generated_meta[i]
        nums = generated_nums[i]
        results.append(
            _row_dict(
                nums,
                method,
                set_index=i + 1,
                offset=offset,
                top6_starts=current_starts,
            )
        )
    return results


def _validate_start_permutation(start_permutation: Sequence[int]) -> Tuple[int, ...]:
    """0~5의 순열인지 검증 후 튜플로 반환."""
    t = tuple(int(x) for x in start_permutation)
    if len(t) != 6 or set(t) != set(range(6)):
        raise ValueError("start_permutation은 0~5의 순열(길이 6)이어야 합니다.")
    return t


def generate_jl_ticket_for_draw_and_set(
    draw_no: int,
    *,
    set_index: int,
    offset: int,
    start_permutation: Tuple[int, ...],
    forced_previous_main: Optional[List[int]] = None,
) -> Dict[str, object]:
    """
    한 회차·한 세트에 대해 JL 휠 6번호 1줄만 생성한다.

    - 직전 회차 본번호 6개: ``forced_previous_main``이 있으면 그 값(정렬 후 순열 적용),
      없으면 DB에서 ``draw_no - 1`` 당첨 본번호.
    - 사전/사후 세트 간 dedup 경로는 거치지 않는다(워크플로 offset×720 탐색·단일 세트 3년 평가용).
    """
    if not 1 <= set_index <= 20:
        raise ValueError("set_index는 1~20이어야 합니다.")
    perm = _validate_start_permutation(start_permutation)
    if forced_previous_main is not None:
        if len(forced_previous_main) != 6:
            raise ValueError("forced_previous_main은 서로 다른 정수 6개여야 합니다.")
        top6 = sorted(int(x) for x in forced_previous_main)
    else:
        top6 = list(get_previous_draw_winning_starts(draw_no))

    freq_scope = draw_no - 1 if draw_no > 1 else 0
    freq_counter = _get_number_frequency_counter(freq_scope)

    idx0 = set_index - 1
    off = int(offset) % 45
    base_steps = _steps_from_offset(off, idx0)
    ws = _derive_wheel_steps(base_steps, set_index=idx0)
    starts = [top6[i] for i in perm]
    nums = draw_six(starts, base_steps, wheel_steps=ws)
    nums = sorted(_repair_combo(nums, freq_counter))

    return _row_dict(
        nums,
        METHOD_NAME,
        set_index=set_index,
        offset=off,
        top6_starts=list(starts),
    )


# ── 하위 호환 래퍼 ───────────────────────────────────────────

def generate_wheel_sets(
    count: int = 20,
    draw_no: int | None = None,
    **kwargs: object,
) -> List[Dict[str, object]]:
    """draw_no가 있으면 JL 규칙. 없으면 최신 회차+1 추정."""
    _ = kwargs
    if draw_no is None:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT COALESCE(MAX(draw_no), 0) + 1 FROM lotto_winners")
        draw_no = int(cur.fetchone()[0])
        conn.close()
    c = min(20, max(1, count))
    return generate_jl_wheel_sets(draw_no, count=c)
