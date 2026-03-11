import random
import numpy as np
import uuid
from collections import Counter
from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries

def generate_pso_sets(count: int, draw_no: int) -> list[dict]:
    """
    입자 군집 최적화(Particle Swarm Optimization)를 사용하여 로또 번호를 추천합니다.
    1. 연속형 공간에서 입자의 위치와 속도를 업데이트
    2. 이산형 변환(repair_position)을 통해 유효한 로또 번호 세트 도출
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
    def repair_position(pos: np.ndarray) -> list[int]:
        # 연속형 값을 1~45 사이의 유니크한 정수 리스트로 변환
        ints = np.round(pos).astype(int)
        valid_nums = []
        for n in ints:
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
        
        return f_score + (10.0 * s_score) + (10.0 * o_score)

    # 4. PSO 알고리즘 파라미터
    NUM_PARTICLES = 50
    MAX_ITER = 200
    w = 0.7      # 관성 가중치
    c1 = 1.5     # 개인 학습 인자 (Cognitive)
    c2 = 1.5     # 사회 학습 인자 (Social)
    v_max = 5.0  # 속도 상한 (Velocity Clamping)

    # 초기화
    # positions: (NUM_PARTICLES, 6)
    positions = np.array([sorted(random.sample(range(1, 46), 6)) for _ in range(NUM_PARTICLES)], dtype=float)
    velocities = (np.random.rand(NUM_PARTICLES, 6) - 0.5) * 2.0 # -1 ~ 1 사이 초기 속도
    
    # 개인 최적 위치 및 점수
    pbest_pos = np.copy(positions)
    pbest_scores = np.array([fitness(repair_position(p)) for p in positions])
    
    # 군집 최적 위치 및 점수
    gbest_idx = np.argmax(pbest_scores)
    gbest_pos = np.copy(pbest_pos[gbest_idx])
    gbest_score = pbest_scores[gbest_idx]

    # 최적화 루프
    for _ in range(MAX_ITER):
        for i in range(NUM_PARTICLES):
            # 속도 업데이트
            r1, r2 = np.random.rand(6), np.random.rand(6)
            velocities[i] = (w * velocities[i] + 
                             c1 * r1 * (pbest_pos[i] - positions[i]) + 
                             c2 * r2 * (gbest_pos - positions[i]))
            
            # 속도 제한
            velocities[i] = np.clip(velocities[i], -v_max, v_max)
            
            # 위치 업데이트
            positions[i] = positions[i] + velocities[i]
            
            # 범위 제한 (위치 자체도 대략적인 범위를 유지하도록)
            positions[i] = np.clip(positions[i], 1.0, 45.0)
            
            # 이산화 및 성능 평가
            current_nums = repair_position(positions[i])
            current_score = fitness(current_nums)
            
            # pbest 갱신
            if current_score > pbest_scores[i]:
                pbest_scores[i] = current_score
                pbest_pos[i] = np.array(current_nums, dtype=float)
                
                # gbest 갱신
                if current_score > gbest_score:
                    gbest_score = current_score
                    gbest_pos = np.array(current_nums, dtype=float)

    # 5. 최종 결과 선택
    # pbest들 중에서 최상위 2개 선택 (혹은 gbest와 그 다음 pbest)
    unique_pbests = []
    seen = set()
    
    # pbest들을 점수순으로 정렬
    sorted_indices = np.argsort(pbest_scores)[::-1]
    
    for idx in sorted_indices:
        nums = tuple(repair_position(pbest_pos[idx]))
        if nums not in seen:
            seen.add(nums)
            unique_pbests.append(list(nums))
        if len(unique_pbests) >= count:
            break

    method = "입자 군집 최적화"
    group_id = f"group_pso_{uuid.uuid4().hex[:8]}"
    saved_sets = []

    for nums in unique_pbests:
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
    PSO(입자 군집 최적화) 기법의 1~45번 숫자별 정규화된 확률 분포를 도출합니다.
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
