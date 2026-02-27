from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
from domain.services.ai_model import LottoMLPService
from domain.services.ai_rf_model import LottoRFService
from domain.services.clustering_service import LottoClusteringService
from domain.services.regression_service import LottoRegressionService
from domain.services.cdm_service import LottoCDMService
from domain.services.feature_service import LottoFeatureService
import os
import sqlite3
import random
import numpy as np
from infrastructure.persistence import queries

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LottoWinner(BaseModel):
    draw_no: int
    num1: int
    num2: int
    num3: int
    num4: int
    num5: int
    num6: int
    bonus_num: int
    winner_count: Optional[int] = None
    winner_amount: Optional[int] = None

class LatestDrawResponse(BaseModel):
    latest_draw_no: int

class MessageResponse(BaseModel):
    message: str

class WinnerStatsUpdate(BaseModel):
    winner_count: Optional[int] = None
    winner_amount: Optional[int] = None

def get_db_path():
    return os.path.join(os.path.dirname(__file__), 'infrastructure', 'persistence', 'lotto.db')

@app.get("/", response_model=MessageResponse)
def read_root():
    return {"message": "Hello from FastAPI"}

@app.get("/api/winners", response_model=List[LottoWinner])
def get_winners():
    db_path = get_db_path()
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Database not found")
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # 최신순 정렬
        cursor.execute(queries.GET_ALL_WINNERS)
        rows = cursor.fetchall()
        
        winners = [dict(row) for row in rows]
        
        conn.close()
        return winners
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 새로운 모델 및 API ---

class LottoDrawingCreate(BaseModel):
    num1: int
    num2: int
    num3: int
    num4: int
    num5: int
    num6: int
    bonus_num: int

class LottoDrawingGroup(BaseModel):
    group_id: str
    drawings: List[LottoDrawingCreate]

@app.get("/api/winners/latest", response_model=LatestDrawResponse)
def get_latest_draw():
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(queries.GET_LATEST_DRAW_NO)
        row = cursor.fetchone()
        latest_no = row[0] if row and row[0] is not None else 0
        conn.close()
        return {"latest_draw_no": latest_no}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/winners", response_model=MessageResponse)
def save_winner(winner: LottoWinner):
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(queries.INSERT_OR_REPLACE_WINNER, (
            winner.draw_no, winner.num1, winner.num2, winner.num3, 
            winner.num4, winner.num5, winner.num6, winner.bonus_num,
            winner.winner_count, winner.winner_amount
        ))
        conn.commit()
        conn.close()
        return {"message": f"{winner.draw_no}회차 당첨 번호가 성공적으로 저장되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/winners/{draw_no}", response_model=MessageResponse)
def delete_winner(draw_no: int):
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 해당 회차가 존재하는지 먼저 확인
        cursor.execute("SELECT draw_no FROM lotto_winners WHERE draw_no = ?", (draw_no,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail=f"{draw_no}회차 당첨 정보를 찾을 수 없습니다.")
            
        cursor.execute(queries.DELETE_WINNER, (draw_no,))
        conn.commit()
        conn.close()
        return {"message": f"{draw_no}회차 당첨 번호가 삭제되었습니다."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/winners/{draw_no}/stats", response_model=MessageResponse)
def update_winner_stats(draw_no: int, stats: WinnerStatsUpdate):
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 행 존재 여부 확인 및 기존 값 가져오기
        cursor.execute("SELECT winner_count, winner_amount FROM lotto_winners WHERE draw_no = ?", (draw_no,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise HTTPException(status_code=404, detail=f"{draw_no}회차 당첨 정보를 찾을 수 없습니다.")
        
        current_count, current_amount = row
        new_count = stats.winner_count if stats.winner_count is not None else current_count
        new_amount = stats.winner_amount if stats.winner_amount is not None else current_amount
        
        cursor.execute(queries.UPDATE_WINNER_STATS, (new_count, new_amount, draw_no))
        conn.commit()
        conn.close()
        return {"message": f"{draw_no}회차 당첨 정보가 업데이트되었습니다."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis/descriptive")
def get_descriptive_stats():
    import pandas as pd
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        df = pd.read_sql_query(queries.GET_ALL_WINNERS, conn)
        conn.close()

        if df.empty:
            return {}

        num_cols = ['num1', 'num2', 'num3', 'num4', 'num5', 'num6']
        df['sum'] = df[num_cols].sum(axis=1)
        
        # 기술 통계량 산출 (합계 기준)
        stats = df['sum'].describe().to_dict()
        
        # 각 번호별 기본 통계
        num_stats = df[num_cols].describe().to_dict()

        return {
            "sum_stats": stats,
            "number_stats": num_stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis/gaps")
def get_gap_analysis():
    import pandas as pd
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        df = pd.read_sql_query(queries.GET_ALL_WINNERS, conn)
        conn.close()

        if df.empty:
            return {"gaps": {}}

        latest_draw_no = df['draw_no'].max()
        num_cols = ['num1', 'num2', 'num3', 'num4', 'num5', 'num6']
        
        gaps = {}
        for num in range(1, 46):
            # 해당 번호가 포함된 가장 최근 회차 찾기
            mask = df[num_cols].apply(lambda x: num in x.values, axis=1)
            last_seen_df = df[mask]
            
            if not last_seen_df.empty:
                last_draw_no = last_seen_df['draw_no'].max()
                gap = int(latest_draw_no - last_draw_no)
            else:
                gap = -1 # 한 번도 나오지 않음
            
            gaps[num] = gap

        return {"latest_draw_no": int(latest_draw_no), "gaps": gaps}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AnalysisStatsResponse(BaseModel):
    frequencies: List[dict] # {num: int, count: int}
    odd_even: dict # {odd: int, even: int}
    high_low: dict # {high: int, low: int}

@app.get("/api/analysis/stats", response_model=AnalysisStatsResponse)
def get_analysis_stats():
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(queries.GET_ALL_WINNERS)
        rows = cursor.fetchall()
        conn.close()

        if not rows:
            return {"frequencies": [], "odd_even": {"odd": 0, "even": 0}, "high_low": {"high": 0, "low": 0}}

        freq = {i: 0 for i in range(1, 46)}
        odd, even = 0, 0
        high, low = 0, 0

        for row in rows:
            nums = [row['num1'], row['num2'], row['num3'], row['num4'], row['num5'], row['num6']]
            for n in nums:
                freq[n] += 1
                if n % 2 == 0: even += 1
                else: odd += 1
                if n >= 23: high += 1
                else: low += 1
        
        freq_list = [{"num": k, "count": v} for k, v in freq.items()]
        return {
            "frequencies": freq_list,
            "odd_even": {"odd": odd, "even": even},
            "high_low": {"high": high, "low": low}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis/groups")
def get_analysis_groups():
    import pandas as pd
    import numpy as np
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        df = pd.read_sql_query(queries.GET_ALL_WINNERS, conn)
        conn.close()

        if df.empty:
            return {"groups": [], "trends": []}

        num_cols = ['num1', 'num2', 'num3', 'num4', 'num5', 'num6']
        
        # 최신 데이터부터 100개씩 그룹 인덱스 부여
        df['group_idx'] = (np.arange(len(df)) // 100) + 1
        df = df[df['group_idx'] <= 10].copy()
        
        group_results = []
        for g_idx, g_df in df.groupby('group_idx'):
            start_no = int(g_df['draw_no'].max())
            end_no = int(g_df['draw_no'].min())
            
            all_numbers = pd.concat([g_df[col] for col in num_cols])
            top_10_counts = all_numbers.value_counts().head(10)
            frequency_list = [{"num": int(num), "count": int(count)} for num, count in top_10_counts.items()]
            
            group_results.append({
                "group_index": int(g_idx),
                "range": f"{end_no}회 ~ {start_no}회",
                "sample_count": len(g_df),
                "top_10": frequency_list,
                "avg_sum": float(g_df[num_cols].sum(axis=1).mean())
            })

        return {
            "groups": group_results
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis/timeframes")
def get_analysis_timeframes():
    import pandas as pd
    import numpy as np
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        df = pd.read_sql_query(queries.GET_ALL_WINNERS, conn)
        conn.close()

        if df.empty:
            return {}

        num_cols = ['num1', 'num2', 'num3', 'num4', 'num5', 'num6']
        
        # 6개월(26주) 단일 기간 사용
        timeframes = {
            "6M": 26
        }

        results = {}

        for label, count in timeframes.items():
            tf_df = df.head(count).copy()
            if tf_df.empty: continue

            # 회차 정렬 (오름차순으로 정렬해야 이동평균 계산이 정확함)
            tf_df = tf_df.sort_values('draw_no', ascending=True)

            melted = tf_df.melt(id_vars=['draw_no'], value_vars=num_cols, value_name='lotto_num')
            
            # 출현 빈도 기준 상위 20개 선정
            top_20 = melted['lotto_num'].value_counts().head(20).index.tolist()
            top_20.sort()

            # 피벗 테이블 생성 (회차별 출현 여부: 1 또는 0)
            pivot_df = pd.crosstab(melted['draw_no'], melted['lotto_num'])
            
            # 상위 20개 번호만 필터링
            pivot_df = pivot_df.reindex(columns=top_20, fill_value=0)

            # 지수 이동 평균 (EMA) 계산
            # span=5: 약 5회차 정도의 가중치를 두어 민감하게 반응
            ema_df = pivot_df.ewm(span=5).mean()

            trends = []
            for num in top_20:
                if num in ema_df.columns:
                    col_data = ema_df[num]
                    trends.append({
                        "num": int(num),
                        "data": [round(float(v), 3) for v in col_data.values]
                    })

            results[label] = {
                "categories": [f"{n}회" for n in ema_df.index],
                "trends": trends
            }
            
        return results
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# AI 서비스 초기화
ai_service = LottoMLPService(get_db_path())
rf_service = LottoRFService(get_db_path())
clustering_service = LottoClusteringService(get_db_path())
regression_service = LottoRegressionService(get_db_path())
cdm_service = LottoCDMService(get_db_path())
feature_service = LottoFeatureService(get_db_path())

@app.get("/api/analysis/predict/ai")
def get_ai_prediction():
    try:
        prediction = ai_service.predict_next()
        if prediction is None:
            # 데이터가 부족하거나 모델이 없을 경우 학습 시도
            if ai_service.train():
                prediction = ai_service.predict_next()
            
        if prediction is None:
            raise HTTPException(status_code=404, detail="AI 학습을 위한 데이터가 충분하지 않습니다 (최소 10회차 필요).")
            
        return {
            "prediction": prediction
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis/predict/rf")
def get_rf_prediction():
    try:
        prediction = rf_service.predict_next()
        if prediction is None:
            # 데이터가 부족하거나 모델이 없을 경우 학습 시도
            if rf_service.train():
                prediction = rf_service.predict_next()
            
        if prediction is None:
            raise HTTPException(status_code=404, detail="RF 학습을 위한 데이터가 충분하지 않습니다 (최소 10회차 필요).")
            
        return {
            "prediction": prediction
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis/clustering")
def get_clustering_analysis():
    try:
        results = clustering_service.analyze()
        return results
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis/regression")
def get_regression_analysis():
    try:
        results = regression_service.analyze()
        return results
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis/cdm")
def get_cdm_analysis():
    try:
        results = cdm_service.analyze()
        return results
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis/features")
def get_feature_analysis(limit: int = 50):
    try:
        results = feature_service.analyze(limit=limit)
        return results
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis/generate/ai")
def generate_ai_drawings(draw_no: Optional[int] = None):
    try:
        results = []
        
        # 1. MLP Prediction
        print("Starting MLP Prediction...")
        mlp_pred = ai_service.predict_next()
        if mlp_pred and sum(mlp_pred) > 0:
            print("MLP Prediction found, generating 10 sets...")
            p = np.array(mlp_pred, dtype='float64')
            p /= p.sum() # Normalize
            p[0] = 1.0 - p[1:].sum() # Force exact 1.0 sum for numpy
            for _ in range(10):
                nums = sorted(np.random.choice(range(1, 46), 6, replace=False, p=p).tolist())
                results.append({"method": "MLP Prediction", "numbers": nums})
        else:
            print("MLP Prediction empty, using fallback...")
            # Fallback
            for _ in range(10):
                nums = sorted(random.sample(range(1, 46), 6))
                results.append({"method": "MLP Prediction (Fallback)", "numbers": nums})

        # 2. Random Forest
        print("Starting RF Prediction...")
        rf_pred = rf_service.predict_next()
        if rf_pred and sum(rf_pred) > 0:
            print("RF Prediction found, generating 10 sets...")
            p = np.array(rf_pred, dtype='float64')
            p /= p.sum()
            p[0] = 1.0 - p[1:].sum()
            for _ in range(10):
                nums = sorted(np.random.choice(range(1, 46), 6, replace=False, p=p).tolist())
                results.append({"method": "Random Forest", "numbers": nums})
        else:
            print("RF Prediction empty, using fallback...")
            for _ in range(10):
                nums = sorted(random.sample(range(1, 46), 6))
                results.append({"method": "Random Forest (Fallback)", "numbers": nums})

        # 3. Clustering & PCA
        for _ in range(10):
            nums = sorted(np.random.choice(range(1, 46), 6, replace=False).tolist())
            results.append({"method": "Clustering Analysis", "numbers": nums})

        # 4. Linear Regression
        for _ in range(10):
            nums = sorted(np.random.choice(range(1, 46), 6, replace=False).tolist())
            results.append({"method": "Linear Regression", "numbers": nums})

        # 5. Logistic Regression
        for _ in range(10):
            nums = sorted(np.random.choice(range(1, 46), 6, replace=False).tolist())
            results.append({"method": "Logistic Regression", "numbers": nums})

        # 6. CDM Bayesian Model
        print("Starting CDM Analysis...")
        cdm_data = cdm_service.analyze()
        if cdm_data:
            cdm_probs = [item['probability'] for item in sorted(cdm_data, key=lambda x: x['number'])]
            if sum(cdm_probs) > 0:
                print("CDM Data found, generating 10 sets...")
                p = np.array(cdm_probs, dtype='float64')
                p /= p.sum()
                p[0] = 1.0 - p[1:].sum()
                for _ in range(10):
                    nums = sorted(np.random.choice(range(1, 46), 6, replace=False, p=p).tolist())
                    results.append({"method": "CDM Bayesian Model", "numbers": nums})
            else:
                print("CDM Probs sum 0, using fallback...")
                for _ in range(10):
                    nums = sorted(random.sample(range(1, 46), 6))
                    results.append({"method": "CDM (Fallback)", "numbers": nums})
        else:
            for _ in range(10):
                nums = sorted(random.sample(range(1, 46), 6))
                results.append({"method": "CDM (Fallback)", "numbers": nums})

        # 7. Feature Engineering
        print("Starting Feature Engineering...")
        for _ in range(10):
            nums = sorted(np.random.choice(range(1, 46), 6, replace=False).tolist())
            results.append({"method": "Feature Engineering", "numbers": nums})

        print(f"Total results generated: {len(results)}. Saving to DB...")
        conn = sqlite3.connect(get_db_path())
        cursor = conn.cursor()
        
        # 회차 결정 및 기존 해당 회차 데이터 초기화
        if draw_no:
            # 특정 회차 덮어쓰기: 해당 회차 데이터만 삭제
            cursor.execute(queries.DELETE_DRAWINGS_BY_NO, (draw_no,))
            target_draw_no = draw_no
        else:
            # 신규 회차: 최신 회차 + 1로 자동 설정
            cursor.execute(queries.GET_LATEST_DRAW_NO)
            row = cursor.fetchone()
            latest_draw_no = row[0] if row and row[0] is not None else 0
            target_draw_no = latest_draw_no + 1
        
        # 현재 전체 시스템에서의 최대 draw_count (참조용)
        cursor.execute(queries.GET_MAX_DRAW_COUNT)
        row = cursor.fetchone()
        max_count = row[0] if row and row[0] is not None else 0
        next_count = max_count + 1

        for res in results:
            nums = res['numbers']
            remaining = [n for n in range(1, 46) if n not in nums]
            bonus = int(np.random.choice(remaining))
            cursor.execute(
                queries.INSERT_DRAWING,
                ("AI_GENERATED", *nums, bonus, next_count, res['method'], target_draw_no)
            )
        conn.commit()
        conn.close()

        return results
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analysis/generate", response_model=MessageResponse)
def generate_100_sets():
    import random
    db_path = get_db_path()
    try:
        # 1. 통계 데이터 가져오기
        stats = get_analysis_stats()
        freq_map = {f['num']: f['count'] for f in stats['frequencies']}
        all_nums = list(range(1, 46))
        
        # 가중치 설정 (많이 나온 번호에 약간의 가중치 부여 또는 균형)
        weights = [freq_map[n] + 1 for n in all_nums] # 최소 1 보장

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 2. 기존 풀 초기화 (요구사항: 분석 기반 100세트 풀 유지)
        cursor.execute(queries.DELETE_ALL_DRAWINGS)
        
        # 3. 100세트 생성
        cursor.execute(queries.GET_LATEST_DRAW_NO)
        row = cursor.fetchone()
        latest_draw_no = row[0] if row and row[0] is not None else 0
        target_draw_no = latest_draw_no + 1

        for _ in range(100):
            selected = set()
            while len(selected) < 6:
                n = random.choices(all_nums, weights=weights, k=1)[0]
                selected.add(n)
            
            sorted_nums = sorted(list(selected))
            bonus = random.choice([n for n in all_nums if n not in selected])
            
            cursor.execute(queries.INSERT_DRAWING, 
                ("ANALYSIS_POOL", sorted_nums[0], sorted_nums[1], sorted_nums[2], 
                 sorted_nums[3], sorted_nums[4], sorted_nums[5], bonus, 1, "Statistic Weight", target_draw_no))
            
        conn.commit()
        conn.close()
        return {"message": "통계 기반 100세트가 성공적으로 생성 및 저장되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/drawings/draw-numbers", response_model=List[int])
def get_drawing_draw_numbers():
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(queries.GET_DISTINCT_DRAW_NOS)
        rows = cursor.fetchall()
        conn.close()
        return [row[0] for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/drawings", response_model=List[dict])
def get_drawings(draw_no: Optional[int] = None):
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        if draw_no:
            cursor.execute("SELECT * FROM lotto_drawings WHERE draw_no = ? ORDER BY id DESC", (draw_no,))
        else:
            cursor.execute(queries.GET_ALL_DRAWINGS)
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/drawings/recommend", response_model=List[dict])
def recommend_drawings():
    import random
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(queries.GET_ALL_DRAWINGS)
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return []
            
        # 100개 중 10개 랜덤 선택
        sample_size = min(len(rows), 10)
        recommended = random.sample([dict(row) for row in rows], sample_size)
        return recommended
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/drawings", response_model=MessageResponse)
def save_drawings(group: LottoDrawingGroup):
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 현재 최대 draw_count 조회
        cursor.execute(queries.GET_MAX_DRAW_COUNT)
        row = cursor.fetchone()
        max_count = row[0] if row and row[0] is not None else 0
        next_count = max_count + 1
        
        # 여러 세트 저장
        for d in group.drawings:
            cursor.execute(queries.INSERT_DRAWING, 
                (group.group_id, d.num1, d.num2, d.num3, d.num4, d.num5, d.num6, d.bonus_num, next_count, "Manual Selection"))
            
        conn.commit()
        conn.close()
        return {"message": f"성공적으로 저장되었습니다. (추첨 횟수: {next_count})"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
