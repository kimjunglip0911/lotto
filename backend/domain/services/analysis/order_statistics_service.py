import numpy as np
from infrastructure.persistence.database import get_connection

def get_scores(draw_no: int) -> list[float]:
    """
    순서 통계량(Order Statistics) 기반의 숫자별 추천 확률 도출.
    과거 당첨 번호의 각 자리(1~6번째) 평균값을 기준으로, 해당 평균에 가까운 번호들에
    정규 분포(Gaussian) 형태로 가중치를 두어 1~45 각 숫자의 확률 스코어를 계산합니다.
    """
    conn = get_connection()
    conn.row_factory = None
    cursor = conn.cursor()
    
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
    conn.close()

    total_draws = row[0] if row else 0
    if total_draws == 0:
        return [1.0 / 45.0 for _ in range(45)]
    
    avg_vals = [row[i] for i in range(1, 7)]
    
    # 1. 각 숫자에 대해 기댓값 근처에 있을 수록 높은 점수를 부여
    scores = np.zeros(45, dtype=float)
    sigma = 3.0  # 표준 편차 3 
    
    for i in range(1, 46):
        # 45개 번호 각각에 대해, 각 포지션 기댓값과의 거리를 측정하여 가우시안 점수 배정
        for avg_val in avg_vals:
            if avg_val is None:
                continue
            # x = num, mu = avg_val. exp(-(x-u)^2 / (2*stdev^2))
            score = np.exp(-((i - float(avg_val))**2) / (2 * (sigma**2)))
            scores[i-1] += score
            
    # 최소 점수 보정 (0 방지)
    scores = np.maximum(scores, 1e-5)
    
    # 확률화 정규화
    normalized = scores / scores.sum()
    return normalized.tolist()
