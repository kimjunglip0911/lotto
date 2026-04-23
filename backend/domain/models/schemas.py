from typing import List, Optional

from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    message: str


class GenerateSaveRequest(BaseModel):
    draw_no: int
    applied_rule_ids: Optional[List[str]] = None
    excluded_numbers: Optional[List[int]] = None


class SaveWinningRequest(BaseModel):
    draw_no: int
    num1: int = Field(ge=1, le=45)
    num2: int = Field(ge=1, le=45)
    num3: int = Field(ge=1, le=45)
    num4: int = Field(ge=1, le=45)
    num5: int = Field(ge=1, le=45)
    num6: int = Field(ge=1, le=45)
    bonus_num: int = Field(ge=1, le=45)
