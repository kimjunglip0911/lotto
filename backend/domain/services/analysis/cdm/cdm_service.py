import uuid
from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries

def generate_cdm_sets(count: int, draw_no: int):
    """
    CDM (Compound-Dirichlet-Multinomial) 기법을 사용하여 번호를 추천합니다.
    """
    conn = get_connection()
    conn.row_factory = None 
    cursor = conn.cursor()
    
    # 1. 과거 당첨 데이터 전체 조회 (n_j 계산)
    if draw_no:
        cursor.execute("SELECT num1, num2, num3, num4, num5, num6 FROM lotto_winners WHERE draw_no < ?", (draw_no,))
    else:
        cursor.execute("SELECT num1, num2, num3, num4, num5, num6 FROM lotto_winners")
    rows = cursor.fetchall()
    
    counts = {i: 0 for i in range(1, 46)}
    for row in rows:
        for num in row:
            if num in counts:
                counts[num] += 1
                
    # 2. CDM 기댓값 계산 (W_j = alpha_j + n_j)
    alpha = 1.0
    weights = []
    for num in range(1, 46):
        weight = alpha + counts[num]
        weights.append((num, weight))
        
    weights.sort(key=lambda x: x[1], reverse=True)
    top_numbers = [w[0] for w in weights]
    
    sets_to_save = []
    method = "CDM 바이시안"
    group_id = f"group_cdm_{uuid.uuid4().hex[:8]}"
    
    for i in range(count):
        # 앞에서부터 6개씩 끊어서 생성 (가장 확률 높은 세트부터)
        start_idx = (i * 6) % len(top_numbers)
        end_idx = start_idx + 6
        nums = top_numbers[start_idx:end_idx]
        if len(nums) < 6:
             # 모자라면 처음부터 다시 붙임
             nums.extend(top_numbers[:6 - len(nums)])
        nums = sorted(nums)
        
        cursor.execute(queries.INSERT_DRAWING, (
            group_id,
            nums[0], nums[1], nums[2],
            nums[3], nums[4], nums[5],
            0, # bonus_num
            0, # draw_count
            method,
            draw_no
        ))
        
        sets_to_save.append({
            "num1": nums[0], "num2": nums[1], "num3": nums[2],
            "num4": nums[3], "num5": nums[4], "num6": nums[5],
            "method": method,
            "draw_no": draw_no,
            "group_id": group_id
        })
        
    conn.commit()
    conn.close()
    return sets_to_save

def get_scores(draw_no: int) -> list[float]:
    """
    CDM 기법의 1~45번 숫자별 정규화된 확률을 도출합니다.
    """
    conn = get_connection()
    conn.row_factory = None 
    cursor = conn.cursor()
    
    if draw_no:
        cursor.execute("SELECT num1, num2, num3, num4, num5, num6 FROM lotto_winners WHERE draw_no < ?", (draw_no,))
    else:
        cursor.execute("SELECT num1, num2, num3, num4, num5, num6 FROM lotto_winners")
    rows = cursor.fetchall()
    conn.close()
    
    counts = {i: 0 for i in range(1, 46)}
    for row in rows:
        for num in row:
            if num in counts:
                counts[num] += 1
                
    alpha = 1.0
    scores = []
    for num in range(1, 46):
        weight = alpha + counts[num]
        scores.append(weight)
        
    total_score = sum(scores)
    normalized = [s / total_score for s in scores]
    return normalized
