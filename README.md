# lotto

로또 관련 웹 애플리케이션입니다. Next.js 단일 풀스택(npm workspaces)입니다.

## 저장소

```bash
git clone git@github.com:kimjunglip0911/lotto.git
```

- 원격: `git@github.com:kimjunglip0911/lotto.git`
- 기본 브랜치: `main`

## 구성

| 패키지 | 경로 | 역할 | 포트 |
|:---|:---|:---|:---|
| **web** | `apps/web/` | Next.js UI + API Route Handlers | **3010** |

## 실행

```bash
npm install
# apps/web/.env.local 에 DATABASE_URL 설정 (Supabase Session pooler URI)
npm run dev        # web(3010)
```

타입체크(TypeScript **7.0** 네이티브):

```bash
npm run typecheck -w web
```

## Vercel

- Root Directory: `apps/web`
- Environment: `DATABASE_URL`
