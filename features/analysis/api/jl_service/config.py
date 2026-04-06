# -*- coding: utf-8 -*-
"""
JL 휠 — 설정 상수.

모든 튜닝 파라미터(오프셋, 휠 스텝 등)를 한곳에서 관리한다.
`features.analysis.scripts.jl_wheel_batch_eval.persist_offset_speed_update` 등이
이 파일을 AST/정규식으로 갱신할 수 있다.
"""
from __future__ import annotations

from typing import Dict, List, Tuple

# ── 메서드 이름 / 재시도 한계 ─────────────────────────────────
METHOD_NAME = "JL Wheel Method"
MAX_DUPLICATE_RETRIES = 300
MAX_SET_DEDUP_RETRIES = 50

# ── speed ↔ steps 변환 상수 ───────────────────────────────────
# steps = int(speed × K).  K는 레거시 물리 모델에서 파생된 변환 계수.
_JITTER_K: float = (82.11 / 1.88) / 2.0  # ≈ 21.838

# 세트#1~20 내부 기준 speed (오프셋/스피드 자동 반영 스크립트가 이 리스트를 정규식으로 수정)
_JITTER_BASE_SPEEDS: List[float] = [
    81.06,
    82.98,
    83.58,
    84.21,
    85.95,
    86.64,
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

# 중복 재시도 시 이동량 변화 (speed 단위 → steps로 환산하여 사용)
_RETRY_SPEED_JITTER: float = 1.25
_PRE_DEDUP_SPEED_JITTER: float = 0.35

# speed 클램프 범위에 대응하는 step 범위
_MIN_STEPS: int = int(65.0 * _JITTER_K)   # 1419
_MAX_STEPS: int = int(135.0 * _JITTER_K)  # 2948

# ── 세트별 기준 offset (0~44) — 유일한 튜닝 대상 ─────────────
# 2026-04-02: 황금비 독립 휠 step [0,7,17,24,34,41] 적용 후 전체 재튜닝
TWENTY_BASE_OFFSETS: List[int] = [
    17, 24, 35, 29, 18, 6, 2, 34, 0, 21,
    2, 29, 35, 8, 33, 30, 11, 0, 13, 40,
]

# ── 6휠 독립 step (각 휠의 추가 이동량) ──────────────────────
# 황금각 분산: 45 × (2 − φ) ≈ 17.189칸 간격으로 6개 휠을 비주기적·균일 배치.
# 각 점이 기존 최대 빈 구간에 놓여 클러스터링을 방지한다.
WHEEL_OFFSET_STEPS: List[int] = [0, 7, 17, 24, 34, 41]

# 세트별 커스텀 독립 휠 step (특정 세트만 별도 패턴 적용 시 사용)
PER_SET_WHEEL_STEPS: Dict[int, List[int]] = {}

# ── 조합 필터 임계값 ──────────────────────────────────────────
COMBO_FILTER_SUM_MIN = 100
COMBO_FILTER_SUM_MAX = 175
COMBO_FILTER_ODD_MIN = 2
COMBO_FILTER_ODD_MAX = 4
COMBO_FILTER_HIGH_MIN = 2
COMBO_FILTER_HIGH_MAX = 4

# ── 스크립트 호환용 별칭 (JL 휠 분석·연구 스크립트에서 사용) ─
FIXED_STOP_TIME: float = 82.11 / 1.88
TWENTY_BASE_SPEEDS: List[float] = list(_JITTER_BASE_SPEEDS)
TWENTY_SPEED_PROFILES: List[Tuple[float, float]] = [
    (s, s / FIXED_STOP_TIME) for s in TWENTY_BASE_SPEEDS
]
RETRY_SPEED_JITTER: float = _RETRY_SPEED_JITTER
PRE_DEDUP_SPEED_JITTER: float = _PRE_DEDUP_SPEED_JITTER
