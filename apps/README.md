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
npm run db:copy      # 최초: 이전 경로 → apps/api/data/lotto.db
npm run dev          # api 기동 후 8010 응답 확인 → web(3010)
```

## 주의

- `npm run dev` 시 web은 API(`8010`)가 준비될 때까지 대기합니다. API만 따로 띄울 때는 `npm run dev:api`를 사용하세요.

- 정본 프론트는 `apps/web/` (`frontend/`는 삭제 가능)
- API DB 정본: `apps/api/data/lotto.db` (`LOTTO_DB_PATH`로 오버라이드)
