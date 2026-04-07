from pydantic import BaseModel


class MessageResponse(BaseModel):
    message: str


class GenerateSaveRequest(BaseModel):
    draw_no: int
