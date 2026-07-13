# web (Next.js 풀스택)

저장소 루트 워크스페이스 `web` 패키지입니다. UI + Route Handlers(`/api/*`) + Supabase Postgres(`pg`)를 한 앱에서 제공합니다.

## 실행

저장소 루트에서:

```bash
npm install
# apps/web/.env.local 에 DATABASE_URL 설정
npm run dev   # http://localhost:3010
```

## 환경 변수

`apps/web/.env.example` → `.env.local`

| 변수 | 설명 |
|:---|:---|
| `DATABASE_URL` | Supabase Session pooler URI (필수, 서버 전용) |

클라이언트는 같은 오리진의 `/api/...` 를 호출합니다. Vercel에는 Root Directory=`apps/web`, Env에 `DATABASE_URL`만 등록하면 됩니다.

## API vs 클라이언트 `api/` 폴더

| 경로 | 역할 |
|:---|:---|
| `src/app/api/**/route.ts` | Next Route Handlers (HTTP) |
| `src/app/<feature>/api/` | 브라우저 fetch 클라이언트 모듈 |
| `src/server/` | DB·도메인 로직 (`server-only`) |

## 타입체크

```bash
npm run typecheck -w web
npm run build -w web
```

Editor/ESLint는 `typescript@6`, `typecheck`는 `@typescript/native`(TS 7.0)을 사용합니다.
