# DB Layer

이 폴더는 로또 데이터의 영속성 관리를 위한 스키마 정의 및 데이터 관리 스크립트를 포함합니다.

## 구성 파일

- `schema.sql`: SQLite 데이터베이스 테이블 정의 파일
  - `lotto_winners`: 당첨 회차별 번호, 당첨자 수, 당첨금 정보 저장
  - `lotto_drawings`: 사용자별 추첨 번호 리스트 저장
  - `accumulated_number_snapshots`: 누적번호 분석 **최종 채택 4개 번호**만, 기준 회차(`anchor_draw_no`)당 최신 1건
- `init_db.py`: `schema.sql`을 기반으로 `lotto.db` 파일을 생성하고 스키마를 초기화하는 스크립트
- `lotto.db`: 실제 데이터가 저장된 SQLite 데이터베이스 파일

## 동시 접근

`database.db_session()` 컨텍스트가 **프로세스 내 스레드 간** SQLite 사용 구간을 직렬화하고, 연결에는 잠금 대기(`timeout`·`PRAGMA busy_timeout`)·가능 시 `WAL` 저널을 쓴다. 환경 변수 **`LOTTO_DB_PATH`**에 절대 경로를 주면 기본 `DB/lotto.db` 대신 해당 파일을 쓴다(OneDrive 밖 경로 권장). 스냅샷 저장 등은 `run_in_db_session_with_retry()`로 일시적 `database is locked`를 몇 차례 재시도한다.

## DB 초기화

`init_db.py`를 실행하여 스키마를 적용합니다. (기존 DB를 덮어쓰거나 초기화할 수 있으니 실행 전 백업을 권장합니다.)

당첨 번호 등 데이터 채우기는 앱·API·별도 도구로 진행합니다.
