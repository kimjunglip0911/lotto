"""
마르코프 체인 기법: 과거 당첨 데이터의 전이 확률 행렬로 다음 회차 번호 확률 분포를 도출합니다.
"""
import numpy as np
import uuid
from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries

# --- 조정 가능 수치 (1210~1214 회차 5등 이상 목표 튜닝용) ---
MIN_TRAIN_ROWS = 8  # 최소 학습 회차 수 (5~15 구간에서 조정 가능)
LAPLACE_ALPHA = 0.02  # 전이 행렬 Laplace 스무딩
RECENT_N = 5  # 직전 5회차 가중 블렌딩
RECENT_WEIGHTS = (0.05, 0.1, 0.15, 0.25, 0.45)  # 최신 회차 강조


def _compute_transition_matrix(rows: list, laplace_alpha: float) -> np.ndarray:
    """과거 당첨 rows로 45x45 전이 확률 행렬 구축 (Laplace 스무딩 적용)."""
    transition_counts = np.zeros((45, 45), dtype=float)
    for k in range(len(rows) - 1):
        current_set = set(rows[k])
        next_set = set(rows[k + 1])
        for cur_num in current_set:
            if 1 <= cur_num <= 45:
                for next_num in next_set:
                    if 1 <= next_num <= 45:
                        transition_counts[cur_num - 1][next_num - 1] += 1
    row_sums = transition_counts.sum(axis=1)
    # Laplace 스무딩: (counts + alpha) / (row_sum + 45*alpha), 분모 > 0 보장
    transition_matrix = (transition_counts + laplace_alpha) / (
        row_sums[:, np.newaxis] + 45.0 * laplace_alpha
    )
    return transition_matrix


def _compute_prob_vector(
    rows: list,
    transition_matrix: np.ndarray,
    recent_n: int,
    recent_weights: tuple[float, ...],
) -> np.ndarray:
    """직전 recent_n회차 가중 평균으로 다음 회차 확률 벡터 도출."""
    n = min(recent_n, len(rows))
    if n <= 0:
        return np.full(45, 1.0 / 45.0)
    weights = np.array(recent_weights[:n], dtype=float)
    if weights.sum() > 0:
        weights /= weights.sum()
    prob_vector = np.zeros(45, dtype=float)
    for i in range(n):
        latest_numbers = rows[-(n - i)]
        for num in latest_numbers:
            if 1 <= num <= 45:
                prob_vector += weights[i] * transition_matrix[num - 1]
    total = prob_vector.sum()
    if total > 0:
        prob_vector /= total
    else:
        prob_vector = np.full(45, 1.0 / 45.0)
    return prob_vector


def _get_prob_vector_for_draw(draw_no: int, cursor=None) -> np.ndarray | None:
    """
    draw_no 미만 당첨 데이터로 확률 벡터(길이 45, 합=1) 계산.
    데이터 부족 시 None 반환. cursor가 None이면 내부에서 연결 후 닫음.
    """
    own_conn = cursor is None
    if own_conn:
        conn = get_connection()
        conn.row_factory = None
        cursor = conn.cursor()
    cursor.execute(
        """
        SELECT num1, num2, num3, num4, num5, num6
        FROM lotto_winners
        WHERE draw_no < ?
        ORDER BY draw_no ASC
    """,
        (draw_no,),
    )
    rows = [tuple(r) for r in cursor.fetchall()]
    if len(rows) < MIN_TRAIN_ROWS:
        if own_conn:
            conn.close()
        return None
    transition_matrix = _compute_transition_matrix(rows, LAPLACE_ALPHA)
    prob_vector = _compute_prob_vector(
        rows, transition_matrix, RECENT_N, RECENT_WEIGHTS
    )
    if own_conn:
        conn.close()
    return prob_vector


def generate_markov_sets(count: int, draw_no: int) -> list[dict]:
    """
    마르코프 체인 기법을 사용하여 번호를 추천합니다.
    1. 과거 당첨 데이터를 기반으로 45x45 전이 확률 행렬 구축 (Laplace 스무딩)
    2. 직전 N회차 가중 평균으로 다음 회차 번호 출현 확률 분포 도출
    3. 확률 기반 2세트 생성 (최고 확률, 가중치 샘플링) 및 DB 저장
    """
    conn = get_connection()
    conn.row_factory = None
    cursor = conn.cursor()

    prob_vector = _get_prob_vector_for_draw(draw_no, cursor=cursor)
    if prob_vector is None:
        conn.close()
        return []

    method = "마르코프 체인"
    group_id = f"group_markov_{uuid.uuid4().hex[:8]}"
    saved_sets = []

    for i in range(count):
        if i == 0:
            indices = np.argsort(prob_vector)[-6:]
            nums = sorted([int(idx + 1) for idx in indices])
        else:
            norm_probs = prob_vector / prob_vector.sum()
            indices = np.random.choice(
                range(45), size=6, replace=False, p=norm_probs
            )
            nums = sorted([int(idx + 1) for idx in indices])

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
        saved_sets.append(
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
    return saved_sets


def get_scores(draw_no: int) -> list[float]:
    """
    마르코프 체인 기법의 1~45번 숫자별 정규화된 확률을 도출합니다.
    """
    prob_vector = _get_prob_vector_for_draw(draw_no)
    if prob_vector is None:
        return [1.0 / 45.0 for _ in range(45)]
    total = prob_vector.sum()
    if total <= 0:
        return [1.0 / 45.0 for _ in range(45)]
    norm_probs = prob_vector / total
    return norm_probs.tolist()
