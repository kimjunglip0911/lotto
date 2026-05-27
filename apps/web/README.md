# web (Next.js)

저장소 루트 워크스페이스 `web` 패키지입니다. 구 `frontend/` 가 `apps/web/` 으로 이전되었습니다.

## 실행

저장소 루트에서:

```bash
npm run dev -w web
# 또는
npm run dev
```

## API 프록시

브라우저의 `/api/*` 요청은 `src/app/api/[...path]/route.ts`에서 Nest(`8010`)로 **fetch** 프록시합니다.  
(구 `next.config` `rewrites` + 내장 `http-proxy`는 `util._extend` DeprecationWarning을 유발해 제거함.)

API가 꺼져 있으면 프록시는 **503**과 안내 JSON을 반환합니다 (`ECONNREFUSED` 시).

| 변수 | 설명 |
|:---|:---|
| `API_PROXY_ORIGIN` | 서버 프록시 대상 (기본 `http://localhost:8010`) |
| `NEXT_PUBLIC_API_URL` | 클라이언트가 직접 API를 부를 때 베이스 URL (비우면 동일 출처 `/api`) |

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started (레거시 안내)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3010](http://localhost:3010) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Windows·OneDrive에서 `EPERM` … `unlink` `.next` 오류

Next가 캐시를 갱신할 때 `.next` 아래 항목을 지우지 못하면 `EPERM: operation not permitted, unlink …\\.next\\…` 가 날 수 있습니다. 보통 **다른 터미널의 `npm run dev`**, **백그라운드 Node**, **OneDrive 동기화**가 폴더를 잡고 있을 때입니다.

1. 실행 중인 `next dev`(루트의 `npm run dev` 포함)를 **모두 종료**한다.
2. 저장소 루트에서 `npm run dev:clean -w frontend`로 **`.next` 삭제 후** 개발 서버를 다시 띄운다. (또는 `frontend` 폴더에서 `npm run dev:clean`.)
3. 반복되면 해당 프로젝트를 OneDrive 밖 경로로 두거나, 동기화·백신 실시간 검사에서 워크스페이스를 제외하는 것을 검토한다.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---
## 최근 변경 사항

- **Lotto Elite 프리미엄 다크 테마 적용**: 글로벌 CSS 배경 및 테마 변수(`--color-background`, `--color-primary` 등) 전면 수정 및 홈 화면 UI 재구성 (`page.tsx`) 완료.
- **VS Code CSS 경고 해결**: Tailwind CSS v4를 위해 사용된 최신 구문(`@theme`, `@custom-variant`, `@apply`)으로 인해 IDE가 내뿜던 "Unknown at rule" 경고를 없애고자, `.vscode/settings.json` 설정에 `"css.lint.unknownAtRules": "ignore"` 룰을 추가하였습니다.
- **UI 요소 제거 및 정리**: `Next Power Draw` 카드 내부의 `SECURE ALGORITHM` 뱃지, 제목, 타이머 텍스트, `Estimated Jackpot` 정보를 제거하여 사용자가 번호 생성에 더 집중할 수 있도록 단순화하였습니다.
