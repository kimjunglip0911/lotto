import random
import uuid
import numpy as np
from collections import Counter
from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries

def generate_behavioral_sets(count: int, draw_no: int) -> list[dict]:
    """
    행동 경제학 및 인지적 오류 분석을 사용하여 로또 번호를 추천합니다.
    대중이 선호하는 번호(생일, 뜨거운 손)를 기피하고, 
    대중이 기피하는 번호(직전 회차, 32번 이상)를 선호하여 기대 수익률을 극대화합니다.
    """
    conn = get_connection()
    conn.row_factory = None
    cursor = conn.cursor()

    # 1. 데이터 조회 (최근 10회차)
    cursor.execute("""
        SELECT num1, num2, num3, num4, num5, num6 
        FROM lotto_winners 
        WHERE draw_no < ? 
        ORDER BY draw_no DESC 
        LIMIT 10
    """, (draw_no,))
    rows = cursor.fetchall()
    
    if len(rows) < 8:
        conn.close()
        return []

    # 2. 대중 기피 점수 (Repulsion Score) 산출 관련 기초 데이터
    # (a) 직전 회차 번호 (사람들은 직전 번호를 피함 -> 기피 점수 가점)
    last_draw = set(rows[0])
    
    # (b) 최근 5회차 데이터 (뜨거운 손 오류 분석용)
    recent_5_rows = rows[:5]
    recent_5_freq = Counter()
    for row in recent_5_rows:
        for n in row:
            recent_5_freq[n] += 1

    # 3. 1~45번 각 번호별 대중 기피 점수 계산
    scores = {}
    for num in range(1, 46):
        score = 0.0
        
        # 가중치 1: 가용성 휴리스틱 (생일/기념일 1~31 선호 기피)
        if num <= 31:
            score -= 1.0  # 대중이 많이 고르는 번호 -> 기대 수익률 저하
        else:
            score += 2.0  # 32~45번: 대중이 상대적으로 덜 고름 -> 기대 수익률 상승
            
        # 가중치 2: 도박사의 오류 (직전 회차 번호 회피 기피)
        if num in last_draw:
            score += 2.0  # 대중이 직전주 번호는 안 나올거라 생각해서 피함 -> 역이용
            
        # 가중치 3: 뜨거운 손 오류 (장기 출현 번호 맹신 기피)
        if recent_5_freq[num] >= 3:
            score -= 3.0  # 최근 너무 자주 나온 번호는 사람들이 몰림 -> 기피
            
        scores[num] = score

    # 4. Softmax를 이용한 확률적 추천 모델 생성
    nums = list(range(1, 46))
    raw_scores = np.array([scores[n] for n in nums])
    
    # 수치적 안정성을 위한 max subtraction
    exp_scores = np.exp(raw_scores - np.max(raw_scores))
    probs = exp_scores / exp_scores.sum()
    
    # 5. 번호 생성 (가중치 기반 랜덤 샘플링 6개, 2세트)
    generated_list = []
    for _ in range(count):
        # 중복 세트 방지를 위한 루프
        for _ in range(20):
            # numpy의 choice 비복원 추출 사용
            chosen = np.random.choice(nums, size=6, replace=False, p=probs)
            chosen_sorted = sorted(chosen.tolist())
            
            if chosen_sorted not in generated_list:
                generated_list.append(chosen_sorted)
                break
    
    # 6. DB 저장 및 반환
    method = "행동 경제학 분석"
    group_id = f"group_behav_{uuid.uuid4().hex[:8]}"
    saved_sets = []

    for nums_set in generated_list[:count]:
        cursor.execute(queries.INSERT_DRAWING, (
            group_id,
            nums_set[0], nums_set[1], nums_set[2],
            nums_set[3], nums_set[4], nums_set[5],
            0, # bonus_num
            0, # draw_count
            method,
            draw_no
        ))

        saved_sets.append({
            "num1": nums_set[0], "num2": nums_set[1], "num3": nums_set[2],
            "num4": nums_set[3], "num5": nums_set[4], "num6": nums_set[5],
            "method": method,
            "draw_no": draw_no,
            "group_id": group_id
        })

    conn.commit()
    conn.close()
    return saved_sets
