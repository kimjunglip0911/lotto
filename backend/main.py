import sys
import importlib.util
from pathlib import Path

# __pycache__ 생성 방지 (유지보수 시 캐시 폴더 정리 부담 감소)
sys.dont_write_bytecode = True

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.domain.models.schemas import MessageResponse
from backend.router.home.router import router as home_router
from backend.router.recommend.router import router as recommend_router


def load_router_from_file(module_name: str, file_path: Path):
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Failed to create import spec for: {file_path}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(home_router)
app.include_router(recommend_router)
app.include_router(
    load_router_from_file(
        "backend.router.analysis.accumulated_numbers.router",
        Path(__file__).resolve().parent
        / "router"
        / "analysis"
        / "accumulated-numbers"
        / "router.py",
    )
)
app.include_router(
    load_router_from_file(
        "backend.router.analysis.chi_square.router",
        Path(__file__).resolve().parent
        / "router"
        / "analysis"
        / "chi-square"
        / "router.py",
    )
)
app.include_router(
    load_router_from_file(
        "backend.router.analysis.trend.router",
        Path(__file__).resolve().parent
        / "router"
        / "analysis"
        / "trend"
        / "router.py",
    )
)
app.include_router(
    load_router_from_file(
        "backend.router.analysis.absence_streak.router",
        Path(__file__).resolve().parent
        / "router"
        / "analysis"
        / "absence-streak"
        / "router.py",
    )
)

@app.get("/", response_model=MessageResponse)
def read_root():
    return {"message": "Hello from FastAPI"}
