import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import sqlite3
import os

class LottoClusteringService:
    def __init__(self, db_path):
        self.db_path = db_path
        
    def analyze(self, draw_no: int = None):
        """K-Means 군집화 및 PCA 분석 수행"""
        conn = sqlite3.connect(self.db_path)
        if draw_no:
            df = pd.read_sql_query("SELECT draw_no, num1, num2, num3, num4, num5, num6 FROM lotto_winners WHERE draw_no < ? ORDER BY draw_no ASC", conn, params=(draw_no,))
        else:
            df = pd.read_sql_query("SELECT draw_no, num1, num2, num3, num4, num5, num6 FROM lotto_winners ORDER BY draw_no ASC", conn)
        conn.close()
        
        if len(df) < 5: # 최소 데이터 부족
            return []
            
        # 1. 45차원 바이너리 벡터 생성 (번호 조합 구조 분석용)
        num_cols = ['num1', 'num2', 'num3', 'num4', 'num5', 'num6']
        matrix = np.zeros((len(df), 45))
        
        for i, row in df.iterrows():
            for col in num_cols:
                n = int(row[col])
                if 1 <= n <= 45:
                    matrix[i, n-1] = 1
        
        # 2. K-Means 군집화 (5개 그룹으로 분류)
        kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(matrix)
        
        # 3. PCA 차원 축소 (2차원으로 축소하여 시각화)
        pca = PCA(n_components=2, random_state=42)
        pca_result = pca.fit_transform(matrix)
        
        # 4. 결과 조립
        results = []
        for i in range(len(df)):
            results.append({
                "draw_no": int(df.iloc[i]['draw_no']),
                "x": float(pca_result[i, 0]),
                "y": float(pca_result[i, 1]),
                "cluster": int(clusters[i]),
                "numbers": [int(df.iloc[i][col]) for col in num_cols]
            })
            
        return results
