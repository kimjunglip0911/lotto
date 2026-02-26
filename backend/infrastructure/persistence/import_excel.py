import pandas as pd
import sqlite3
import os
import re

def import_lotto_data():
    # 경로 설정
    excel_file = '로또 회차별 당첨번호_20260225190232.xlsx'
    # backend/infrastructure/persistence/lotto.db
    db_path = os.path.join(os.path.dirname(__file__), 'lotto.db')
    
    # 만약 파일이 현재 디렉토리에 없다면 루트에서 찾음
    if not os.path.exists(excel_file):
        excel_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), excel_file)

    if not os.path.exists(excel_file):
        print(f"엑셀 파일을 찾을 수 없습니다: {excel_file}")
        return

    print(f"엑셀 데이터 읽는 중: {excel_file}")
    
    try:
        # 데이터 읽기
        df = pd.read_excel(excel_file)
        
        # 컬럼 매핑
        # 엑셀 컬럼 예시: ['No', '회차', '당첨번호', 'Unnamed: 3', 'Unnamed: 4', 'Unnamed: 5', 'Unnamed: 6', 'Unnamed: 7', '보너스', '순위', '당첨게임수', '1게임당 당첨금액']
        mapping = {
            '회차': 'draw_no',
            '당첨번호': 'num1',
            'Unnamed: 3': 'num2',
            'Unnamed: 4': 'num3',
            'Unnamed: 5': 'num4',
            'Unnamed: 6': 'num5',
            'Unnamed: 7': 'num6',
            '보너스': 'bonus_num',
            '당첨게임수': 'winner_count',
            '1게임당 당첨금액': 'winner_amount'
        }
        
        # 필요한 컬럼만 추출
        df_lotto = df[list(mapping.keys())].rename(columns=mapping)
        
        # 데이터 정제 함수들
        def clean_number(val):
            if pd.isna(val): return 0
            if isinstance(val, (int, float)): return int(val)
            # 숫자 외 문자 제거 (콤마, '원', '명' 등)
            clean_val = re.sub(r'[^\d]', '', str(val))
            return int(clean_val) if clean_val else 0

        # 데이터 정제 적용
        for col in df_lotto.columns:
            df_lotto[col] = df_lotto[col].apply(clean_number)
            
        print(f"총 {len(df_lotto)}건의 유효 데이터를 정제했습니다.")

        # DB 연결
        conn = sqlite3.connect(db_path)
        
        # SQLite OR REPLACE를 사용하기 위해 DataFrame을 리스트로 변환하여 수동 삽입
        cursor = conn.cursor()
        
        insert_query = """
        INSERT OR REPLACE INTO lotto_winners 
        (draw_no, num1, num2, num3, num4, num5, num6, bonus_num, winner_count, winner_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        data_to_insert = df_lotto.values.tolist()
        cursor.executemany(insert_query, data_to_insert)
        
        conn.commit()
        conn.close()
        print("데이터베이스 임포트 성공! (REPLACE 모드)")

    except Exception as e:
        print(f"임포트 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import_lotto_data()
