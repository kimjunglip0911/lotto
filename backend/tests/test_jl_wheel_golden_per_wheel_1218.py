# -*- coding: utf-8 -*-
"""
1217회 → 1218회 실데이터로, 황금각 휠 스텝 `WHEEL_OFFSET_STEPS`를 유지한 채
**휠마다 다른 (mod 45) 오프셋**으로 1218 본6을 정확히 재현할 수 있는지 검증한다.

- 시작 6개: 1217회 본번호 **오름차순** (휠 i ↔ 정렬 인덱스 i 고정).
- 목표: 1218회 본번호 정렬 6개.
- 수학: ``(s_i - 1 + steps_i) mod 45 + 1 = t_i`` 이므로 ``steps_i ≡ (t_i - s_i) (mod 45)``.
  황금각 분해 ``steps_i ≡ k_i + G[i] (mod 45)`` 를 쓰면
  ``k_i ≡ (t_i - s_i - G[i]) mod 45`` (각 휠 고정값).

주의: ``draw_six`` 는 nominal step 을 ``[_MIN_STEPS, _MAX_STEPS]`` 로 클램프하므로,
동일 mod 45 를 만족하는 **큰** step 을 골라 넣는다.

단일 ``base_steps`` 로 ``steps_i = base_steps + G[i]`` 형태가 되려면
모든 i 에 대해 ``(t_i - s_i - G[i]) mod 45`` 가 같아야 한다.
1217→1218 케이스에서는 서로 다르므로(테스트 내 assert) **세트당 오프셋 1개 모델로는
정렬 인덱스 정렬로 동시에 맞추기 어렵다**는 것을 코드로 고정한다.
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

# 기존 conftest/패키지 설치에 의존하지 않도록 저장소·백엔드 루트만 이 파일에서 추가
_backend_root = Path(__file__).resolve().parent.parent
_project_root = _backend_root.parent
for _p in (_project_root, _backend_root):
    _s = str(_p)
    if _s not in sys.path:
        sys.path.insert(0, _s)

from features.analysis.api.jl_service.config import (
    WHEEL_OFFSET_STEPS,
    _MAX_STEPS,
    _MIN_STEPS,
)
from features.analysis.api.jl_service.physics import draw_six


# DB lotto_winners 기준 (회차 고정 스냅샷)
DRAW_1217_MAIN_SORTED = [8, 10, 15, 20, 29, 31]
DRAW_1218_MAIN_SORTED = [3, 28, 31, 32, 42, 45]


def _steps_congruent_min_in_band(delta_mod45: int) -> int:
    """``delta_mod45`` ∈ [0,44] 에 대해 ``steps ≡ delta_mod45 (mod 45)`` 이고 ``_MIN_STEPS <= steps <= _MAX_STEPS`` 인 최소 steps."""
    d = int(delta_mod45) % 45
    q = math.ceil((_MIN_STEPS - d) / 45)
    steps = d + 45 * q
    assert _MIN_STEPS <= steps <= _MAX_STEPS, (d, steps)
    return steps


def test_golden_steps_per_wheel_offsets_hit_1218_main() -> None:
    assert len(WHEEL_OFFSET_STEPS) == 6
    starts = DRAW_1217_MAIN_SORTED
    targets = DRAW_1218_MAIN_SORTED

    k_list: list[int] = []
    wheel_steps: list[int] = []
    for i in range(6):
        g = WHEEL_OFFSET_STEPS[i]
        d = (targets[i] - starts[i]) % 45
        steps = _steps_congruent_min_in_band(d)
        wheel_steps.append(steps)
        k_i = (d - g) % 45
        k_list.append(k_i)
        assert (starts[i] - 1 + steps) % 45 + 1 == targets[i]

    out = draw_six(starts, 0, wheel_steps=wheel_steps)
    assert out == targets


def test_single_base_plus_golden_cannot_align_all_wheels_for_1217_1218() -> None:
    """``base + G[i]`` 한 덩어리로는 휠별 필요 잔차 mod 45 가 동시에 일치하지 않음."""
    starts = DRAW_1217_MAIN_SORTED
    targets = DRAW_1218_MAIN_SORTED
    residues = [
        (targets[i] - starts[i] - WHEEL_OFFSET_STEPS[i]) % 45 for i in range(6)
    ]
    assert len(set(residues)) > 1, "이 회차 쌍에서는 단일 base(mod 45)로 전 휠을 동시에 맞출 수 있음"


def test_per_wheel_k_values_documentation() -> None:
    """정렬↔정렬 매칭일 때 휠별 고정 k_i (0~44)."""
    starts = DRAW_1217_MAIN_SORTED
    targets = DRAW_1218_MAIN_SORTED
    expected_k = [(targets[i] - starts[i] - WHEEL_OFFSET_STEPS[i]) % 45 for i in range(6)]
    assert expected_k == [40, 11, 44, 33, 24, 18]
