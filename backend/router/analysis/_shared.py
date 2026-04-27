from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from backend.database import get_connection


def load_queries_module(module_name: str, queries_relative_path: tuple[str, ...]) -> Any:
    queries_path = Path(__file__).resolve().parents[2].joinpath(*queries_relative_path)
    spec = spec_from_file_location(module_name, queries_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Failed to load SQL queries module from {queries_path}")

    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def fetch_all(sql: str, params: tuple[Any, ...] = ()) -> list[Any]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        return cursor.fetchall()
    finally:
        conn.close()


def fetch_one(sql: str, params: tuple[Any, ...] = ()) -> Any | None:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        return cursor.fetchone()
    finally:
        conn.close()


def raise_as_http_500(error: Exception) -> None:
    if isinstance(error, HTTPException):
        raise error
    raise HTTPException(status_code=500, detail=str(error))
