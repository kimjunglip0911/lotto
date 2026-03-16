# __pycache__ 생성 방지 (유지보수 시 캐시 폴더 정리 부담 감소)
import sys
sys.dont_write_bytecode = True

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from domain.models.schemas import MessageResponse
from api.routers import winners_router, drawings_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(winners_router.router)
app.include_router(drawings_router.router)

@app.get("/", response_model=MessageResponse)
def read_root():
    return {"message": "Hello from FastAPI"}
