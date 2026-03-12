---
name: fix
description: Use when you have lint errors, formatting issues, or before committing code to ensure it passes CI.
---

# Fix Lint and Formatting

## Instructions

1. **린트 실행**: 루트에서 `npm run lint` 실행 (frontend 워크스페이스의 ESLint 실행)
2. **자동 수정**: ESLint로 고칠 수 있는 항목은 `npm run lint -- --fix` 또는 frontend에서 `npx eslint . --fix` 실행
3. 남은 경고/에러는 수동으로 수정 후 다시 `npm run lint`로 확인

## Common Mistakes

- **lint 무시** - CI에서 실패하므로 커밋 전 반드시 수정
- **워크스페이스 경로** - 루트에서 실행할 때는 `npm run lint -w frontend`와 동일하게 `npm run lint` 사용
