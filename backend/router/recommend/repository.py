from typing import Any, Callable, List, Optional

from backend.DB.database import db_session
from backend.router.recommend import queries


WINDOW_SIZES = {
    "overall": None,
    "sixMonth": 26,
    "oneYear": 52,
    "threeYear": 156,
    "fiveYear": 260,
    "tenYear": 520,
}


def run_db(handler: Callable[[Any], Any], *, commit: bool = False) -> Any:
    with db_session() as conn:
        cursor = conn.cursor()
        result = handler(cursor)
        if commit:
            conn.commit()
        return result


def resolve_target_draw_no(draw_no: Optional[int]) -> int:
    if draw_no is not None:
        return draw_no

    latest_row = run_db(lambda cursor: cursor.execute(queries.GET_MAX_WINNER_DRAW_NO).fetchone())
    if latest_row is None or latest_row[0] is None:
        return 1
    return int(latest_row[0]) + 1


def fetch_winning_rows(draw_no: int, window_size: Optional[int]) -> List[dict]:
    if draw_no <= 1:
        return []

    if window_size is None:
        rows = run_db(
            lambda cursor: cursor.execute(queries.GET_WINNING_NUMBERS_BEFORE_DRAW, (draw_no,)).fetchall()
        )
    else:
        rows = run_db(
            lambda cursor: cursor.execute(
                queries.GET_WINNING_NUMBERS_BEFORE_DRAW_LIMITED, (draw_no, window_size)
            ).fetchall()
        )
    return [dict(row) for row in rows]


def fetch_rows_by_window(draw_no: int) -> dict[str, List[dict]]:
    rows_by_window: dict[str, List[dict]] = {}
    for window_name, window_size in WINDOW_SIZES.items():
        rows_by_window[window_name] = fetch_winning_rows(draw_no=draw_no, window_size=window_size)
    return rows_by_window


def delete_drawings_by_no_and_method(draw_no: int, method: str) -> None:
    run_db(
        lambda cursor: cursor.execute(queries.DELETE_DRAWINGS_BY_NO_AND_METHOD, (draw_no, method)),
        commit=True,
    )


def insert_drawing(
    *,
    group_id: str,
    num1: int,
    num2: int,
    num3: int,
    num4: int,
    num5: int,
    num6: int,
    method: str,
    draw_no: int,
    strategy: Optional[str],
) -> None:
    run_db(
        lambda cursor: cursor.execute(
            queries.INSERT_DRAWING,
            (
                group_id,
                num1,
                num2,
                num3,
                num4,
                num5,
                num6,
                0,
                0,
                method,
                draw_no,
                strategy,
            ),
        ),
        commit=False,
    )


def replace_drawings_for_method(draw_no: int, method: str, rows: List[dict], id_factory: Callable[[], str]) -> None:
    def _handler(cursor) -> None:
        cursor.execute(queries.DELETE_DRAWINGS_BY_NO_AND_METHOD, (draw_no, method))
        for row in rows:
            cursor.execute(
                queries.INSERT_DRAWING,
                (
                    id_factory(),
                    int(row["num1"]),
                    int(row["num2"]),
                    int(row["num3"]),
                    int(row["num4"]),
                    int(row["num5"]),
                    int(row["num6"]),
                    0,
                    0,
                    method,
                    draw_no,
                    row.get("strategy"),
                ),
            )

    run_db(_handler, commit=True)


def get_drawings_by_draw_no_and_method(draw_no: int, method: str) -> List[dict]:
    rows = run_db(
        lambda cursor: cursor.execute(queries.GET_DRAWINGS_BY_DRAW_NO_AND_METHOD, (draw_no, method)).fetchall()
    )
    return [dict(row) for row in rows]
