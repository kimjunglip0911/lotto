import random
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional

from infrastructure.persistence.database import get_connection
from infrastructure.persistence import queries
from domain.models.schemas import LottoDrawingGroup, MessageResponse, GenerateSaveRequest
from domain.services.generator_service import generate_random_sets
import uuid

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

@router.delete("/api/drawings/all")
def delete_all_drawings():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.DELETE_ALL_DRAWINGS)
        conn.commit()
        conn.close()
        return {"message": "All drawings deleted successfully"}
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

@router.post("/api/analysis/generate-and-save", response_model=List[dict])
def generate_and_save_drawings(request: GenerateSaveRequest):
    try:
        from domain.services.analysis.unified_generator_service import generate_optimal_20_sets
        saved_sets = generate_optimal_20_sets(request.draw_no)
        return saved_sets

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from domain.models.schemas import OrderStatisticsResponse, PositionStat, LottoDrawingItem



@router.get("/api/analysis/order-statistics", response_model=OrderStatisticsResponse)
def get_order_statistics(
    limit: int = Query(0, description="0이면 전체, 양수면 최근 N회차 대상"),
    draw_no: Optional[int] = Query(None, description="특정 회차 지정 (해당 회차 미만 데이터 분석)")
):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        base_where = "WHERE draw_no IS NOT NULL"
        params = []
        if draw_no is not None:
            base_where += " AND draw_no < ?"
            params.append(draw_no)
            
        if limit > 0:
            query = f"""
                SELECT 
                    COUNT(draw_no) as total_draws,
                    AVG(num1) as avg_1, AVG(num2) as avg_2, AVG(num3) as avg_3,
                    AVG(num4) as avg_4, AVG(num5) as avg_5, AVG(num6) as avg_6
                FROM (
                    SELECT * FROM lotto_winners
                    {base_where}
                    ORDER BY draw_no DESC
                    LIMIT ?
                )
            """
            params.append(limit)
        else:
            query = f"""
                SELECT 
                    COUNT(draw_no) as total_draws,
                    AVG(num1) as avg_1, AVG(num2) as avg_2, AVG(num3) as avg_3,
                    AVG(num4) as avg_4, AVG(num5) as avg_5, AVG(num6) as avg_6
                FROM lotto_winners
                {base_where}
            """
            
        cursor.execute(query, tuple(params))
        row = cursor.fetchone()
        conn.close()

        if not row or row['total_draws'] == 0:
            # 데이터가 없을 경우 204 또는 기본값 세팅. 
            # 프론트가 받아서 처리할 수 있게 기본값 0으로 응답
            return OrderStatisticsResponse(
                total_draws_analyzed=0,
                statistics=[PositionStat(position=i, theoretical_expected=round(i * 46 / 7, 2), actual_average=0.0, deviation=0.0) for i in range(1, 7)],
                generated_sets=[]
            )

        total_draws = row['total_draws']
        statistics = []
        for i in range(1, 7):
            expected = round(i * 46 / 7, 2)
            actual = round(row[f'avg_{i}'] or 0.0, 2)
            deviation = round(actual - expected, 2)
            statistics.append(PositionStat(
                position=i,
                theoretical_expected=expected,
                actual_average=actual,
                deviation=deviation
            ))

        # 순서 통계량을 응용한 2세트 추천 번호 생성 로직 (단순 기댓값 기반 샘플링)
        generated_sets = []
        for _ in range(2):
            new_nums = []
            for i in range(1, 7):
                exp_val = i * 46 / 7
                # 기댓값 근처에서 약간의 랜덤 오차(±3)를 두고 뽑되 오름차순과 1~45 범위 보장
                min_val = max(1, int(exp_val) - 3)
                max_val = min(45, int(exp_val) + 3)
                
                # 이전 공보다 커야 함
                if i > 1 and new_nums[-1] >= min_val:
                    min_val = new_nums[-1] + 1
                
                # 중첩/오버플로우 방지 보호
                if min_val > 45: min_val = 45
                if max_val < min_val: max_val = min_val
                
                chosen = random.randint(min_val, max_val)
                new_nums.append(chosen)

            # 万が一 동일 번호가 생겼을 경우를 대비해 pool에서 fallback 보정
            new_nums = list(set(new_nums))
            while len(new_nums) < 6:
                pool = [n for n in range(1, 46) if n not in new_nums]
                new_nums.append(random.choice(pool))
            new_nums.sort()

            generated_sets.append(LottoDrawingItem(
                num1=new_nums[0], num2=new_nums[1], num3=new_nums[2],
                num4=new_nums[3], num5=new_nums[4], num6=new_nums[5],
                method="Order Statistics"
            ))

        return OrderStatisticsResponse(
            total_draws_analyzed=total_draws,
            statistics=statistics,
            generated_sets=generated_sets
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

