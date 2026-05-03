import importlib.util
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException, Query

from backend.domain.models.schemas import (
    AccumulatedNumberSnapshotGetResponse,
    AccumulatedNumberSnapshotSaveRequest,
    MessageResponse,
)
from backend.router.analysis._shared import (
    fetch_dict_or_404,
    fetch_dict_rows,
    fetch_draw_numbers,
    load_queries_module,
    run_with_http_500,
)

# hyphen 폴더는 패키지 import가 불가하여 동적 로드한다.
def _load_repository():
    repo_path = Path(__file__).resolve().parent / "repository.py"
    spec = importlib.util.spec_from_file_location(
        "backend_router_analysis_accumulated_numbers_repository",
        repo_path,
    )
    if spec is None or spec.loader is None:
        raise ImportError(f"Failed to load repository from {repo_path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_repository = _load_repository()

router = APIRouter(tags=["analysis"])
QUERIES_MODULE_NAME = "backend.router.analysis.accumulated_numbers.queries"
QUERIES_RELATIVE_PATH = ("router", "analysis", "accumulated-numbers", "queries.py")
NOT_FOUND_DETAIL = "선택한 회차의 당첨번호를 찾을 수 없습니다."


def _load_queries_module():
    return load_queries_module(
        QUERIES_MODULE_NAME,
        QUERIES_RELATIVE_PATH,
    )


queries = _load_queries_module()
ALLOWED_WINDOW_SIZES = {4, 12, 26, 52, 156, 260, 520}


@router.get("/api/analysis/accumulated-numbers/draw-numbers", response_model=List[int])
def get_draw_numbers():
    return fetch_draw_numbers(queries.GET_AVAILABLE_DRAW_NOS)


@router.get("/api/analysis/accumulated-numbers/winning-numbers-range", response_model=List[dict])
def get_winning_numbers_range(draw_no: int = Query(..., ge=1, description="선택 회차")):
    if draw_no <= 1:
        return []
    return fetch_dict_rows(queries.GET_WINNING_NUMBERS_BEFORE_DRAW, (draw_no,))


@router.get("/api/analysis/accumulated-numbers/winning-number", response_model=dict)
def get_winning_number(draw_no: int = Query(..., ge=1, description="선택 회차")):
    return fetch_dict_or_404(
        queries.GET_WINNING_NUMBERS_BY_DRAW,
        (draw_no,),
        NOT_FOUND_DETAIL,
    )


@router.get("/api/analysis/accumulated-numbers/winning-numbers-window", response_model=List[dict])
def get_winning_numbers_window(
    draw_no: int = Query(..., ge=1, description="선택 회차"),
    window_size: int = Query(..., description="이전 회차 개수 (허용값: 4, 12, 26, 52, 156, 260, 520)"),
):
    if draw_no <= 1:
        return []
    if window_size not in ALLOWED_WINDOW_SIZES:
        raise HTTPException(
            status_code=400,
            detail="window_size는 4, 12, 26, 52, 156, 260, 520만 허용됩니다.",
        )

    return fetch_dict_rows(queries.GET_WINNING_NUMBERS_BEFORE_DRAW_LIMITED, (draw_no, window_size))


SNAPSHOT_NOT_FOUND_DETAIL = "해당 회차에 저장된 분석 스냅샷이 없습니다."


@router.post("/api/analysis/accumulated-numbers/snapshot", response_model=MessageResponse)
def post_accumulated_number_snapshot(body: AccumulatedNumberSnapshotSaveRequest):
    """누적번호 분석 결과를 기준 회차 키로 UPSERT 저장한다."""

    if body.anchor_draw_no <= 1:
        raise HTTPException(
            status_code=400,
            detail="회차 1은 이전 회차 집계가 없어 저장할 수 없습니다.",
        )

    def _save() -> None:
        n1, n2, n3, n4 = body.final_numbers
        _repository.save_snapshot(
            body.anchor_draw_no,
            body.schema_version,
            n1,
            n2,
            n3,
            n4,
        )

    run_with_http_500(_save)
    return MessageResponse(message="저장되었습니다.")


@router.get("/api/analysis/accumulated-numbers/snapshot", response_model=AccumulatedNumberSnapshotGetResponse)
def get_accumulated_number_snapshot(draw_no: int = Query(..., ge=1, description="기준 회차")):
    """저장된 누적번호 분석 스냅샷을 조회한다."""

    def _load() -> AccumulatedNumberSnapshotGetResponse:
        row = _repository.get_snapshot_row(draw_no)
        if row is None:
            raise HTTPException(status_code=404, detail=SNAPSHOT_NOT_FOUND_DETAIL)
        final_numbers = [
            int(row["final_num1"]),
            int(row["final_num2"]),
            int(row["final_num3"]),
            int(row["final_num4"]),
        ]
        return AccumulatedNumberSnapshotGetResponse(
            anchor_draw_no=int(row["anchor_draw_no"]),
            schema_version=int(row["schema_version"]),
            final_numbers=final_numbers,
            updated_at=str(row["updated_at"]),
        )

    return run_with_http_500(_load)
