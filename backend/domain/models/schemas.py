from pydantic import BaseModel
from typing import List, Optional

class LottoWinner(BaseModel):
    draw_no: int
    num1: int
    num2: int
    num3: int
    num4: int
    num5: int
    num6: int
    bonus_num: int = 0
    winner_count: Optional[int] = None
    winner_amount: Optional[int] = None

class LatestDrawResponse(BaseModel):
    latest_draw_no: int

class WinnerStatsUpdate(BaseModel):
    winner_count: Optional[int] = None
    winner_amount: Optional[int] = None

class MessageResponse(BaseModel):
    message: str

class LottoDrawingItem(BaseModel):
    num1: int
    num2: int
    num3: int
    num4: int
    num5: int
    num6: int
    method: Optional[str] = None

class LottoDrawingGroup(BaseModel):
    group_id: str
    drawings: List[LottoDrawingItem]

class LottoWinnerCreate(BaseModel):
    draw_no: int
    num1: int
    num2: int
    num3: int
    num4: int
    num5: int
    num6: int
    bonus_num: int

class PositionStat(BaseModel):
    position: int
    theoretical_expected: float
    actual_average: float
    deviation: float

class OrderStatisticsResponse(BaseModel):
    total_draws_analyzed: int
    statistics: List[PositionStat]
    generated_sets: List[LottoDrawingItem]
class GenerateSaveRequest(BaseModel):
    draw_no: int
