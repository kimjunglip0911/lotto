from typing import List

from fastapi import APIRouter, HTTPException

from backend.database import get_connection
from backend.models import (
    LatestDrawResponse,
    LottoWinner,
    MessageResponse,
    WinnerStatsUpdate,
)
from features.winners.api import queries

router = APIRouter(prefix="/api/winners", tags=["winners"])


@router.get("", response_model=List[LottoWinner])
def get_winners():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.GET_ALL_WINNERS)
        rows = cursor.fetchall()
        winners = [dict(row) for row in rows]
        conn.close()
        return winners
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/latest", response_model=LatestDrawResponse)
def get_latest_draw():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(queries.GET_LATEST_DRAW_NO)
        row = cursor.fetchone()
        latest_no = row[0] if row and row[0] is not None else 0
        conn.close()
        return {"latest_draw_no": latest_no}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{draw_no}", response_model=LottoWinner)
def get_winner_by_no(draw_no: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM lotto_winners WHERE draw_no = ?", (draw_no,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail=f"{draw_no}회차 당첨 정보를 찾을 수 없습니다.")

        return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=MessageResponse)
def save_winner(winner: LottoWinner):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            queries.INSERT_OR_REPLACE_WINNER,
            (
                winner.draw_no,
                winner.num1,
                winner.num2,
                winner.num3,
                winner.num4,
                winner.num5,
                winner.num6,
                winner.bonus_num,
                winner.winner_count,
                winner.winner_amount,
            ),
        )
        conn.commit()
        conn.close()
        return {"message": f"{winner.draw_no}회차 당첨 번호가 성공적으로 저장되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{draw_no}", response_model=MessageResponse)
def delete_winner(draw_no: int):
    try:
        conn = get_connection()
        cursor = conn.cursor()
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


@router.patch("/{draw_no}/stats", response_model=MessageResponse)
def update_winner_stats(draw_no: int, stats: WinnerStatsUpdate):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT winner_count, winner_amount FROM lotto_winners WHERE draw_no = ?",
            (draw_no,),
        )
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise HTTPException(status_code=404, detail=f"{draw_no}회차 당첨 정보를 찾을 수 없습니다.")

        current_count, current_amount = dict(row)["winner_count"], dict(row)["winner_amount"]
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

