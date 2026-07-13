# lotto

로또 관련 웹 애플리케이션입니다. Next.js(web) + NestJS(api) npm workspaces 모노레포입니다.

## 저장소

```bash
git clone git@github.com:kimjunglip0911/lotto.git
```

- 원격: `git@github.com:kimjunglip0911/lotto.git`
- 기본 브랜치: `main`

## 구성

| 패키지 | 경로 | 역할 | 포트 |
|:---|:---|:---|:---|
| **web** | `apps/web/` | Next.js UI | **3010** |
| **api** | `apps/api/` | NestJS REST API | **8010** |

## 실행

```bash
npm install
# apps/api/.env 에 DATABASE_URL 설정 (Supabase Connection URI)
npm run dev        # api(8010) 준비 후 web(3010) 기동
```

개별 기동:

```bash
npm run dev:api    # API만
npm run dev:web    # web만
```

## 환경 변수·상세

- web: `apps/web/README.md` · `apps/web/.env.example`
- api: `apps/api/README.md` · `apps/api/.env.example`
- 앱 개요: `apps/README.md`
