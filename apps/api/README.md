# api (NestJS)

## 목적

로또 서비스 HTTP API. FastAPI `backend/`를 대체하며, 기능별 모듈은 `src/home`, `src/recommend`, `src/analysis/<기능>` 구조입니다.

## 실행

```bash
# 저장소 루트
npm install
npm run db:copy    # 최초 1회: legacy DB 복사
npm run dev:api    # 개발(8010, watch)
npm run dev        # web + api
```

## 환경 변수

| 변수 | 설명 |
|:---|:---|
| `PORT` | listen 포트 (기본 `8010`) |
| `LOTTO_DB_PATH` | SQLite 절대 경로 (미설정 시 `data/lotto.db`, api 패키지 루트 기준) |

## 폴더

```text
data/                   # SQLite 정본 lotto.db (gitignore, src 밖)
src/
├── dist/               # 빌드 산출물 (gitignore)
├── scripts/            # db:copy 등 유틸
├── db/
│   └── schema.sql
├── home/               # /api/drawings/* (controller·service·queries/)
├── recommend/          # /api/recommend/*
└── analysis/
    └── accu-nums/      # /api/analysis/accu-nums (controller·service·queries·repository·helpers; legacy: accumulated-numbers)
```

## 테스트

```bash
npm run test -w api
```
