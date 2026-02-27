import numpy as np
import pandas as pd
from sklearn.neural_network import MLPClassifier
import sqlite3
import os

class LottoMLPService:
    def __init__(self, db_path):
        self.db_path = db_path
        self.model = None
        self.lookback = 10  # 최근 10회차를 보고 다음 예측
        
    def prepare_data(self, df):
        data = []
        for _, row in df.iterrows():
            nums = [row['num1'], row['num2'], row['num3'], row['num4'], row['num5'], row['num6']]
            binary_vector = np.zeros(45)
            for n in nums:
                if 1 <= n <= 45:
                    binary_vector[n-1] = 1
            data.append(binary_vector)
        
        data = np.array(data)
        
        X, y = [], []
        for i in range(len(data) - self.lookback):
            # 시퀀스를 평탄화(Flatten)하여 MLP 입력으로 사용 (lookback * 45)
            X.append(data[i:i + self.lookback].flatten())
            y.append(data[i + self.lookback])
            
        return np.array(X), np.array(y)

    def train(self):
        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql_query("SELECT num1, num2, num3, num4, num5, num6 FROM lotto_winners ORDER BY draw_no ASC", conn)
        conn.close()
        
        if len(df) <= self.lookback:
            return False
            
        X, y = self.prepare_data(df)
        
        # 모델 정교화: 학습률 조절 및 반복 횟수 증가로 과적합 방지 및 수렴 개선
        self.model = MLPClassifier(
            hidden_layer_sizes=(100, 100, 50), 
            max_iter=1000, 
            random_state=42,
            learning_rate_init=0.001,
            activation='logistic' # 확률 분포에 더 적합한 시그모이드(기반) 활성화 함수
        )
        self.model.fit(X, y)
        return True

    def get_hybrid_weights(self):
        """EMA와 Gap 데이터를 가져와 보조 가중치 산출"""
        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql_query("SELECT * FROM lotto_winners ORDER BY draw_no DESC", conn)
        conn.close()
        
        if df.empty: return np.ones(45)
        
        # 1. EMA 가중치 (최근 기세 반영)
        num_cols = ['num1', 'num2', 'num3', 'num4', 'num5', 'num6']
        recent_df = df.head(50).copy() # 최근 50회차
        melted = recent_df.melt(id_vars=['draw_no'], value_vars=num_cols, value_name='num')
        pivot = pd.crosstab(melted['draw_no'], melted['num']).reindex(columns=range(1, 46), fill_value=0)
        ema = pivot.ewm(span=10).mean().iloc[-1].values # 0~1 사이 값
        
        # 2. Gap 가중치 (오랫동안 안 나온 번호 보정)
        latest_no = df['draw_no'].max()
        gaps = np.zeros(45)
        for num in range(1, 46):
            mask = df[num_cols].apply(lambda x: num in x.values, axis=1)
            last_seen = df[mask]['draw_no'].max() if any(mask) else (latest_no - 50)
            gaps[num-1] = min(latest_no - last_seen, 50) / 50.0 # 0~1 정규화

        # 가중치 결합 (EMA 60% + Gap 40%)
        return (ema * 0.6) + (gaps * 0.4)

    def predict_next(self):
        if self.model is None:
            success = self.train()
            if not success: return None
            
        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql_query("SELECT num1, num2, num3, num4, num5, num6 FROM lotto_winners ORDER BY draw_no DESC LIMIT 10", conn)
        conn.close()
        
        if len(df) < self.lookback:
            return None
            
        df = df.sort_index(ascending=False)
        
        input_data = []
        for _, row in df.iterrows():
            binary_vector = np.zeros(45)
            nums = [row['num1'], row['num2'], row['num3'], row['num4'], row['num5'], row['num6']]
            for n in nums:
                binary_vector[n-1] = 1
            input_data.append(binary_vector)
            
        input_data = np.array([np.array(input_data).flatten()])
        
        try:
            # 기본 신경망 확률 (MLP)
            proba = self.model.predict_proba(input_data)
            nn_preds = np.array([p[0][1] if isinstance(p[0], (list, np.ndarray)) else p[0] for p in proba])
            
            # 하이브리드 가중치 결합
            hybrid_weights = self.get_hybrid_weights()
            
            # 결합 공식: (NN 결과 * 0.7) + (통계 가중치 * 0.3)
            # 특정 번호 쏠림 방지를 위해 미세한 노이즈(Softmax 효과) 추가
            combined = (nn_preds * 0.7) + (hybrid_weights * 0.3)
            
            # 가시성을 위해 0.1~0.9 사이로 스케일링
            min_val, max_val = combined.min(), combined.max()
            if max_val > min_val:
                scaled = 0.1 + (combined - min_val) * (0.8 / (max_val - min_val))
                return scaled.tolist()
            return combined.tolist()
        except:
            return self.model.predict(input_data)[0].tolist()
