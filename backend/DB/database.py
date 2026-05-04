from contextlib import contextmanager
import os
import threading
import time
from pathlib import Path
import sqlite3
from typing import Callable, TypeVar

_SCHEMA_READY = False
# 단일 프로세스에서 요청마다 연결을 새로 열기 때문에, 동시 요청 시 SQLite 파일 잠금이 겹친다.
# 연결 open~close 구간을 직렬화해 `database is locked`를 구조적으로 줄인다(멀티 워커 프로세스 간에는 적용 안 됨).
_SQLITE_ACCESS = threading.Lock()

T_db = TypeVar("T_db")


def get_db_path() -> str:
    """Return SQLite 파일 경로. `LOTTO_DB_PATH`가 있으면 우선(동기화 폴더 밖 권장)."""
    override = os.environ.get("LOTTO_DB_PATH", "").strip()
    if override:
        return override
    return str(Path(__file__).resolve().parent / "lotto.db")


def _is_transient_sqlite_lock(exc: sqlite3.OperationalError) -> bool:
    msg = str(exc).lower()
    return "locked" in msg or "busy" in msg


def _ensure_schema(conn: sqlite3.Connection) -> None:
    global _SCHEMA_READY
    if _SCHEMA_READY:
        return

    schema_path = Path(__file__).resolve().parent / "schema.sql"
    with schema_path.open("r", encoding="utf-8") as schema_file:
        # 요청 전에 테이블 존재를 보장해 no such table 500을 방지한다.
        conn.executescript(schema_file.read())

    columns = {
        row[1]
        for row in conn.execute("PRAGMA table_info(lotto_drawings)").fetchall()
    }
    if "strategy" not in columns:
        # 구버전 DB와 호환되도록 누락 컬럼을 런타임에서 보정한다.
        conn.execute("ALTER TABLE lotto_drawings ADD COLUMN strategy TEXT")

    # 누적번호 스냅샷: 구버전(payload_json) → 최종 4번호 컬럼만 (기존 스냅샷 행은 삭제됨)
    snap_row = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='accumulated_number_snapshots'"
    ).fetchone()
    if snap_row is not None:
        snap_cols = {r[1] for r in conn.execute("PRAGMA table_info(accumulated_number_snapshots)").fetchall()}
        if "payload_json" in snap_cols and "final_num1" not in snap_cols:
            conn.execute("DROP TABLE accumulated_number_snapshots")
            conn.execute(
                """
                CREATE TABLE accumulated_number_snapshots (
                    anchor_draw_no INTEGER PRIMARY KEY,
                    schema_version INTEGER NOT NULL,
                    final_num1 INTEGER NOT NULL,
                    final_num2 INTEGER NOT NULL,
                    final_num3 INTEGER NOT NULL,
                    final_num4 INTEGER NOT NULL,
                    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
                )
                """
            )

    conn.commit()
    _SCHEMA_READY = True


def _open_sqlite_connection() -> sqlite3.Connection:
    """스키마·PRAGMA까지 적용한 연결만 생성한다. `db_session()` 안에서만 호출한다."""
    conn = sqlite3.connect(get_db_path(), timeout=60.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 30000")
    try:
        conn.execute("PRAGMA journal_mode=WAL")
    except sqlite3.OperationalError:
        pass
    _ensure_schema(conn)
    return conn


@contextmanager
def db_session():
    """동일 프로세스 내에서 SQLite 사용을 직렬화한다(연결 open~close).

    `with db_session() as conn:` 형태로만 사용한다.
    """
    _SQLITE_ACCESS.acquire()
    conn: sqlite3.Connection | None = None
    try:
        conn = _open_sqlite_connection()
        yield conn
    finally:
        if conn is not None:
            conn.close()
        _SQLITE_ACCESS.release()


def run_in_db_session_with_retry(
    action: Callable[[sqlite3.Connection], T_db],
    *,
    attempts: int = 15,
    base_delay_sec: float = 0.2,
) -> T_db:
    """다른 프로세스·클라우드 동기화 등으로 일시적 잠금이 날 때 재시도한다."""
    attempts = max(1, attempts)
    for i in range(attempts):
        try:
            with db_session() as conn:
                return action(conn)
        except sqlite3.OperationalError as e:
            if not _is_transient_sqlite_lock(e):
                raise
            if i == attempts - 1:
                raise
            time.sleep(base_delay_sec * (1 + i))
