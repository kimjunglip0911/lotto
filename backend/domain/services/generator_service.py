import random
from typing import List, Dict

AI_METHODS = [
    "MLP TOP6 (Pure)",
    "MLP TOP6 (Prob)",
    "RF TOP6 (Pure)",
    "RF TOP6 (Prob)",
    "군집화 및 PCA (Fallback)",
    "군집화 및 PCA (Fallback)",
    "회귀 분석 (Fallback)",
    "회귀 분석 (Fallback)",
    "LightGBM 앙상블",
    "XGBoost 패턴 예측",
    "LSTM 시계열 분석",
    "LSTM 시계열 (변동값)",
    "Transformer 어텐션",
    "몬테카를로 시뮬레이션",
    "순서 통계량 (이론 vs 실제)",
    "이동 평균 (EMA) 분석",
    "과거 당첨 빈도 유사도 (KNN)",
    "출현 주기 (Gap) 극대화",
    "생성형 적대 신경망 (GAN)",
    "심층 강화학습 (RL) 추천"
]

def generate_random_sets(count: int = 20, start_index: int = 0) -> List[Dict[str, int]]:
    """
    순수 난수 기반으로 1~45 사이 중복되지 않는 6개의 숫자를 가진 세트를 count개 생성합니다.
    start_index를 기반으로 AI_METHODS의 기법명을 순차적으로 부여합니다.
    """
    results = []
    pool = list(range(1, 46))
    
    for i in range(count):
        selected = random.sample(pool, 6)
        selected.sort()
        
        # 20개 이상의 count가 들어오더라도 안전하게 매핑되도록 처리
        method_name = AI_METHODS[(start_index + i) % len(AI_METHODS)]
        
        results.append({
            "num1": selected[0],
            "num2": selected[1],
            "num3": selected[2],
            "num4": selected[3],
            "num5": selected[4],
            "num6": selected[5],
            "method": method_name
        })
        
    return results
