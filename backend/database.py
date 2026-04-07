from pathlib import Path
import sqlite3


def get_db_path() -> str:
    """Return canonical lotto.db path (same directory as init_db.py output)."""
    return str(
        Path(__file__).resolve().parent / "infrastructure" / "persistence" / "lotto.db"
    )


def get_connection() -> sqlite3.Connection:
    """Create sqlite connection configured with Row factory."""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    return conn

