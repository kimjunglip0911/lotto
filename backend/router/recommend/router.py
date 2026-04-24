import uuid
import random
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from backend.database import get_connection
from backend.models import GenerateSaveRequest
from backend.sql.recommend import queries

router = APIRouter(tags=["recommend"])

METHOD_JL_SAVED = "JL Wheel Method"
NUMBER_KEYS = ("num1", "num2", "num3", "num4", "num5", "num6", "bonus_num")
WINDOW_SIZES = {
    "overall": None,
    "sixMonth": 26,
    "oneYear": 52,
    "threeYear": 156,
    "fiveYear": 260,
    "tenYear": 520,
}


def _load_jl_service():
    try:
        from features.analysis.api.jl_service import (  # type: ignore
            analyze_draw_duplicate_sets,
            generate_jl_wheel_sets,
            generate_wheel_sets,
        )
        return analyze_draw_duplicate_sets, generate_jl_wheel_sets, generate_wheel_sets
    except Exception:
        # features 모듈이 없는 환경에서도 추천 API를 계속 사용할 수 있도록 fallback 생성 로직을 제공합니다.
        def _fallback_generate_wheel_sets(
            count: int = 20,
            start_index: int = 0,
            draw_no: Optional[int] = None,
        ) -> List[dict]:
            del start_index
            del draw_no

            rows: List[dict] = []
            for _ in range(max(1, count)):
                numbers = sorted(random.sample(range(1, 46), 6))
                rows.append(
                    {
                        "num1": numbers[0],
                        "num2": numbers[1],
                        "num3": numbers[2],
                        "num4": numbers[3],
                        "num5": numbers[4],
                        "num6": numbers[5],
                    }
                )
            return rows

        def _fallback_generate_jl_wheel_sets(
            draw_no: int,
            count: int = 20,
            start_index: int = 0,
        ) -> List[dict]:
            del draw_no
            return _fallback_generate_wheel_sets(count=count, start_index=start_index)

        def _fallback_analyze_draw_duplicate_sets(draw_no: int, count: int = 20) -> dict:
            rows = _fallback_generate_wheel_sets(count=count, start_index=0, draw_no=draw_no)
            signature_counts: Dict[str, int] = {}
            for row in rows:
                signature = ",".join(str(row[f"num{i}"]) for i in range(1, 7))
                signature_counts[signature] = signature_counts.get(signature, 0) + 1

            duplicate_set_count = sum(1 for freq in signature_counts.values() if freq > 1)
            return {
                "drawNo": draw_no,
                "count": count,
                "duplicateSetCount": duplicate_set_count,
                "uniqueSetCount": len(signature_counts),
                "mode": "fallback-random",
            }

        return (
            _fallback_analyze_draw_duplicate_sets,
            _fallback_generate_jl_wheel_sets,
            _fallback_generate_wheel_sets,
        )


def build_number_counts(rows: List[dict]) -> List[int]:
    counts = [0] * 45
    for row in rows:
        for key in NUMBER_KEYS:
            value = row.get(key)
            if isinstance(value, int) and 1 <= value <= 45:
                counts[value - 1] += 1
    return counts


def _pick_number_by_count(counts: List[int], pick_max: bool) -> dict:
    if len(counts) != 45:
        raise ValueError("counts length must be 45")

    target_count = max(counts) if pick_max else min(counts)
    candidates = [index + 1 for index, count in enumerate(counts) if count == target_count]
    if not candidates:
        raise ValueError("no candidate number found")

    return {
        "number": candidates[0],
        "count": target_count,
        "is_tie": len(candidates) > 1,
        "candidates": candidates,
    }


def pick_top_number(counts: List[int]) -> dict:
    return _pick_number_by_count(counts, pick_max=True)


def pick_least_frequent_number(counts: List[int]) -> dict:
    return _pick_number_by_count(counts, pick_max=False)


def resolve_target_draw_no(draw_no: Optional[int], cursor) -> int:
    if draw_no is not None:
        return draw_no

    cursor.execute(queries.GET_MAX_WINNER_DRAW_NO)
    latest_row = cursor.fetchone()
    if latest_row is None or latest_row[0] is None:
        return 1
    return int(latest_row[0]) + 1


def fetch_winning_rows(cursor, draw_no: int, window_size: Optional[int]) -> List[dict]:
    if draw_no <= 1:
        return []

    if window_size is None:
        cursor.execute(queries.GET_WINNING_NUMBERS_BEFORE_DRAW, (draw_no,))
    else:
        cursor.execute(queries.GET_WINNING_NUMBERS_BEFORE_DRAW_LIMITED, (draw_no, window_size))
    rows = cursor.fetchall()
    return [dict(row) for row in rows]


@router.get("/api/recommend/exclusion-candidates", response_model=dict)
def get_exclusion_candidates(
    draw_no: Optional[int] = Query(None, ge=1, description="추천 대상 회차(미지정 시 최신 당첨회차+1)"),
):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        target_draw_no = resolve_target_draw_no(draw_no, cursor)

        rows_by_window: Dict[str, List[dict]] = {}
        for window_name, window_size in WINDOW_SIZES.items():
            rows_by_window[window_name] = fetch_winning_rows(cursor, target_draw_no, window_size)

        conn.close()

        overall_counts = build_number_counts(rows_by_window["overall"])
        least_frequent_overall = pick_least_frequent_number(overall_counts)

        window_top_numbers: Dict[str, dict] = {}
        for window_name in WINDOW_SIZES.keys():
            counts = build_number_counts(rows_by_window[window_name])
            window_top_numbers[window_name] = pick_top_number(counts)

        excluded_numbers_union = sorted(
            {
                info["number"]
                for info in window_top_numbers.values()
            }
        )

        return {
            "drawNo": target_draw_no,
            "leastFrequentOverall": least_frequent_overall,
            "windowTopNumbers": window_top_numbers,
            "excludedNumbersUnion": excluded_numbers_union,
            "drawCounts": {window_name: len(rows) for window_name, rows in rows_by_window.items()},
            "ruleMeta": {
                "topTiePolicy": "min-number-on-tie",
                "leastTiePolicy": "min-number-on-tie",
                "countedFields": list(NUMBER_KEYS),
            },
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/recommend/generate/wheel", response_model=List[dict])
def generate_wheel_drawings(
    count: int = Query(20, ge=1, le=20, description="1~20세트 (JL 프로파일 개수)"),
    draw_no: Optional[int] = Query(None, description="기준 회차(미지정 시 당첨 DB 최대+1)"),
    seed: Optional[int] = Query(None, description="지정 시 재현 가능한 난수 시드"),
):
    try:
        import random as _random

        _, _, generate_wheel_sets = _load_jl_service()
        if seed is not None:
            _random.seed(seed)
        return generate_wheel_sets(count=count, start_index=0, draw_no=draw_no)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _replace_excluded_in_rows(rows: List[dict], excluded_set: set) -> List[dict]:
    """제외 번호가 포함된 세트를 남은 번호 풀에서 무작위 재추출로 교체한다."""
    if not excluded_set:
        return rows
    available_pool = [n for n in range(1, 46) if n not in excluded_set]
    if len(available_pool) < 6:
        return rows
    result = []
    for row in rows:
        nums = {int(row["num1"]), int(row["num2"]), int(row["num3"]),
                int(row["num4"]), int(row["num5"]), int(row["num6"])}
        if nums & excluded_set:
            new_nums = sorted(random.sample(available_pool, 6))
            result.append({
                "num1": new_nums[0], "num2": new_nums[1], "num3": new_nums[2],
                "num4": new_nums[3], "num5": new_nums[4], "num6": new_nums[5],
            })
        else:
            result.append(row)
    return result


@router.post("/api/recommend/generate-and-save", response_model=List[dict])
def generate_and_save_drawings(request: GenerateSaveRequest):
    try:
        draw_no = int(request.draw_no)
        applied_rule_ids = request.applied_rule_ids or []
        excluded_numbers = sorted(set(request.excluded_numbers or []))

        # 프론트엔드에서 세트를 직접 전달한 경우 그대로 사용, 없으면 기존 방식으로 생성
        if request.sets:
            rows = [
                {
                    "num1": s.num1,
                    "num2": s.num2,
                    "num3": s.num3,
                    "num4": s.num4,
                    "num5": s.num5,
                    "num6": s.num6,
                    "strategy": s.strategy,
                }
                for s in request.sets
            ]
        else:
            _, generate_jl_wheel_sets, _ = _load_jl_service()
            excluded_set = set(excluded_numbers)
            rows = _replace_excluded_in_rows(
                generate_jl_wheel_sets(draw_no, count=20, start_index=0),
                excluded_set,
            )

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.DELETE_DRAWINGS_BY_NO_AND_METHOD, (draw_no, METHOD_JL_SAVED))
        out: List[dict] = []
        for row in rows:
            cursor.execute(
                queries.INSERT_DRAWING,
                (
                    f"jl_{uuid.uuid4().hex[:12]}",
                    int(row["num1"]),
                    int(row["num2"]),
                    int(row["num3"]),
                    int(row["num4"]),
                    int(row["num5"]),
                    int(row["num6"]),
                    0,
                    0,
                    METHOD_JL_SAVED,
                    draw_no,
                    row.get("strategy"),
                ),
            )
            out.append(
                {
                    "num1": row["num1"],
                    "num2": row["num2"],
                    "num3": row["num3"],
                    "num4": row["num4"],
                    "num5": row["num5"],
                    "num6": row["num6"],
                    "method": METHOD_JL_SAVED,
                    "strategy": row.get("strategy"),
                    "applied_rule_ids": applied_rule_ids,
                    "excluded_numbers": excluded_numbers,
                }
            )
        conn.commit()
        conn.close()
        return out
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/recommend/drawings", response_model=List[dict])
def get_drawings(
    draw_no: int = Query(..., ge=1, description="조회할 회차"),
):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.GET_DRAWINGS_BY_DRAW_NO_AND_METHOD, (draw_no, METHOD_JL_SAVED))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/recommend/draw-duplicate-insight")
def get_draw_duplicate_insight(
    draw_no: int = Query(..., ge=1, description="추천 대상 회차"),
    count: int = Query(20, ge=1, le=20, description="생성 세트 수"),
):
    try:
        analyze_draw_duplicate_sets, _, _ = _load_jl_service()
        return analyze_draw_duplicate_sets(draw_no=draw_no, count=count)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

