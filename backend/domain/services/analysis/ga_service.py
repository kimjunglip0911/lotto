import random
import numpy as np
import uuid
from collections import Counter
from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries

def generate_ga_sets(count: int, draw_no: int) -> list[dict]:
    """
    유전 알고리즘(Genetic Algorithm)을 사용하여 로또 번호를 추천합니다.
    1. 과거 데이터를 기반으로 빈도, 총합, 홀짝 비율 등 적합도 지표 계산
    2. 집단 진화(선택, 교차, 변이)를 거쳐 최적의 조합 탐색
    3. 최적 개체 2세트 DB 저장 및 반환
    """
    conn = get_connection()
    conn.row_factory = None
    cursor = conn.cursor()

    # 1. 데이터 조회 (해당 회차 미만 데이터)
    cursor.execute("""
        SELECT num1, num2, num3, num4, num5, num6 
        FROM lotto_winners 
        WHERE draw_no < ? 
        ORDER BY draw_no ASC
    """, (draw_no,))
    rows = cursor.fetchall()
    
    if len(rows) < 8:
        conn.close()
        return []

    # 2. 통계 지표 사전 계산
    flat_numbers = [num for row in rows for num in row]
    freq_counter = Counter(flat_numbers)
    # 빈도 점수 정규화 (0~1 사이)
    max_freq = max(freq_counter.values()) if freq_counter else 1
    freq_map = {i: freq_counter.get(i, 0) / max_freq for i in range(1, 46)}
    
    sums = [sum(row) for row in rows]
    avg_sum = np.mean(sums)
    
    odd_ratios = []
    for row in rows:
        odds = len([n for n in row if n % 2 != 0])
        odd_ratios.append(odds / 6.0)
    avg_odd_ratio = np.mean(odd_ratios)

    # 3. 헬퍼 함수
    def repair_chromosome(chrom: list[int]) -> list[int]:
        # 범위 및 중복 보정
        valid_nums = []
        for n in chrom:
            n = int(n)
            if n < 1: n = random.randint(1, 45)
            if n > 45: n = random.randint(1, 45)
            if n not in valid_nums:
                valid_nums.append(n)
        
        while len(valid_nums) < 6:
            new_n = random.randint(1, 45)
            if new_n not in valid_nums:
                valid_nums.append(new_n)
        
        return sorted(valid_nums[:6])

    def fitness(chrom: list[int]) -> float:
        # (a) 빈도 점수
        f_score = sum(freq_map[n] for n in chrom)
        # (b) 총합 유사도
        s_score = 1.0 / (1.0 + abs(sum(chrom) - avg_sum))
        # (c) 홀짝 비율 유사도
        odd_count = len([n for n in chrom if n % 2 != 0])
        o_ratio = odd_count / 6.0
        o_score = 1.0 / (1.0 + abs(o_ratio - avg_odd_ratio))
        
        # 가중치 합
        return f_score + (10.0 * s_score) + (10.0 * o_score)

    # 4. GA 알고리즘 파라미터
    POP_SIZE = 100
    GENERATIONS = 200
    MUTATION_RATE = 0.05
    CROSSOVER_RATE = 0.8
    ELITE_COUNT = 5

    # 초기 집단 생성
    population = [sorted(random.sample(range(1, 46), 6)) for _ in range(POP_SIZE)]

    # 세대 진화
    for _ in range(GENERATIONS):
        # 적합도 계산
        scores = [(ind, fitness(ind)) for ind in population]
        scores.sort(key=lambda x: x[1], reverse=True)
        
        next_gen = [x[0] for x in scores[:ELITE_COUNT]] # 엘리트 보존
        
        while len(next_gen) < POP_SIZE:
            # 선택 (Tournament)
            def tournament():
                participants = random.sample(population, 3)
                return max(participants, key=fitness)
            
            parent1 = tournament()
            parent2 = tournament()
            
            # 교차
            if random.random() < CROSSOVER_RATE:
                # Uniform Crossover 변형: 부모 유전자 풀에서 랜덤 추출
                combined = list(set(parent1 + parent2))
                child = random.sample(combined, 6)
            else:
                child = parent1[:]
                
            # 변이
            if random.random() < MUTATION_RATE:
                idx = random.randint(0, 5)
                child[idx] = random.randint(1, 45)
                
            next_gen.append(repair_chromosome(child))
            
        population = next_gen

    # 5. 최종 결과 선택
    final_scores = [(ind, fitness(ind)) for ind in population]
    final_scores.sort(key=lambda x: x[1], reverse=True)
    best_indices = [0, 1] # 상위 2개

    method = "유전 알고리즘"
    group_id = f"group_ga_{uuid.uuid4().hex[:8]}"
    saved_sets = []

    for idx in best_indices:
        nums = final_scores[idx][0]
        
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
    GA(유전 알고리즘) 기법의 1~45번 숫자별 정규화된 확률 분포(freq_map 기반)를 도출합니다.
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

    flat_numbers = [num for row in rows for num in row]
    freq_counter = Counter(flat_numbers)
    
    scores = np.zeros(45, dtype=float)
    for i in range(1, 46):
        scores[i-1] = freq_counter.get(i, 0)
        
    scores = np.maximum(scores, 1e-2)
    total_score = scores.sum()
    norm_probs = scores / total_score
    return norm_probs.tolist()
