from pathlib import Path
import sqlite3


def get_db_path() -> str:
    """Return active lotto.db path with backward-compatible fallback."""
    new_path = Path(__file__).parent / "persistence" / "lotto.db"
    if new_path.exists():
        return str(new_path)

    legacy_path = Path(__file__).parent / "infrastructure" / "persistence" / "lotto.db"
    return str(legacy_path)


def get_connection() -> sqlite3.Connection:
    """Create sqlite connection configured with Row factory."""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    return conn

