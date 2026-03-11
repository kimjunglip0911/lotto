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
        conn = get_connection()
        cursor = conn.cursor()
        
        # Checking current count
        cursor.execute("SELECT DISTINCT method FROM lotto_drawings WHERE draw_no = ?", (request.draw_no,))
        existing_methods = [row[0] for row in cursor.fetchall()]
        
        needs_os = "순서 통계량" not in existing_methods
        needs_cdm = "CDM 바이시안" not in existing_methods
        needs_lstm = "LSTM" not in existing_methods
        needs_bilstm = "Bi-LSTM" not in existing_methods
        needs_cnn = "CNN" not in existing_methods
        needs_markov = "마르코프 체인" not in existing_methods
        needs_ga = "유전 알고리즘" not in existing_methods
        
        if not needs_os and not needs_cdm and not needs_lstm and not needs_bilstm and not needs_cnn and not needs_markov and not needs_ga:
            conn.close()
            raise HTTPException(status_code=400, detail="해당 회차에 모든 추천 번호 세트가 존재합니다.")
            
        # 1. Order Statistics Logic
        base_where = "WHERE draw_no IS NOT NULL AND draw_no < ?"
        cursor.execute(f"""
            SELECT 
                AVG(num1) as avg_1, AVG(num2) as avg_2, AVG(num3) as avg_3,
                AVG(num4) as avg_4, AVG(num5) as avg_5, AVG(num6) as avg_6
            FROM lotto_winners
            {base_where}
        """, (request.draw_no,))
        row = cursor.fetchone()
        
        saved_sets = []
        group_id = f"group_ai_{uuid.uuid4().hex[:8]}"
        
        if needs_os:
            for set_idx in range(2):
                new_nums = []
                for i in range(1, 7):
                    exp_val = row[f'avg_{i}'] if row and row[f'avg_{i}'] else (i * 46 / 7)
                    
                    # 1번째 세트는 반올림, 2번째 세트는 올림/내림 교차 등 약간의 차이를 둠
                    if set_idx == 0:
                        chosen = int(round(exp_val))
                    else:
                        # 2번째 세트는 단순 +1 오프셋 적용으로 확정적인 다른 세트 생성
                        chosen = int(round(exp_val)) + 1
                        
                    if i > 1 and chosen <= new_nums[-1]:
                        chosen = new_nums[-1] + 1
                        
                    if chosen > 45:
                        chosen = 45
                    
                    new_nums.append(chosen)

                new_nums = list(set(new_nums))
                while len(new_nums) < 6:
                    pool = [n for n in range(1, 46) if n not in new_nums]
                    new_nums.append(pool[0])
                new_nums.sort()
                
                method = "순서 통계량"
                
                cursor.execute(queries.INSERT_DRAWING, (
                    group_id,
                    new_nums[0], new_nums[1], new_nums[2],
                    new_nums[3], new_nums[4], new_nums[5],
                    0, # bonus_num
                    0, # draw_count
                    method,
                    request.draw_no
                ))
                
                saved_sets.append({
                    "num1": new_nums[0], "num2": new_nums[1], "num3": new_nums[2],
                    "num4": new_nums[3], "num5": new_nums[4], "num6": new_nums[5],
                    "method": method,
                    "draw_no": request.draw_no,
                    "group_id": group_id,
                })
            
        conn.commit()
        conn.close()
        
        # 2. CDM Logic
        if needs_cdm:
            from domain.services.analysis.cdm.cdm_service import generate_cdm_sets
            cdm_sets = generate_cdm_sets(2, request.draw_no)
            saved_sets.extend(cdm_sets)

        # 3. LSTM Logic
        if needs_lstm:
            from domain.services.analysis.lstm_service import generate_lstm_sets
            lstm_sets = generate_lstm_sets(2, request.draw_no, "LSTM")
            saved_sets.extend(lstm_sets)

        # 4. Bi-LSTM Logic
        if needs_bilstm:
            from domain.services.analysis.lstm_service import generate_lstm_sets
            bilstm_sets = generate_lstm_sets(2, request.draw_no, "Bi-LSTM")
            saved_sets.extend(bilstm_sets)

        # 5. CNN Logic
        if needs_cnn:
            from domain.services.analysis.cnn_service import generate_cnn_sets
            cnn_sets = generate_cnn_sets(2, request.draw_no)
            saved_sets.extend(cnn_sets)

        # 6. Markov Chain Logic
        if needs_markov:
            from domain.services.analysis.markov_service import generate_markov_sets
            markov_sets = generate_markov_sets(2, request.draw_no)
            saved_sets.extend(markov_sets)

        # 7. Genetic Algorithm Logic
        if needs_ga:
            from domain.services.analysis.ga_service import generate_ga_sets
            ga_sets = generate_ga_sets(2, request.draw_no)
            saved_sets.extend(ga_sets)
            
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

