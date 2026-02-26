# Persistence Layer (영속성 계층)

이 폴더는 로또 데이터의 영속성 관리를 위한 스키마 정의 및 데이터 관리 스크립트를 포함합니다.

## 구성 파일

- `schema.sql`: SQLite 데이터베이스 테이블 정의 파이
  - `lotto_winners`: 당첨 회차별 번호, 당첨자 수, 당첨금 정보 저장
  - `lotto_drawings`: 사용자별 추첨 번호 리스트 저장
- `init_db.py`: `schema.sql`을 기반으로 `lotto.db` 파일을 생성하고 스키마를 초기화하는 스크립트
- `import_excel.py`: Pandas를 사용하여 엑셀 파일에서 당첨 데이터를 추출해 DB에 임포트하는 스크립트
  - 중복 회차 입력 시 `INSERT OR REPLACE`를 통해 최신 데이터로 업데이트합니다.
  - 당첨자 수명(`winner_count`) 및 당첨금(`winner_amount`) 정제 로직이 포함되어 있습니다.
- `lotto.db`: 실제 데이터가 저장된 SQLite 데이터베이스 파일

## 데이터 임포트 방법

1. `init_db.py`를 실행하여 데이터베이스를 초기화합니다. (기존 데이터가 삭제될 수 있으니 주의)
2. 루트 디렉토리에 엑셀 파일을 위치시킨 후 `import_excel.py`를 실행합니다.
