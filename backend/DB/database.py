from pathlib import Path
import sqlite3

_SCHEMA_READY = False


def get_db_path() -> str:
    """Return canonical lotto.db path (same directory as init_db.py output)."""
    return str(Path(__file__).resolve().parent / "lotto.db")


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

    conn.commit()
    _SCHEMA_READY = True


def get_connection() -> sqlite3.Connection:
    """Create sqlite connection configured with Row factory."""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    _ensure_schema(conn)
    return conn
