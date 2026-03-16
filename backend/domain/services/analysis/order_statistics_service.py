"""
순서 통계량(Order Statistics) 기반 번호별 추천 점수 산출.
포지션별 평균 + 가우시안 Max Pooling + 최근 회차 가중치.
외부 검색 반영: 이론적 기댓값(E[X_k]=k*46/7) 블렌딩, 최근 회차 시간감쇠 가중치.
"""
import numpy as np
from infrastructure.persistence.database import get_connection

# ----- 52회 5등 50% 목표 튜닝용 상수 (README 참고) -----
SIGMA = 5.0
RECENT_DRAWS = 6
RECENT_WEIGHT = 2.4
AVG_USE_LAST_N_DRAWS = 52
THEORETICAL_BLEND = 0.0
RECENT_DECAY = 0.85  # 최근 회차 시간감쇠


def get_scores(draw_no: int) -> list[float]:
    """
    순서 통계량(Order Statistics) 기반의 숫자별 추천 확률 도출.
    가산치 쏠림 현상을 방지하기 위해 Max Pooling 방식을 도입하고,
    최근 당첨 트렌드를 반영하기 위해 가중치를 부여합니다.
    """
    conn = get_connection()
    conn.row_factory = None
    cursor = conn.cursor()

    base_where = "WHERE draw_no IS NOT NULL AND draw_no < ?"
    params_avg: list = [draw_no]

    if AVG_USE_LAST_N_DRAWS > 0:
        # 최근 N회만 사용해 포지션별 평균 계산
        cursor.execute(
            f"""
            SELECT
                COUNT(draw_no) AS total_draws,
                AVG(num1) AS avg_1, AVG(num2) AS avg_2, AVG(num3) AS avg_3,
                AVG(num4) AS avg_4, AVG(num5) AS avg_5, AVG(num6) AS avg_6
            FROM (
                SELECT num1, num2, num3, num4, num5, num6, draw_no
                FROM lotto_winners
                {base_where}
                ORDER BY draw_no DESC
                LIMIT ?
            )
            """,
            [draw_no, AVG_USE_LAST_N_DRAWS],
        )
    else:
        # 해당 회차 미만 전체로 포지션별 평균 계산
        cursor.execute(
            f"""
            SELECT
                COUNT(draw_no) AS total_draws,
                AVG(num1) AS avg_1, AVG(num2) AS avg_2, AVG(num3) AS avg_3,
                AVG(num4) AS avg_4, AVG(num5) AS avg_5, AVG(num6) AS avg_6
            FROM lotto_winners
            {base_where}
            """,
            tuple(params_avg),
        )

    row = cursor.fetchone()
    total_draws = row[0] if row else 0
    if total_draws == 0:
        conn.close()
        return [1.0 / 45.0 for _ in range(45)]

    avg_vals = [row[i] for i in range(1, 7)]
    # 이론적 기댓값 블렌딩 (6/45: E[X_k] = k*46/7)
    theoretical = [k * 46.0 / 7.0 for k in range(1, 7)]
    blended = []
    for i in range(6):
        a = float(avg_vals[i]) if avg_vals[i] is not None else theoretical[i]
        blended.append((1.0 - THEORETICAL_BLEND) * a + THEORETICAL_BLEND * theoretical[i])
    avg_vals = blended

    # 2. 각 숫자에 대해 기댓값 근처 점수 부여 (Max Pooling)
    scores = np.zeros(45, dtype=float)
    for i in range(1, 46):
        max_v = 0.0
        for avg_val in avg_vals:
            if avg_val is None:
                continue
            val = np.exp(-((i - float(avg_val)) ** 2) / (2 * (SIGMA**2)))
            if val > max_v:
                max_v = val
        scores[i - 1] = max_v

    # 3. 최근 회차 당첨 번호 가중치 (시간감쇠: 더 최근 회차일수록 높은 가중치)
    cursor.execute(
        f"""
        SELECT num1, num2, num3, num4, num5, num6
        FROM lotto_winners
        {base_where}
        ORDER BY draw_no DESC LIMIT ?
        """,
        (draw_no, RECENT_DRAWS),
    )
    recent_rows = cursor.fetchall()
    weight_by_num: dict[int, float] = {}
    for draw_index, r in enumerate(recent_rows):
        decay = (RECENT_DECAY**draw_index) if RECENT_DECAY > 0 else 1.0
        w = RECENT_WEIGHT * decay
        for num in r:
            if num and 1 <= num <= 45:
                weight_by_num[num] = weight_by_num.get(num, 1.0) * w
    for num, w in weight_by_num.items():
        if w > 1.0:  # 가중치가 1 초과일 때만 적용 (기존과 동일한 방향)
            scores[num - 1] *= w

    scores = np.maximum(scores, 1e-10)
    normalized = scores / scores.sum()
    conn.close()
    return normalized.tolist()
