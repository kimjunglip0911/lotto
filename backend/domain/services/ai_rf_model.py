import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import sqlite3
import os

class LottoRFService:
    def __init__(self, db_path):
        self.db_path = db_path
        self.model = None
        self.lookback = 20  # 변경: 10 → 20 (패턴 인식 범위 확대)
        
    def prepare_data(self, df):
        """데이터를 RF 학습용 벡터로 변환 (pandas 활용)"""
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
            # 시퀀스를 평탄화하여 입력으로 사용
            X.append(data[i:i + self.lookback].flatten())
            y.append(data[i + self.lookback])
            
        return np.array(X), np.array(y)

    def train(self):
        """Random Forest 모델 학습"""
        conn = sqlite3.connect(self.db_path)
        # pandas를 사용하여 데이터 로드
        df = pd.read_sql_query("SELECT num1, num2, num3, num4, num5, num6 FROM lotto_winners ORDER BY draw_no ASC", conn)
        conn.close()
        
        if len(df) <= self.lookback:
            return False
            
        X, y = self.prepare_data(df)
        
        # Random Forest 모델 생성 및 학습
        self.model = RandomForestClassifier(
            n_estimators=500,
            max_depth=15,
            min_samples_leaf=2,
            max_features='sqrt',
            random_state=42
        )
        self.model.fit(X, y)
        return True

    def get_hybrid_weights(self, draw_no: int = None):
        """EMA, Gap, Frequency 데이터를 종합하여 보조 가중치 산출"""
        conn = sqlite3.connect(self.db_path)
        if draw_no:
            df = pd.read_sql_query("SELECT * FROM lotto_winners WHERE draw_no < ? ORDER BY draw_no DESC", conn, params=(draw_no,))
        else:
            df = pd.read_sql_query("SELECT * FROM lotto_winners ORDER BY draw_no DESC", conn)
        conn.close()
        
        if df.empty: return np.ones(45)
        
        # 1. EMA 가중치 (최근 기세 반영 - Span=20)
        num_cols = ['num1', 'num2', 'num3', 'num4', 'num5', 'num6']
        recent_df = df.head(100).copy()
        melted = recent_df.melt(id_vars=['draw_no'], value_vars=num_cols, value_name='num')
        pivot = pd.crosstab(melted['draw_no'], melted['num']).reindex(columns=range(1, 46), fill_value=0)
        ema = pivot.ewm(span=20).mean().iloc[-1].values 
        
        # 2. Gap 가중치 (평균 주기 대비 지연 시간)
        latest_no = df['draw_no'].max()
        total_draws = len(df)
        gaps = np.zeros(45)
        for num in range(1, 46):
            mask = df[num_cols].apply(lambda x: num in x.values, axis=1)
            appearances = mask.sum()
            if appearances > 0:
                avg_period = total_draws / appearances
                last_seen = df[mask]['draw_no'].max()
                gap_weight = min((latest_no - last_seen) / (avg_period * 1.5), 1.2) 
                gaps[num-1] = gap_weight
            else:
                gaps[num-1] = 0.5

        # 3. 장기 빈도 (Total Frequency)
        total_counts = np.zeros(45)
        for num in range(1, 46):
            total_counts[num-1] = (df[num_cols] == num).sum().sum()
        freq_weight = total_counts / (total_counts.max() if total_counts.max() > 0 else 1)

        return (ema * 0.4) + (gaps * 0.4) + (freq_weight * 0.2)

    def predict_next(self, draw_no: int = None):
        """다음 회차 당첨 확률 예측"""
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
            
        # 최신 10회차 데이터를 학습 때와 같은 순서(ASC)로 정렬
        df = df.sort_index(ascending=False)
        
        input_data = []
        for _, row in df.iterrows():
            binary_vector = np.zeros(45)
            nums = [row['num1'], row['num2'], row['num3'], row['num4'], row['num5'], row['num6']]
            for n in nums:
                binary_vector[n-1] = 1
            input_data.append(binary_vector)
            
        # 평탄화하여 2차원 배열로 변환 (1, lookback * 45)
        input_data = np.array([np.array(input_data).flatten()])
        
        try:
            # Random Forest 확률 예측
            # RF의 predict_proba는 각 클래스(0 또는 1)에 대한 확률을 반환함
            # 45개 번호 각각에 대해 독립적으로 학습된 다중 출력 모델이거나
            # 각 번호별로 리스트가 반환될 수 있음. RandomForestClassifier는 보통 다중 라벨 출력을 지원함.
            # RF 기본 확률 추출
            proba = self.model.predict_proba(input_data)
            rf_preds = np.zeros(45)
            for i, p in enumerate(proba):
                if p.shape[1] == 2:
                    rf_preds[i] = p[0][1]
            
            # 하이브리드 가중치 결합
            hybrid_weights = self.get_hybrid_weights(draw_no=draw_no)
            
            # 결합 공식: (RF 결과 * 0.55) + (통계 가중치 * 0.45)
            combined = (rf_preds * 0.55) + (hybrid_weights * 0.45)
            
            # 0.2~0.8 사이로 안정화
            min_val, max_val = combined.min(), combined.max()
            if max_val > min_val:
                scaled = 0.2 + (combined - min_val) * (0.6 / (max_val - min_val))
                return scaled.tolist()
            return combined.tolist()
            
        except Exception as e:
            print(f"RF Prediction Error: {e}")
            return None

    def predict_multiple(self, draw_no: int = None, n_iterations: int = 5):
        """다양한 random_state로 N번 학습+예측 (앙상블용)"""
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
            model = RandomForestClassifier(
                n_estimators=500,
                max_depth=15,
                min_samples_leaf=2,
                max_features='sqrt',
                random_state=42 + i * 7
            )
            try:
                model.fit(X, y)
                original_model = self.model
                self.model = model
                pred = self.predict_next(draw_no)
                self.model = original_model
                
                if pred:
                    results.append(pred)
            except:
                continue
                
        return results
