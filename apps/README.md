# apps

## 목적

Next.js 풀스택 앱 실행 단위입니다.

## 구성

| 패키지 | 경로 | 역할 | 포트 |
|:---|:---|:---|:---|
| **web** | `apps/web/` | Next.js UI + `/api` Route Handlers | 1060 |

## 실행

```bash
# 저장소 루트
run.bat

# 또는
cd apps/web
npm install
# .env.local 에 DATABASE_URL 설정
npm run dev          # web(1060)
```

## 주의

- DB: Supabase Postgres (`DATABASE_URL`) — 스키마 정본 `apps/web/src/server/db/schema.pg.sql`
- NestJS `apps/api`는 제거됨. API는 `apps/web/src/app/api` + `src/server`
