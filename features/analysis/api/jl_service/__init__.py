# -*- coding: utf-8 -*-
"""
JL 휠 패키지.

핵심: 결과번호 = (시작번호 - 1 + offset) mod 45 + 1

모듈 구조:
    config.py        — 상수·오프셋·휠 스텝·조합 교정 기준
    physics.py       — 그리드 이동 + 6휠 드로우
    start_numbers.py — 시작번호 (직전 회차 당첨번호 6개)
    dedup.py         — 중복 방지 (사전 다양화 + 사후 교체)
    generator.py     — 세트 생성 엔진 (generate_jl_wheel_sets)
    analysis.py      — 당첨 분석 (analyze_draw_duplicate_sets)
    search.py        — offset 역탐색

기존 ``from features.analysis.api.jl_service import X`` 호환 유지.
"""
from __future__ import annotations

# ── config ────────────────────────────────────────────────────
from .config import (
    COMBO_FILTER_HIGH_MAX,
    COMBO_FILTER_HIGH_MIN,
    COMBO_FILTER_ODD_MAX,
    COMBO_FILTER_ODD_MIN,
    COMBO_FILTER_SUM_MAX,
    COMBO_FILTER_SUM_MIN,
    METHOD_NAME,
    PER_SET_WHEEL_STEPS,
    TWENTY_BASE_OFFSETS,
    WHEEL_OFFSET_STEPS,
    # 스크립트 호환용
    FIXED_STOP_TIME,
    TWENTY_BASE_SPEEDS,
    TWENTY_SPEED_PROFILES,
)

# ── physics ───────────────────────────────────────────────────
from .physics import draw_six

# ── start_numbers ─────────────────────────────────────────────
from .start_numbers import (
    START_PERMUTATIONS,
    get_previous_draw_winning_starts,
)

# ── generator ─────────────────────────────────────────────────
from .generator import (
    generate_jl_wheel_sets,
    generate_wheel_sets,
)

# ── analysis ──────────────────────────────────────────────────
from .analysis import analyze_draw_duplicate_sets

# ── search ────────────────────────────────────────────────────
from .search import (
    find_offset_for_number,
    find_offsets_for_six_numbers,
)

__all__ = [
    # config
    "COMBO_FILTER_HIGH_MAX",
    "COMBO_FILTER_HIGH_MIN",
    "COMBO_FILTER_ODD_MAX",
    "COMBO_FILTER_ODD_MIN",
    "COMBO_FILTER_SUM_MAX",
    "COMBO_FILTER_SUM_MIN",
    "FIXED_STOP_TIME",
    "METHOD_NAME",
    "PER_SET_WHEEL_STEPS",
    "TWENTY_BASE_OFFSETS",
    "TWENTY_BASE_SPEEDS",
    "TWENTY_SPEED_PROFILES",
    "WHEEL_OFFSET_STEPS",
    # physics
    "draw_six",
    # start_numbers
    "START_PERMUTATIONS",
    "get_previous_draw_winning_starts",
    # generator
    "generate_jl_wheel_sets",
    "generate_wheel_sets",
    # analysis
    "analyze_draw_duplicate_sets",
    # search
    "find_offset_for_number",
    "find_offsets_for_six_numbers",
]
