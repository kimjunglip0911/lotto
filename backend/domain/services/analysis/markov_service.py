import numpy as np
import uuid
from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries

def generate_markov_sets(count: int, draw_no: int) -> list[dict]:
    """
    마르코프 체인 기법을 사용하여 번호를 추천합니다.
    1. 과거 당첨 데이터를 기반으로 45x45 전이 확률 행렬 구축
    2. 직전 회차 번호를 기반으로 다음 회차 번호 출현 확률 분포 도출
    3. 확률 기반 2세트 생성 (최고 확률, 가중치 샘플링) 및 DB 저장
    """
    conn = get_connection()
    conn.row_factory = None
    cursor = conn.cursor()

    # 1. 데이터 조회 (해당 회차 미만 모든 데이터)
    cursor.execute("""
        SELECT num1, num2, num3, num4, num5, num6 
        FROM lotto_winners 
        WHERE draw_no < ? 
        ORDER BY draw_no ASC
    """, (draw_no,))
    rows = cursor.fetchall()
    
    if len(rows) < 8:  # 최소 학습 데이터 부족 시 빈 배열 반환
        conn.close()
        return []

    # 2. 전이 행렬(Transition Matrix) 구축
    # transition_counts[i][j]: i번 번호 다음에 j번 번호가 나타난 횟수
    transition_counts = np.zeros((45, 45), dtype=float)
    
    for k in range(len(rows) - 1):
        current_set = set(rows[k])
        next_set = set(rows[k+1])
        
        for cur_num in current_set:
            if 1 <= cur_num <= 45:
                for next_num in next_set:
                    if 1 <= next_num <= 45:
                        transition_counts[cur_num-1][next_num-1] += 1

    # 확률 행렬로 정규화 (각 행의 합으로 나눔)
    row_sums = transition_counts.sum(axis=1)
    # 0으로 나누기 방지 및 에지 케이스(한 번도 안 나온 번호) 처리 -> 균등 확률 분배
    transition_matrix = np.where(
        row_sums[:, np.newaxis] > 0,
        transition_counts / row_sums[:, np.newaxis],
        1.0 / 45.0
    )

    # 3. 다음 회차 확률 분포 도출
    # 직전 회차 번호들(Current State) 로부터의 전이 확률 평균
    latest_numbers = rows[-1]
    prob_vector = np.zeros(45)
    for num in latest_numbers:
        if 1 <= num <= 45:
            prob_vector += transition_matrix[num-1]
    
    prob_vector /= len(latest_numbers)  # 평균 확률 분포

    # 4. 추천 번호 생성 (2세트)
    method = "마르코프 체인"
    group_id = f"group_markov_{uuid.uuid4().hex[:8]}"
    saved_sets = []

    for i in range(count):
        if i == 0:
            # 세트 1: 최고 확률 상위 6개 (결정론적)
            indices = np.argsort(prob_vector)[-6:]
            nums = sorted([int(idx + 1) for idx in indices])
        else:
            # 세트 2: 확률 가중치 기반 샘플링 (비복원 추출)
            # 확률 합이 정확히 1이 되도록 다시 보정 (정밀도 문제 방지)
            norm_probs = prob_vector / prob_vector.sum()
            indices = np.random.choice(range(45), size=6, replace=False, p=norm_probs)
            nums = sorted([int(idx + 1) for idx in indices])

        # DB 저장
        cursor.execute(queries.INSERT_DRAWING, (
            group_id,
            nums[0], nums[1], nums[2],
            nums[3], nums[4], nums[5],
            0, # bonus_num
            0, # draw_count
            method,
            draw_no
        ))

        saved_sets.append({
            "num1": nums[0], "num2": nums[1], "num3": nums[2],
            "num4": nums[3], "num5": nums[4], "num6": nums[5],
            "method": method,
            "draw_no": draw_no,
            "group_id": group_id
        })

    conn.commit()
    conn.close()
    return saved_sets

def get_scores(draw_no: int) -> list[float]:
    """
    마르코프 체인 기법의 1~45번 숫자별 정규화된 확률을 도출합니다.
    """
    conn = get_connection()
    conn.row_factory = None
    cursor = conn.cursor()

    cursor.execute("""
        SELECT num1, num2, num3, num4, num5, num6 
        FROM lotto_winners 
        WHERE draw_no < ? 
        ORDER BY draw_no ASC
    """, (draw_no,))
    rows = cursor.fetchall()
    conn.close()
    
    if len(rows) < 8:
        return [1.0 / 45.0 for _ in range(45)]

    transition_counts = np.zeros((45, 45), dtype=float)
    
    for k in range(len(rows) - 1):
        current_set = set(rows[k])
        next_set = set(rows[k+1])
        
        for cur_num in current_set:
            if 1 <= cur_num <= 45:
                for next_num in next_set:
                    if 1 <= next_num <= 45:
                        transition_counts[cur_num-1][next_num-1] += 1

    row_sums = transition_counts.sum(axis=1)
    transition_matrix = np.where(
        row_sums[:, np.newaxis] > 0,
        transition_counts / row_sums[:, np.newaxis],
        1.0 / 45.0
    )

    latest_numbers = rows[-1]
    prob_vector = np.zeros(45)
    valid_nums = 0
    for num in latest_numbers:
        if 1 <= num <= 45:
            prob_vector += transition_matrix[num-1]
            valid_nums += 1
    
    if valid_nums > 0:
        prob_vector /= valid_nums
        
    total_prob = prob_vector.sum()
    if total_prob > 0:
        norm_probs = prob_vector / total_prob
    else:
        norm_probs = np.full(45, 1.0 / 45.0)
        
    return norm_probs.tolist()
