import sqlite3
import os

def init_db():
    # 데이터베이스 파일 경로
    db_path = os.path.join(os.path.dirname(__file__), 'lotto.db')
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')

    print(f"데이터베이스 초기화 중: {db_path}")

    try:
        # SQLite 연결
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # 스키마 파일 읽기 및 실행
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_script = f.read()
            cursor.executescript(schema_script)

        conn.commit()
        conn.close()
        print("데이터베이스 초기화 완료: 테이블 생성 성공")

    except Exception as e:
        print(f"데이터베이스 초기화 실패: {e}")

if __name__ == "__main__":
    init_db()
