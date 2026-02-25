This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

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
