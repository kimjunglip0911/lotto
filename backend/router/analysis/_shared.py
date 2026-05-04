from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from typing import Any, Callable, TypeVar

from fastapi import HTTPException

from backend.DB.database import db_session

T = TypeVar("T")


def load_queries_module(module_name: str, queries_relative_path: tuple[str, ...]) -> Any:
    queries_path = Path(__file__).resolve().parents[2].joinpath(*queries_relative_path)
    spec = spec_from_file_location(module_name, queries_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Failed to load SQL queries module from {queries_path}")

    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def fetch_all(sql: str, params: tuple[Any, ...] = ()) -> list[Any]:
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        return cursor.fetchall()


def fetch_one(sql: str, params: tuple[Any, ...] = ()) -> Any | None:
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        return cursor.fetchone()


def raise_as_http_500(error: Exception) -> None:
    if isinstance(error, HTTPException):
        raise error
    raise HTTPException(status_code=500, detail=str(error))


def run_with_http_500(action: Callable[[], T]) -> T:
    try:
        return action()
    except HTTPException:
        raise
    except Exception as error:
        raise_as_http_500(error)


def fetch_draw_numbers(sql: str, params: tuple[Any, ...] = ()) -> list[int]:
    def _fetch() -> list[int]:
        rows = fetch_all(sql, params)
        return [row[0] for row in rows]

    return run_with_http_500(_fetch)


def fetch_dict_or_404(sql: str, params: tuple[Any, ...], not_found_detail: str) -> dict[str, Any]:
    def _fetch() -> dict[str, Any]:
        row = fetch_one(sql, params)
        if row is None:
            raise HTTPException(status_code=404, detail=not_found_detail)
        return dict(row)

    return run_with_http_500(_fetch)


def fetch_dict_rows(sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    def _fetch() -> list[dict[str, Any]]:
        rows = fetch_all(sql, params)
        return [dict(row) for row in rows]

    return run_with_http_500(_fetch)
