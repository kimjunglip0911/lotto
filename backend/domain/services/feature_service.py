import pandas as pd
import sqlite3

class LottoFeatureService:
    def __init__(self, db_path):
        self.db_path = db_path

    def analyze(self, draw_no: int = None, limit: int = 50):
        """특성 공학 및 조합 분석 데이터 추출"""
        conn = sqlite3.connect(self.db_path)
        # 최신 회차부터 limit 만큼 가져옴
        if draw_no:
            df = pd.read_sql_query("SELECT draw_no, num1, num2, num3, num4, num5, num6 FROM lotto_winners WHERE draw_no < ? ORDER BY draw_no DESC LIMIT ?", conn, params=(draw_no, limit))
        else:
            df = pd.read_sql_query("SELECT draw_no, num1, num2, num3, num4, num5, num6 FROM lotto_winners ORDER BY draw_no DESC LIMIT ?", conn, params=(limit,))
        conn.close()

        if len(df) == 0:
            return {}

        # 데이터 분석 편의를 위해 번호 컬럼 리스트
        num_cols = ['num1', 'num2', 'num3', 'num4', 'num5', 'num6']
        
        # 1. 시계열 데이터 가공
        analysis_list = []
        for _, row in df.iterrows():
            nums = row[num_cols].values
            odd_count = sum(1 for n in nums if n % 2 != 0)
            even_count = 6 - odd_count
            
            analysis_list.append({
                "draw_no": int(row['draw_no']),
                "odd_even": f"{odd_count}:{even_count}",
                "sum": int(sum(nums)),
                "range": int(max(nums) - min(nums)),
                "odd_ratio": float(odd_count / 6)
            })

        # 2. 자리별(Positional) 평균 및 분포
        positional_stats = []
        for col in num_cols:
            positional_stats.append({
                "position": col,
                "avg": float(df[col].mean()),
                "min": int(df[col].min()),
                "max": int(df[col].max()),
                "std": float(df[col].std())
            })

        # 3. 전체 요약 통계
        summary = {
            "avg_sum": float(df[num_cols].sum(axis=1).mean()),
            "avg_range": float((df[num_cols].max(axis=1) - df[num_cols].min(axis=1)).mean()),
            "common_parity": df.apply(lambda r: f"{sum(1 for n in r[num_cols] if n % 2 != 0)}:{sum(1 for n in r[num_cols] if n % 2 == 0)}", axis=1).mode()[0]
        }

        # 최신순 정렬 반환 (프론트엔드에서 최신 데이터가 오른쪽으로 오도록 뒤집을 수 있음)
        return {
            "timeseries": analysis_list[::-1], # 시간 순으로 변경
            "positional": positional_stats,
            "summary": summary
        }
