"""
행동 경제학 및 인지적 오류 분석 기반 로또 번호 추천.
대중 선호 번호(생일, 뜨거운 손) 기피, 대중 기피 번호(직전 회차, 32번 이상) 선호로 기대 수익률 극대화.
"""
import random
import uuid
import numpy as np
from collections import Counter
from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries

# --- 조정 가능 수치 (1210~1214 회차 5등 이상 목표 튜닝용) ---
# 직전회차 과도 지배 완화 + 최근 트렌드 반영으로 조합 다양화
SCORE_LOW_RANGE_PENALTY = -0.2  # 1~31번: 완화된 기피
SCORE_HIGH_RANGE_BONUS = 1.0    # 32~45번: 균형
SCORE_LAST_DRAW_BONUS = 1.2     # 직전 회차: 약화(과도 집중 방지)
SCORE_HOT_HAND_PENALTY = 0.3    # 뜨거운 손: 최근 빈출 번호 소폭 선호(트렌드 반영)
HOT_HAND_MIN_FREQ = 3           # 최근 N회차에서 이 횟수 이상 출현 시 페널티
MIN_PAST_DRAWS = 8              # 최소 필요 과거 회차 수
MAX_PAST_DRAWS = 10             # 데이터 조회 최대 회차 수
RECENT_DRAWS_FOR_HOT = 5        # 뜨거운 손 분석용 최근 N회차

HIGH_RANGE_START = 32           # 고번호 구간 시작 (1~31 / 32~45 분할)


def generate_behavioral_sets(count: int, draw_no: int) -> list[dict]:
    """
    행동 경제학 및 인지적 오류 분석을 사용하여 로또 번호를 추천합니다.
    대중이 선호하는 번호(생일, 뜨거운 손)를 기피하고, 
    대중이 기피하는 번호(직전 회차, 32번 이상)를 선호하여 기대 수익률을 극대화합니다.
    """
    conn = get_connection()
    conn.row_factory = None
    cursor = conn.cursor()

    # 1. 데이터 조회 (draw_no 미만 최근 회차)
    cursor.execute("""
        SELECT num1, num2, num3, num4, num5, num6
        FROM lotto_winners
        WHERE draw_no < ?
        ORDER BY draw_no DESC
        LIMIT ?
    """, (draw_no, MAX_PAST_DRAWS))
    rows = cursor.fetchall()

    if len(rows) < MIN_PAST_DRAWS:
        conn.close()
        return []

    # 2. 대중 기피 점수 (Repulsion Score) 산출 관련 기초 데이터
    # (a) 직전 회차 번호 (사람들은 직전 번호를 피함 -> 기피 점수 가점)
    last_draw = set(rows[0])
    
    # (b) 최근 N회차 데이터 (뜨거운 손 오류 분석용)
    recent_n_rows = rows[:RECENT_DRAWS_FOR_HOT]
    recent_freq = Counter()
    for row in recent_n_rows:
        for n in row:
            recent_freq[n] += 1

    # 3. 1~45번 각 번호별 대중 기피 점수 계산
    scores = {}
    for num in range(1, 46):
        score = 0.0

        # 가중치 1: 가용성 휴리스틱 (생일/기념일 1~31 선호 기피)
        if num < HIGH_RANGE_START:
            score += SCORE_LOW_RANGE_PENALTY
        else:
            score += SCORE_HIGH_RANGE_BONUS

        # 가중치 2: 도박사의 오류 (직전 회차 번호 회피 기피)
        if num in last_draw:
            score += SCORE_LAST_DRAW_BONUS

        # 가중치 3: 뜨거운 손 오류 (최근 출현 번호 맹신 기피)
        if recent_freq[num] >= HOT_HAND_MIN_FREQ:
            score += SCORE_HOT_HAND_PENALTY
            
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

def get_scores(draw_no: int) -> list[float]:
    """
    행동 경제학 분석 기법의 1~45번 숫자별 정규화된 확률(Softmax)을 도출합니다.
    """
    conn = get_connection()
    conn.row_factory = None
    cursor = conn.cursor()

    cursor.execute("""
        SELECT num1, num2, num3, num4, num5, num6
        FROM lotto_winners
        WHERE draw_no < ?
        ORDER BY draw_no DESC
        LIMIT ?
    """, (draw_no, MAX_PAST_DRAWS))
    rows = cursor.fetchall()
    conn.close()

    if len(rows) < MIN_PAST_DRAWS:
        return [1.0 / 45.0 for _ in range(45)]

    last_draw = set(rows[0])
    recent_n_rows = rows[:RECENT_DRAWS_FOR_HOT]
    recent_freq = Counter()
    for row in recent_n_rows:
        for n in row:
            recent_freq[n] += 1

    scores = {}
    for num in range(1, 46):
        score = 0.0
        if num < HIGH_RANGE_START:
            score += SCORE_LOW_RANGE_PENALTY
        else:
            score += SCORE_HIGH_RANGE_BONUS

        if num in last_draw:
            score += SCORE_LAST_DRAW_BONUS

        if recent_freq[num] >= HOT_HAND_MIN_FREQ:
            score += SCORE_HOT_HAND_PENALTY

        scores[num] = score

    nums = list(range(1, 46))
    raw_scores = np.array([scores[n] for n in nums])
    
    exp_scores = np.exp(raw_scores - np.max(raw_scores))
    probs = exp_scores / exp_scores.sum()
    
    return probs.tolist()
