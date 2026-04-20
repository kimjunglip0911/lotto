# __pycache__ 생성 방지 (유지보수 시 캐시 폴더 정리 부담 감소)
import sys
sys.dont_write_bytecode = True

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.models import MessageResponse
from backend.router.analysis.router import router as analysis_router
from backend.router.home.router import router as home_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(home_router)
app.include_router(analysis_router)

@app.get("/", response_model=MessageResponse)
def read_root():
    return {"message": "Hello from FastAPI"}
