# Lotto Backend

FastAPI 기반의 로또 정보 관리 백엔드 서버입니다.

## 주요 기능
- 로또 당첨 정보 조회 및 저장
- 추첨 세트 저장

## 기술 스택
- **Framework**: FastAPI
- **Database**: SQLite3
- **Server**: Uvicorn

## 실행 방법
프로젝트 루트에서 다음 명령어를 실행합니다:
```bash
npm run dev
```
또는 백엔드 폴더에서 직접 실행할 경우:
```bash
python -m uvicorn main:app --reload
```

## 최근 변경 사항
- **행동 경제학 분석 수치 조정**: `domain/services/analysis/behavioral_service.py`에 조정 가능 상수 도입, 1210~1214 회차 5등 목표 튜닝 완료. 상세는 `domain/services/analysis/README.md` 참고.
- **임포트 구조 개선**: `main.py`의 상대 경로 임포트 에러를 해결하여 서버 구동 안정성을 확보하였습니다.
