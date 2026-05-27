# apps (모노레포 애플리케이션)

## 목적

웹(Next.js)과 API(NestJS) 실행 단위를 모읍니다.

## 구성

| 패키지 | 경로 | 역할 | 포트 |
|:---|:---|:---|:---|
| **web** | `apps/web/` | Next.js UI | 3010 |
| **api** | `apps/api/` | NestJS REST API | 8010 |

## 실행

```bash
npm install
npm run db:copy      # 최초: 이전 경로 → apps/api/src/db/data/lotto.db
npm run dev          # web + api
```

## 주의

- 정본 프론트는 `apps/web/` (`frontend/`는 삭제 가능)
- API DB 정본: `apps/api/src/db/data/lotto.db`
