import numpy as np
import pandas as pd
from sklearn.neural_network import MLPClassifier
import sqlite3
import os

class LottoMLPService:
    def __init__(self, db_path):
        self.db_path = db_path
        self.model = None
        self.lookback = 20  # 변경: 10 → 20 (패턴 인식 범위 확대)
        
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
        
        # 모델 정교화: 구조 확장 및 얼리 스토핑 도입
        self.model = MLPClassifier(
            hidden_layer_sizes=(256, 128, 64), 
            max_iter=2000, 
            random_state=42,
            learning_rate_init=0.001,
            activation='logistic',
            early_stopping=True,
            validation_fraction=0.1
        )
        self.model.fit(X, y)
        return True

    def get_hybrid_weights(self, draw_no: int = None):
        """EMA와 Gap 데이터를 가져와 보조 가중치 산출"""
        conn = sqlite3.connect(self.db_path)
        if draw_no:
            df = pd.read_sql_query("SELECT * FROM lotto_winners WHERE draw_no < ? ORDER BY draw_no DESC", conn, params=(draw_no,))
        else:
            df = pd.read_sql_query("SELECT * FROM lotto_winners ORDER BY draw_no DESC", conn)
        conn.close()
        
        if df.empty: return np.ones(45)
        
        # 1. EMA 가중치 (최근 기세 반영 - Span=20으로 완화)
        num_cols = ['num1', 'num2', 'num3', 'num4', 'num5', 'num6']
        recent_df = df.head(100).copy() # 최근 100회차로 범위 확대
        melted = recent_df.melt(id_vars=['draw_no'], value_vars=num_cols, value_name='num')
        pivot = pd.crosstab(melted['draw_no'], melted['num']).reindex(columns=range(1, 46), fill_value=0)
        ema = pivot.ewm(span=20).mean().iloc[-1].values 
        
        # 2. Gap 가중치 (번호별 평균 주기를 고려한 반등 확률)
        latest_no = df['draw_no'].max()
        total_draws = len(df)
        gaps = np.zeros(45)
        for num in range(1, 46):
            mask = df[num_cols].apply(lambda x: num in x.values, axis=1)
            appearances = mask.sum()
            
            if appearances > 0:
                avg_period = total_draws / appearances # 평균 출현 주기
                last_seen = df[mask]['draw_no'].max()
                current_gap = latest_no - last_seen
                # 평균 주기에 가까워지거나 넘었을 때 가중치 상승 (Sigmoid 형태 권장하나 여기선 선형+캡핑)
                gap_weight = min(current_gap / (avg_period * 1.5), 1.2) 
                gaps[num-1] = gap_weight
            else:
                gaps[num-1] = 0.5

        # 3. 장기 빈도 (Total Frequency - 밸런스 유지)
        total_counts = np.zeros(45)
        for num in range(1, 46):
            total_counts[num-1] = (df[num_cols] == num).sum().sum()
        freq_weight = total_counts / (total_counts.max() if total_counts.max() > 0 else 1)

        # 가중치 결합 (EMA 40% + Gap 40% + Freq 20%)
        return (ema * 0.4) + (gaps * 0.4) + (freq_weight * 0.2)

    def predict_next(self, draw_no: int = None):
        if self.model is None:
            success = self.train()
            if not success: return None
            
        conn = sqlite3.connect(self.db_path)
        if draw_no:
            query = f"SELECT num1, num2, num3, num4, num5, num6 FROM lotto_winners WHERE draw_no < ? ORDER BY draw_no DESC LIMIT {self.lookback}"
            df = pd.read_sql_query(query, conn, params=(draw_no,))
        else:
            df = pd.read_sql_query(f"SELECT num1, num2, num3, num4, num5, num6 FROM lotto_winners ORDER BY draw_no DESC LIMIT {self.lookback}", conn)
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
            hybrid_weights = self.get_hybrid_weights(draw_no=draw_no)
            
            # 결합 공식: (NN 결과 * 0.6) + (통계 가중치 * 0.4) - 신경망 비중 강화
            combined = (nn_preds * 0.6) + (hybrid_weights * 0.4)
            
            # 가시성 및 신뢰도를 위해 0.2~0.8 사이로 안정화 (Softmax 효과)
            min_val, max_val = combined.min(), combined.max()
            if max_val > min_val:
                scaled = 0.2 + (combined - min_val) * (0.6 / (max_val - min_val))
                return scaled.tolist()
            return combined.tolist()
        except:
            return None
            
    def predict_multiple(self, draw_no: int = None, n_iterations: int = 5):
        """서로 다른 random_state로 N번 학습+예측하여 다양한 확률 벡터 반환"""
        conn = sqlite3.connect(self.db_path)
        if draw_no:
            df = pd.read_sql_query("SELECT num1, num2, num3, num4, num5, num6 FROM lotto_winners WHERE draw_no < ? ORDER BY draw_no ASC", conn, params=(draw_no,))
        else:
            df = pd.read_sql_query("SELECT num1, num2, num3, num4, num5, num6 FROM lotto_winners ORDER BY draw_no ASC", conn)
        conn.close()
        
        if len(df) <= self.lookback:
            return []
            
        X, y = self.prepare_data(df)
        results = []
        
        for i in range(n_iterations):
            # 시드를 변경하며 학습 (다양성 확보)
            model = MLPClassifier(
                hidden_layer_sizes=(256, 128, 64), 
                max_iter=2000, 
                random_state=42 + i * 7,
                learning_rate_init=0.001,
                activation='logistic',
                early_stopping=True,
                validation_fraction=0.1
            )
            try:
                model.fit(X, y)
                # 현재 모델을 임시로 교체하여 predict_next 호출
                original_model = self.model
                self.model = model
                pred = self.predict_next(draw_no)
                self.model = original_model
                
                if pred:
                    results.append(pred)
            except:
                continue
                
        return results
