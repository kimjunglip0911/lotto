# web (Next.js 풀스택)

UI + Route Handlers(`/api/*`) + Supabase Postgres(`pg`)를 한 앱에서 제공합니다. 패키지 정본은 이 디렉터리의 `package.json` / `package-lock.json`입니다.

## 실행

```bash
# 저장소 루트 (권장)
run.bat   # npm install → 포트 1060 정리 → npm run dev

# 또는 이 디렉터리에서
npm install
# .env.local 에 DATABASE_URL 설정
npm run dev   # http://localhost:1060
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
npm run typecheck
npm run build
```

Editor/ESLint는 `typescript@6`, `typecheck`는 `@typescript/native`(TS 7.0)을 사용합니다.
