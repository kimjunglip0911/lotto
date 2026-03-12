import numpy as np
from infrastructure.persistence.database import get_connection

def get_scores(draw_no: int) -> list[float]:
    """
    순서 통계량(Order Statistics) 기반의 숫자별 추천 확률 도출.
    가산치 쏠림 현상을 방지하기 위해 Max Pooling 방식을 도입하고,
    최근 당첨 트렌드를 반영하기 위해 가중치를 부여합니다.
    """
    conn = get_connection()
    conn.row_factory = None
    cursor = conn.cursor()
    
    # 1. 포지션별(1~6) 평균값 조회
    base_where = "WHERE draw_no IS NOT NULL AND draw_no < ?"
    cursor.execute(f"""
        SELECT 
            COUNT(draw_no) as total_draws,
            AVG(num1) as avg_1, AVG(num2) as avg_2, AVG(num3) as avg_3,
            AVG(num4) as avg_4, AVG(num5) as avg_5, AVG(num6) as avg_6
        FROM lotto_winners
        {base_where}
    """, (draw_no,))
    row = cursor.fetchone()

    total_draws = row[0] if row else 0
    if total_draws == 0:
        conn.close()
        return [1.0 / 45.0 for _ in range(45)]
    
    avg_vals = [row[i] for i in range(1, 7)]
    
    # 2. 각 숫자에 대해 기댓값 근처 점수 부여 (Max Pooling)
    scores = np.zeros(45, dtype=float)
    sigma = 4.0  # 정밀 검증 결과 최적 분산값
    
    for i in range(1, 46):
        max_v = 0.0
        for avg_val in avg_vals:
            if avg_val is None:
                continue
            # 가우시안 점수 계산
            val = np.exp(-((i - float(avg_val))**2) / (2 * (sigma**2)))
            if val > max_v:
                max_v = val
        scores[i-1] = max_v

    # 3. 최근 5회차 당첨 번호 가중치 부여 (최근 트렌드 반영)
    RECENT_DRAWS = 5
    RECENT_WEIGHT = 2.0
    
    cursor.execute(f"""
        SELECT num1, num2, num3, num4, num5, num6 
        FROM lotto_winners 
        {base_where}
        ORDER BY draw_no DESC LIMIT ?
    """, (draw_no, RECENT_DRAWS))
    recent_rows = cursor.fetchall()
    
    freq = {}
    for r in recent_rows:
        for num in r:
            if num:
                freq[num] = freq.get(num, 0) + 1
    
    for num, count in freq.items():
        if 1 <= num <= 45:
            scores[num - 1] *= (RECENT_WEIGHT ** count)
            
    # 최소 점수 보정 (0 방지) 및 정규화
    scores = np.maximum(scores, 1e-10)
    normalized = scores / scores.sum()
    
    conn.close()
    return normalized.tolist()
