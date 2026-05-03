from typing import Annotated, List, Optional

from pydantic import BaseModel, Field, field_validator


class MessageResponse(BaseModel):
    message: str


class GenerateSetItem(BaseModel):
    num1: int = Field(ge=1, le=45)
    num2: int = Field(ge=1, le=45)
    num3: int = Field(ge=1, le=45)
    num4: int = Field(ge=1, le=45)
    num5: int = Field(ge=1, le=45)
    num6: int = Field(ge=1, le=45)
    method: str = "JL Wheel Method"
    strategy: Optional[str] = None
    applied_rule_ids: Optional[List[str]] = None
    excluded_numbers: Optional[List[int]] = None


class GenerateSaveRequest(BaseModel):
    draw_no: int
    applied_rule_ids: Optional[List[str]] = None
    excluded_numbers: Optional[List[int]] = None
    sets: Optional[List[GenerateSetItem]] = None


class SaveWinningRequest(BaseModel):
    draw_no: int
    num1: int = Field(ge=1, le=45)
    num2: int = Field(ge=1, le=45)
    num3: int = Field(ge=1, le=45)
    num4: int = Field(ge=1, le=45)
    num5: int = Field(ge=1, le=45)
    num6: int = Field(ge=1, le=45)
    bonus_num: int = Field(ge=1, le=45)


class AccumulatedNumberSnapshotSaveRequest(BaseModel):
    """누적번호 분석에서 최종 채택된 번호 4개만 저장한다."""

    anchor_draw_no: int = Field(ge=1, description="분석 기준 회차(선택 회차)")
    schema_version: int = Field(ge=1, default=2, description="저장 형식 버전(2=최종4번호만)")
    final_numbers: Annotated[list[int], Field(min_length=4, max_length=4)]

    @field_validator("final_numbers")
    @classmethod
    def validate_lotto_numbers(cls, values: list[int]) -> list[int]:
        for n in values:
            if n < 1 or n > 45:
                raise ValueError("final_numbers must be in 1..45")
        return values


class AccumulatedNumberSnapshotGetResponse(BaseModel):
    anchor_draw_no: int
    schema_version: int
    final_numbers: list[int]
    updated_at: str
