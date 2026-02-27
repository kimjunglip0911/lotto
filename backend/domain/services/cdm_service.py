import numpy as np
import pandas as pd
import sqlite3
from scipy.special import digamma

class LottoCDMService:
    def __init__(self, db_path):
        self.db_path = db_path
        
    def analyze(self):
        """베이지안 Dirichlet-Multinomial 모델 기반 확률 추정"""
        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql_query("SELECT num1, num2, num3, num4, num5, num6 FROM lotto_winners", conn)
        conn.close()
        
        if len(df) < 10:
            return []
            
        # 1. 각 번호별 출현 빈도 계산
        all_numbers = df.values.flatten()
        counts = pd.Series(all_numbers).value_counts().reindex(range(1, 46), fill_value=0)
        
        # 2. Dirichlet-Multinomial 사후 확률 추정
        # Alpha (Prior): 모든 번호에 대해 균등한 사전 확률 부여 (무정보 사전 분포)
        alpha_prior = 1.0 
        
        # 사후 파라미터 = 사전 파라미터 + 관측 빈도
        alphas_posterior = counts + alpha_prior
        
        # 기대 확률 E[p_i] = alpha_i / sum(alpha_j)
        total_alpha = alphas_posterior.sum()
        probabilities = alphas_posterior / total_alpha
        
        # 3. 결과 조립 및 정렬
        results = []
        for num, prob in probabilities.items():
            results.append({
                "number": int(num),
                "probability": float(prob),
                "count": int(counts[num])
            })
            
        # 확률 기준 내림차순 정렬하여 순위 부여
        results.sort(key=lambda x: x['probability'], reverse=True)
        for i, res in enumerate(results):
            res['rank'] = i + 1
            
        return sorted(results, key=lambda x: x['number']) # 다시 번호순으로 반환 (차트용)
