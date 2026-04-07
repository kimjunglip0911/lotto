# __pycache__ 생성 방지 (유지보수 시 캐시 폴더 정리 부담 감소)
import sys
sys.dont_write_bytecode = True

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.models import MessageResponse
from backend.router_loader import load_feature_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(load_feature_router("home"))
app.include_router(load_feature_router("analysis"))

@app.get("/", response_model=MessageResponse)
def read_root():
    return {"message": "Hello from FastAPI"}
