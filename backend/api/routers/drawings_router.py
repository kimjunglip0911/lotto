import random
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries
from domain.models.schemas import LottoDrawingGroup, MessageResponse
from domain.services.generator_service import generate_random_sets

router = APIRouter(tags=["drawings_and_analysis"])

@router.get("/api/drawings", response_model=List[dict])
def get_drawings():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.GET_ALL_DRAWINGS)
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/drawings/draw-numbers", response_model=List[int])
def get_draw_numbers():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.GET_DISTINCT_DRAW_NOS)
        rows = cursor.fetchall()
        conn.close()
        return [row[0] for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/drawings/recommend", response_model=List[dict])
def recommend_drawings(draw_no: Optional[int] = Query(None)):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        if draw_no:
            target_draw_no = draw_no
        else:
            cursor.execute("SELECT MAX(draw_no) FROM lotto_drawings")
            latest_row = cursor.fetchone()
            target_draw_no = latest_row[0] if latest_row and latest_row[0] is not None else None
        
        if target_draw_no is None:
            conn.close()
            return []
            
        cursor.execute("SELECT * FROM lotto_drawings WHERE draw_no = ?", (target_draw_no,))
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return []
        
        by_method = {}
        for row in rows:
            row_dict = dict(row)
            m = row_dict['method']
            base_m = m.replace(" (Fallback)", "") if m else "기본"
            if base_m not in by_method:
                by_method[base_m] = []
            by_method[base_m].append(row_dict)
        
        for m in by_method:
            random.shuffle(by_method[m])
            
        recommended = []
        methods = list(by_method.keys())
        
        for m in methods:
            if by_method[m]:
                recommended.append(by_method[m].pop())
        
        remaining_pool = []
        for m in by_method:
            remaining_pool.extend(by_method[m])
            
        if remaining_pool and len(recommended) < 10:
            sample_size = min(len(remaining_pool), 10 - len(recommended))
            recommended.extend(random.sample(remaining_pool, sample_size))
            
        return recommended
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/drawings", response_model=MessageResponse)
def save_drawings(group: LottoDrawingGroup):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT MAX(draw_no) FROM lotto_winners")
        row = cursor.fetchone()
        latest_winner_no = row[0] if row and row[0] is not None else 0
        target_draw_no = latest_winner_no + 1
        
        for d in group.drawings:
            cursor.execute("""
                SELECT id FROM lotto_drawings 
                WHERE num1=? AND num2=? AND num3=? AND num4=? AND num5=? AND num6=? AND draw_no=?
                LIMIT 1
            """, (d.num1, d.num2, d.num3, d.num4, d.num5, d.num6, target_draw_no))
            row = cursor.fetchone()
            
            if row:
                drawing_id = dict(row)["id"]
                cursor.execute(queries.UPDATE_DRAW_COUNT, (drawing_id,))
            else:
                cursor.execute(queries.INSERT_DRAWING, 
                    ("AI_GENERATED", d.num1, d.num2, d.num3, d.num4, d.num5, d.num6, 0, 1, d.method or "Manual Selection", target_draw_no))
            
        cursor.execute(queries.DELETE_GROUP_DRAWINGS)
            
        conn.commit()
        conn.close()
        return {"message": "번호 확정 및 저장이 완료되었습니다. (임시 데이터 정리 완료)"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/drawings/by-no", response_model=List[dict])
def get_drawings_by_no(draw_no: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.GET_DRAWINGS_BY_NO, (draw_no,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/analysis/generate/ai", response_model=List[dict])
def generate_ai_drawings():
    try:
        # 단일 랜덤 생성 서비스 호출 (20세트) 
        results = generate_random_sets(count=20)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
