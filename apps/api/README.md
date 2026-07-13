# api (NestJS)

## 목적

로또 서비스 HTTP API. 기능별 모듈은 `src/home`, `src/recommend`, `src/analysis/<기능>` 구조입니다.

## 실행

```bash
# 저장소 루트
npm install
# apps/api/.env 에 DATABASE_URL 설정 (Supabase Database URI)
npm run dev:api    # 개발(8010, watch)
npm run dev        # web + api
```

## 환경 변수

| 변수 | 설명 |
|:---|:---|
| `PORT` | listen 포트 (기본 `8010`) |
| `DATABASE_URL` | Supabase Postgres 연결 URI (필수, Session mode 권장) |
| `SUPABASE_URL` | 프로젝트 URL (문서·참고용, API 쿼리에는 불필요) |

`.env.example` 참고. DB 비밀번호·키는 git에 커밋하지 마세요.

## DB

- 호스팅: Supabase Postgres (`SUPABASE_URL`의 프로젝트)
- 스키마 정본: `src/db/schema.pg.sql` (RLS ON, anon 정책 없음)
- 드라이버: `pg` (`PgService`)
- 재이관: `data/migrate-dump.json` 준비 후 `npm run db:migrate -w api`

## 폴더

```text
data/                   # 로컬 덤프·배치 (gitignore)
src/
├── scripts/            # db:migrate 등
├── db/
│   ├── schema.pg.sql
│   └── pg.service.ts
├── home/               # /api/drawings/*
├── recommend/          # /api/recommend/*
└── analysis/
    └── accu-nums/      # /api/analysis/accu-nums
```

## 테스트

```bash
npm run test -w api
npm run typecheck -w api   # TypeScript 7 네이티브 tsc
```

e2e는 `DATABASE_URL`이 설정된 실DB를 사용합니다.

## 주의사항

- 타입체크: `@typescript/native`(TS **7.0** Go `tsc`). ESLint·`ts-jest`·`ts-node`·Nest emit은 `typescript@6` API를 사용합니다 (TS 7.1 Compiler API 전까지).
- `emitDecoratorMetadata` / `experimentalDecorators`는 Nest DI용으로 유지합니다.
