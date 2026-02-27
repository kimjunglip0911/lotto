import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import sqlite3
import os

class LottoRFService:
    def __init__(self, db_path):
        self.db_path = db_path
        self.model = None
        self.lookback = 10  # 최근 10회차를 보고 다음 예측
        
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
        # n_estimators: 트리의 개수
        # random_state: 결과 재현성을 위한 시드
        self.model = RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            random_state=42
        )
        self.model.fit(X, y)
        return True

    def predict_next(self):
        """다음 회차 당첨 확률 예측"""
        if self.model is None:
            success = self.train()
            if not success: return None
            
        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql_query("SELECT num1, num2, num3, num4, num5, num6 FROM lotto_winners ORDER BY draw_no DESC LIMIT 10", conn)
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
            proba = self.model.predict_proba(input_data)
            
            # 각 번호(1~45)가 선택될 확률(1일 확률) 추출
            # RandomForest 다중 출력의 경우 리스트 내에 각 출력별 (n_samples, n_classes) 배열이 들어있음
            rf_preds = []
            for p in proba:
                # p[0]은 [[prob_0, prob_1]] 형태
                if isinstance(p, list): # 드문 경우
                    p = np.array(p)
                
                if p.shape[1] == 2:
                    rf_preds.append(p[0][1])
                else:
                    # 데이터에 1이 없는 경우 등이 발생하면 클래스가 1개일 수 있음
                    rf_preds.append(0.0)
            
            # 가시성을 위해 보정 (MLP 서비스와 유사하게 0.1 ~ 0.9 사이 스케일링 권장)
            combined = np.array(rf_preds)
            min_val, max_val = combined.min(), combined.max()
            if max_val > min_val:
                scaled = 0.1 + (combined - min_val) * (0.8 / (max_val - min_val))
                return scaled.tolist()
            return combined.tolist()
            
        except Exception as e:
            print(f"RF Prediction Error: {e}")
            return None
