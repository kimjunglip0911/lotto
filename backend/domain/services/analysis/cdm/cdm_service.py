"""
CDM (Compound-Dirichlet-Multinomial) 기법: 과거 당첨 빈도에 Dirichlet prior를 더한
기댓값으로 번호별 가중치를 계산하고, 상위 번호로 추천 세트를 구성합니다.
"""
import uuid
from typing import Optional

from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries

# Dirichlet prior (낮을수록 고빈도 번호 집중, 1210~1214 회차 5등 이상 목표에 맞춤)
CDM_ALPHA = 0.15
# 최근 N회차 당첨에 부여할 가중치 배율 (직전 트렌드 반영, GA/PSO 5등 달성 패턴 적용)
RECENT_DRAW_N = 12
RECENT_DRAW_WEIGHT = 8.0


def _compute_counts(draw_no: Optional[int], cursor=None) -> dict[int, float]:
    """
    과거 당첨 데이터로 번호별 가중 카운트를 계산합니다.
    최근 RECENT_DRAW_N회차는 RECENT_DRAW_WEIGHT, 그 이전은 1.0으로 반영합니다.
    cursor가 주어지면 해당 커서로 조회(호출자가 연결 관리), 없으면 새 연결 후 조회 후 종료.
    """
    if cursor is None:
        conn = get_connection()
        conn.row_factory = None
        cur = conn.cursor()
        own_conn = True
    else:
        cur = cursor
        own_conn = False

    if draw_no:
        cur.execute(
            "SELECT draw_no, num1, num2, num3, num4, num5, num6 FROM lotto_winners WHERE draw_no < ? ORDER BY draw_no DESC",
            (draw_no,),
        )
    else:
        cur.execute(
            "SELECT draw_no, num1, num2, num3, num4, num5, num6 FROM lotto_winners ORDER BY draw_no DESC"
        )
    rows = cur.fetchall()

    if own_conn:
        conn.close()

    counts: dict[int, float] = {i: 0.0 for i in range(1, 46)}
    for i, row in enumerate(rows):
        w = RECENT_DRAW_WEIGHT if i < RECENT_DRAW_N else 1.0
        for j in range(1, 7):
            num = row[j]
            if num in counts:
                counts[num] += w
    return counts


def _weights_sorted(draw_no: Optional[int], cursor=None) -> list[tuple[int, float]]:
    """가중치(alpha + count) 기준 내림차순 (번호, 가중치) 리스트. get_scores와 generate_cdm_sets에서 공통 사용."""
    counts = _compute_counts(draw_no, cursor=cursor)
    weights = [(n, CDM_ALPHA + counts[n]) for n in range(1, 46)]
    weights.sort(key=lambda x: x[1], reverse=True)
    return weights


def get_scores(draw_no: int) -> list[float]:
    """
    CDM 기법의 1~45번 숫자별 정규화된 확률을 도출합니다.
    반환 길이 45, 합 1.0. total_score <= 0 방어 처리 포함.
    """
    weights_list = _weights_sorted(draw_no)
    score_by_num = {num: w for num, w in weights_list}
    scores = [score_by_num[i] for i in range(1, 46)]
    total_score = sum(scores)
    if total_score <= 0:
        return [1.0 / 45.0] * 45
    return [s / total_score for s in scores]


def generate_cdm_sets(count: int, draw_no: int) -> list[dict]:
    """
    CDM (Compound-Dirichlet-Multinomial) 기법을 사용하여 번호를 추천합니다.
    _weights_sorted와 동일한 counts/weights 로직을 사용합니다.
    """
    conn = get_connection()
    conn.row_factory = None
    cursor = conn.cursor()

    weights_list = _weights_sorted(draw_no, cursor=cursor)
    top_numbers = [w[0] for w in weights_list]

    sets_to_save = []
    method = "CDM 바이시안"
    group_id = f"group_cdm_{uuid.uuid4().hex[:8]}"

    for i in range(count):
        start_idx = (i * 6) % len(top_numbers)
        end_idx = start_idx + 6
        nums = top_numbers[start_idx:end_idx]
        if len(nums) < 6:
            nums.extend(top_numbers[: 6 - len(nums)])
        nums = sorted(nums)

        cursor.execute(
            queries.INSERT_DRAWING,
            (
                group_id,
                nums[0],
                nums[1],
                nums[2],
                nums[3],
                nums[4],
                nums[5],
                0,
                0,
                method,
                draw_no,
            ),
        )
        sets_to_save.append(
            {
                "num1": nums[0],
                "num2": nums[1],
                "num3": nums[2],
                "num4": nums[3],
                "num5": nums[4],
                "num6": nums[5],
                "method": method,
                "draw_no": draw_no,
                "group_id": group_id,
            }
        )

    conn.commit()
    conn.close()
    return sets_to_save
