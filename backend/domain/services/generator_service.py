import random
from typing import List, Dict

def generate_random_sets(count: int = 20) -> List[Dict[str, int]]:
    """
    순수 난수 기반으로 1~45 사이 중복되지 않는 6개의 숫자를 가진 세트를 count개 생성합니다.
    """
    results = []
    pool = list(range(1, 46))
    
    for _ in range(count):
        selected = random.sample(pool, 6)
        selected.sort()
        results.append({
            "num1": selected[0],
            "num2": selected[1],
            "num3": selected[2],
            "num4": selected[3],
            "num5": selected[4],
            "num6": selected[5],
            "method": "Random Generation"
        })
        
    return results
