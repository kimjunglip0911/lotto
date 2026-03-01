import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, LogisticRegression
import sqlite3
import os

class LottoRegressionService:
    def __init__(self, db_path):
        self.db_path = db_path
        
    def analyze(self, draw_no: int = None):
        """회귀 분석 수행 (선형 합계 추세 + 로지스틱 패턴 분류)"""
        conn = sqlite3.connect(self.db_path)
        if draw_no:
            df = pd.read_sql_query("SELECT draw_no, num1, num2, num3, num4, num5, num6 FROM lotto_winners WHERE draw_no < ? ORDER BY draw_no ASC", conn, params=(draw_no,))
        else:
            df = pd.read_sql_query("SELECT draw_no, num1, num2, num3, num4, num5, num6 FROM lotto_winners ORDER BY draw_no ASC", conn)
        conn.close()
        
        if len(df) < 20: # 최소 데이터 부족
            return {}
            
        # 1. 선형 회귀: 당첨 번호 합계 추세 분석
        num_cols = ['num1', 'num2', 'num3', 'num4', 'num5', 'num6']
        df['sum'] = df[num_cols].sum(axis=1)
        
        # 최근 100회차 데이터로 추세 분석
        recent_df = df.tail(100).copy()
        X_linear = recent_df['draw_no'].values.reshape(-1, 1)
        y_linear = recent_df['sum'].values
        
        lin_reg = LinearRegression()
        lin_reg.fit(X_linear, y_linear)
        
        # 회귀선 포인트 (시작과 끝)
        X_pred = np.array([X_linear.min(), X_linear.max() + 1]).reshape(-1, 1)
        y_pred = lin_reg.predict(X_pred)
        
        linear_trend = {
            "draw_nos": X_linear.flatten().tolist(),
            "actual_sums": y_linear.tolist(),
            "regression_line": {
                "x": X_pred.flatten().tolist(),
                "y": y_pred.tolist()
            },
            "next_predicted_sum": float(y_pred[-1])
        }
        
        # 2. 로지스틱 회귀: 특정 패턴 출현 확률 (번호 구간별 균형 여부)
        # 예: 1-10번대 번호가 2개 이상 나올 것인가? (바이너리 분류)
        df['low_count'] = df[num_cols].apply(lambda x: len([n for n in x if n <= 15]), axis=1)
        df['is_low_heavy'] = (df['low_count'] >= 3).astype(int) # 낮은 번호가 3개 이상인 경우
        
        # 특징(Feature): 직전 5회차의 평균 합계, 평균 홀짝수 등
        df['prev_avg_sum'] = df['sum'].shift(1).rolling(window=5).mean()
        df = df.dropna()
        
        if len(df) > 10:
            X_logistic = df[['prev_avg_sum']].values
            y_logistic = df['is_low_heavy'].values
            
            log_reg = LogisticRegression()
            log_reg.fit(X_logistic, y_logistic)
            
            # 다음 회차 확률 예측 (가장 최근 데이터 기반)
            latest_avg_sum = df['sum'].tail(5).mean()
            prob = log_reg.predict_proba([[latest_avg_sum]])[0][1] # 1(Heavy)일 확률
        else:
            prob = 0.5
            
        logistic_analysis = {
            "pattern_name": "낮은 번호대(1-15) 3개 이상 출현 확률",
            "probability": float(prob)
        }
        
        return {
            "linear": linear_trend,
            "logistic": logistic_analysis
        }
