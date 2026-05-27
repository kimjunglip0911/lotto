# 연속 출현 분석 (`run-streak`)

## 목적

선택 회차 기준으로 1~45번이 **본번호 6개**에 몇 회 연속 포함되었는지 표·요약으로 보여 줍니다.

## 실행 방법

- 저장소 루트에서 `npm run dev` 후 브라우저에서 연속 출현 분석 메뉴(`/analysis/run-streak`)로 이동합니다.
- 프론트만 단독 실행: `cd apps/web` 후 `npm run dev` (포트 **3010**).

## 환경 변수

- `NEXT_PUBLIC_API_URL`: 백엔드 베이스 URL. 비우면 같은 출처의 `/api/analysis/run-streak/...` 를 호출합니다.

## 폴더 구조 (8대표)

| 폴더 | 역할 |
|:---|:---|
| `api/` | HTTP 클라이언트 (`draw-numbers`, `winning-number`, `winning-numbers-range`) |
| `ui/` | 화면 컴포넌트 (`search/`, `summary/`, `table/`) |
| `hooks/` | `useStData`, `useStView`, 회차·조회 훅 |
| `logic/` | 연속 출현 계산(`streak/`), 공개 `consec.ts`, 안내 문구 |
| `helpers/` | (예비) |
| `types/` | `WinningNumberRow`, `StreakResult`, UI props |
| `constants/` | 본번호 범위(1~45) |
| `tests/` | Vitest 단위 테스트 |

루트에는 `page.tsx`, `README.md`만 둡니다.

## 주의

- 당첨 이력이 DB에 없으면 회차 목록이 비어 안내만 표시됩니다.
- `logic/consec.ts`의 `getConsecutivelyAppearedMainNumbers`는 추천·최종픽에서 제외 후보 계산에 재사용됩니다.
- 오프라인 최종 사용자 환경을 고려해, 새 패키지 없이 기존 의존성만 사용합니다.
