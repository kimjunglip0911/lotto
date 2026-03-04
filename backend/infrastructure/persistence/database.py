import os
import sqlite3
from pathlib import Path

def get_db_path():
    """
    루트 디렉토리의 data 폴더에 있는 lotto.db 경로를 반환합니다.
    """
    # backend/infrastructure/persistence/database.py 위치를 기준으로 루트 계산
    current_dir = Path(__file__).parent.parent.parent
    data_dir = current_dir / "data"
    data_dir.mkdir(exist_ok=True)
    return str(data_dir / "lotto.db")

def get_connection():
    """
    lotto.db에 대한 연결을 반환합니다.
    Row factory가 설정되어 있어 dict처럼 열에 접근 가능합니다.
    """
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    return conn
