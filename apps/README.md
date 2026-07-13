# apps

## 목적

Next.js 풀스택 앱 실행 단위입니다.

## 구성

| 패키지 | 경로 | 역할 | 포트 |
|:---|:---|:---|:---|
| **web** | `apps/web/` | Next.js UI + `/api` Route Handlers | 3010 |

## 실행

```bash
npm install
# apps/web/.env.local 에 DATABASE_URL 설정
npm run dev          # web(3010)
```

## 주의

- DB: Supabase Postgres (`DATABASE_URL`) — 스키마 정본 `apps/web/src/server/db/schema.pg.sql`
- NestJS `apps/api`는 제거됨. API는 `apps/web/src/app/api` + `src/server`
