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
import json
from pathlib import Path
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
    get_previous_draw_top7,
    get_previous_draw_winning_starts,
)

_PROJECT_ROOT = Path(__file__).resolve().parents[4]
_ACTIVE_PICK_PATH = _PROJECT_ROOT / "pick.json"


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


def _load_active_pick_override() -> Optional[dict]:
    """
    프로젝트 루트의 pick.json(1번 스크립트 산출물)을 읽어 메인 서비스 오버라이드로 사용.

    유효 조건:
    - 세트번호(set_index): int
    - 오프셋칸수(offset_steps): 길이 6 정수 목록
    """
    if not _ACTIVE_PICK_PATH.is_file():
        return None
    try:
        data = json.loads(_ACTIVE_PICK_PATH.read_text(encoding="utf-8"))
    except (OSError, ValueError, TypeError):
        return None

    try:
        set_index = int(data.get("세트번호", data.get("set_index")))
        raw_steps = data.get("오프셋칸수", data.get("offset_steps"))
        if raw_steps is None:
            return None
        if not isinstance(raw_steps, list) or len(raw_steps) != 6:
            return None
        offset_steps = [int(x) % 45 for x in raw_steps]
    except (KeyError, TypeError, ValueError):
        return None

    if not 1 <= set_index <= 20:
        return None
    return {"set_index": set_index, "offset_steps": offset_steps}


def _fetch_previous_draw_winning_ordered(draw_no: int) -> List[int]:
    """
    직전 회차 본번호를 DB 컬럼 순서(num1~num6) 그대로 반환.
    데이터가 없으면 기존 레거시 시작번호 함수로 폴백.
    """
    if draw_no <= 1:
        return get_previous_draw_winning_starts(draw_no)
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT num1, num2, num3, num4, num5, num6
            FROM lotto_winners
            WHERE draw_no = ?
            """,
            (draw_no - 1,),
        )
        row = cur.fetchone()
    if row is None:
        return get_previous_draw_winning_starts(draw_no)
    return [
        int(row["num1"]),
        int(row["num2"]),
        int(row["num3"]),
        int(row["num4"]),
        int(row["num5"]),
        int(row["num6"]),
    ]


def _add_step(num: int, step: int) -> int:
    return (int(num) - 1 + int(step)) % 45 + 1


def _top_bottom_numbers_from_counter(
    freq: Counter[int],
    *,
    top_n: int = 5,
    bottom_n: int = 5,
) -> tuple[List[int], List[int]]:
    all_nums = list(range(1, 46))
    top_sorted = sorted(all_nums, key=lambda n: (-freq.get(n, 0), n))
    bottom_sorted = sorted(all_nums, key=lambda n: (freq.get(n, 0), n))
    return top_sorted[:top_n], bottom_sorted[:bottom_n]


def _replace_hot_with_cold(nums: List[int], hot_nums: List[int], cold_nums: List[int]) -> List[int]:
    out = list(nums)
    hot_set = set(int(x) for x in hot_nums)
    for idx, n in enumerate(out):
        if n not in hot_set:
            continue
        candidate = next((x for x in cold_nums if x not in out), None)
        if candidate is not None:
            out[idx] = int(candidate)

    seen: set[int] = set()
    for idx, n in enumerate(out):
        if n not in seen:
            seen.add(n)
            continue
        candidate = next((x for x in cold_nums if x not in seen), None)
        if candidate is None:
            candidate = next((x for x in range(1, 46) if x not in seen), n)
        out[idx] = int(candidate)
        seen.add(int(candidate))
    return out


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

    메인 경로는 pick.json(offset_steps) 기반으로만 동작한다.
    시작번호는 항상 직전 회차(draw_no-1) 당첨 본번호 6개를 DB 컬럼 순서(num1~num6)대로 사용한다.
    세트별 오프셋(TWENTY_BASE_OFFSETS)을 합성한 뒤 누적 상/하위 번호 치환을 적용한다.
    """
    if not 1 <= count <= 20:
        raise ValueError("count는 1~20만 허용합니다.")
    offs = offsets if offsets is not None else TWENTY_BASE_OFFSETS
    if len(offs) < count:
        raise ValueError("offset 개수가 count보다 부족합니다.")
    # 하위 호환 파라미터는 시그니처 유지를 위해 남기되 메인 경로에서는 사용하지 않는다.
    _ = prevent_duplicates_before_replace
    _ = start_permutation_overrides

    freq_scope = draw_no - 1 if draw_no > 1 else 0
    freq_counter = _get_number_frequency_counter(freq_scope)
    top_nums, bottom_nums = _top_bottom_numbers_from_counter(freq_counter, top_n=5, bottom_n=5)

    results: List[Dict[str, object]] = []
    generated_nums: List[List[int]] = []
    generated_meta: List[Tuple[int, List[int], str]] = []
    active_pick = _load_active_pick_override()
    if active_pick is None:
        raise ValueError("pick.json이 없거나 형식이 유효하지 않습니다. 1번 스크립트를 먼저 실행하세요.")
    override_steps = list(active_pick["offset_steps"])
    starts = _fetch_previous_draw_winning_ordered(draw_no)

    for i in range(count):
        set_offset = int(offs[i]) % 45
        effective_steps = [(int(override_steps[j]) + set_offset) % 45 for j in range(6)]
        nums = [_add_step(starts[j], effective_steps[j]) for j in range(6)]
        nums = _replace_hot_with_cold(nums, top_nums, bottom_nums)
        generated_nums.append(sorted(nums))
        generated_meta.append((set_offset, list(starts), METHOD_NAME))

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


def _validate_start_seven_pick(start_pick: Sequence[int]) -> Tuple[int, ...]:
    """7개 풀(본6 정렬+보너스)에서 6휠에 넣을 인덱스: 길이 6, 서로 다름, 각 0~6."""
    t = tuple(int(x) for x in start_pick)
    if len(t) != 6 or len(set(t)) != 6:
        raise ValueError("start_pick은 서로 다른 정수 6개여야 합니다.")
    if any(i < 0 or i > 6 for i in t):
        raise ValueError("start_pick 각 원소는 0~6 이어야 합니다.")
    return t


def generate_jl_ticket_for_draw_and_set(
    draw_no: int,
    *,
    set_index: int,
    offset: int,
    start_permutation: Tuple[int, ...],
    forced_previous_main: Optional[List[int]] = None,
    forced_previous_bonus: Optional[int] = None,
) -> Dict[str, object]:
    """
    한 회차·한 세트에 대해 JL 휠 6번호 1줄만 생성한다.

    - 시작 풀: 직전 회차 본6(오름차순)+보너스 7개가 있으면 ``start_permutation``은
      그중 6개를 고르는 인덱스(0~5 본번호, 6 보너스), 길이 6, 서로 다름 → P(7,6)=5040.
    - ``forced_previous_bonus``가 있으면 ``forced_previous_main``과 함께 위 7풀을 구성.
    - 보너스 없이 ``forced_previous_main``만 있으면 레거시: 0~5 순열 720.
    - 둘 다 없으면 DB 직전 회차에서 7풀 조회 가능 시 7풀, 아니면 본6만.
    - 사전/사후 세트 간 dedup 경로는 거치지 않는다(워크플로 탐색·단일 세트 3년 평가용).
    """
    if not 1 <= set_index <= 20:
        raise ValueError("set_index는 1~20이어야 합니다.")

    freq_scope = draw_no - 1 if draw_no > 1 else 0
    freq_counter = _get_number_frequency_counter(freq_scope)

    idx0 = set_index - 1
    off = int(offset) % 45
    base_steps = _steps_from_offset(off, idx0)
    ws = _derive_wheel_steps(base_steps, set_index=idx0)

    top7: Optional[List[int]] = None
    if forced_previous_main is not None:
        if len(forced_previous_main) != 6:
            raise ValueError("forced_previous_main은 서로 다른 정수 6개여야 합니다.")
        sm = sorted(int(x) for x in forced_previous_main)
        if forced_previous_bonus is not None:
            b = int(forced_previous_bonus)
            if b in sm or not 1 <= b <= 45:
                raise ValueError("forced_previous_bonus는 본번호와 겹치지 않는 1~45 여야 합니다.")
            top7 = sm + [b]
        else:
            perm = _validate_start_permutation(start_permutation)
            top6 = sm
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
    else:
        top7 = get_previous_draw_top7(draw_no)

    if top7 is not None:
        pick = _validate_start_seven_pick(start_permutation)
        starts = [top7[i] for i in pick]
    else:
        perm = _validate_start_permutation(start_permutation)
        top6 = list(get_previous_draw_winning_starts(draw_no))
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
