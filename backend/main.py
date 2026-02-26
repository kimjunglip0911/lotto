from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import os
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
        for _ in range(100):
            # 가중치 기반 랜덤 추출 (중복 없이 6개)
            # 여기서는 단순화를 위해 random.sample 사용하되 추후 고도화 가능
            # 실제 가중치 적용 로직:
            selected = set()
            while len(selected) < 6:
                # 가중치를 고려한 선택 (단순화를 위해 random.choices 사용 후 set으로 중복 제거)
                n = random.choices(all_nums, weights=weights, k=1)[0]
                selected.add(n)
            
            sorted_nums = sorted(list(selected))
            bonus = random.choice([n for n in all_nums if n not in selected])
            
            cursor.execute(queries.INSERT_DRAWING, 
                ("ANALYSIS_POOL", sorted_nums[0], sorted_nums[1], sorted_nums[2], 
                 sorted_nums[3], sorted_nums[4], sorted_nums[5], bonus, 1))
            
        conn.commit()
        conn.close()
        return {"message": "통계 기반 100세트가 성공적으로 생성 및 저장되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/drawings", response_model=List[dict])
def get_drawings():
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
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
                (group.group_id, d.num1, d.num2, d.num3, d.num4, d.num5, d.num6, d.bonus_num, next_count))
            
        conn.commit()
        conn.close()
        return {"message": f"성공적으로 저장되었습니다. (추첨 횟수: {next_count})"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
