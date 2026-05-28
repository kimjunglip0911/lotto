# 홈 (`home`)

## 목적

현재 회차의 **분석 번호 세트(최대 30세트)** 를 카드로 보여 주고, 당첨번호 입력·저장·등수별 시뮬레이션 통계·10세트 단위 PNG 다운로드를 제공합니다.

## 실행 방법

- 저장소 루트에서 `npm run dev` 후 브라우저에서 홈(`/home`)으로 이동합니다.
- 프론트만 단독 실행: `cd apps/web` 후 `npm run dev` (포트 **3010**).

## 환경 변수

- `NEXT_PUBLIC_API_URL`: 백엔드 베이스 URL. 비우면 같은 출처의 `/api/...` 를 호출합니다.

## 폴더 구조 (8대표)

| 폴더 | 역할 |
|:---|:---|
| `api/` | HTTP 클라이언트 (`loadDrawNumbers`, `loadDrawings`, `loadWinByNo`, `saveWin`; 경로는 `constants/apiPath`) |
| `ui/` | 화면 컴포넌트 (`controls/`, `stats/`, `list/`, `card/`, `HomeMain`) |
| `hooks/` | `useHomeView`, `useGridData`(회차·세트·당첨 조합), `useDrawList`, `useDrawBundle`, `useWinInput`, `useSaveWinning`, `useGroupDl` |
| `logic/` | 등수 판정·시뮬레이션 통계·chunk·입력 파싱·회차 목록/세트 변환(`parseDrawArr`, `buildDrawList`, `toLotterySets`, `toSetVm`) |
| `helpers/` | API 묶음 fetch·PNG 다운로드(`helpers/png/`: `capHtmlImg`, `capCanvas`, `dlGroupPng`) |
| `types/` | 세트·당첨·통계 타입 |
| `constants/` | 그룹 크기·피드백 지연·초기값·API 경로(`apiPath`: 회차 목록·추천 세트·당첨 등) |
| `tests/` | Vitest 단위 테스트 |

루트에는 `page.tsx`, `README.md`만 둡니다.

## UI 규칙

- 분석 번호 카드는 **10세트씩 3개 영역**으로 나누어 표시합니다.
- 각 영역 헤더에 세트 범위(예: `1~10세트`)와 **10세트 다운로드** 버튼이 있습니다.
- PNG 파일명: `1~10세트.png` 형식. 버튼은 `다운로드 완료` / `다운로드 실패`로 잠시 피드백합니다.

## 주의

- API 경로는 `constants/apiPath.ts`에 모아 둡니다. 추천 세트는 `HOME_RECOMMEND_DRAWINGS_PATH`(`api/recommend/drawings.ts`), 당첨 조회는 `HOME_WINNING_BY_NO_PATH`(`api/win/winByDraw.ts`의 `loadWinByNo`), 당첨번호 저장은 `HOME_SAVE_WIN_PATH`(`api/win/saveWin.ts`)를 사용합니다.
- `helpers/fetchBundle.ts`의 `fetchDrawBundle(drawNo)`는 추천 세트/당첨번호를 병렬 조회하며, 추천 응답이 없으면 `sets: []`, 당첨번호가 없거나 조회 실패면 `winning: null`을 반환합니다.
- 회차 목록은 accu-nums `draw-numbers` 응답 기준이며, 첫 항목+1 회차가 기본 선택됩니다.
- 해당 회차에 분석 세트가 없으면 빈 상태 안내가 표시됩니다.
- PNG 저장은 `helpers/png/dlGroupPng.ts`가 담당하며, 1차 `capHtmlImg.ts`(html-to-image) 실패 시 `capCanvas.ts`(html2canvas)로 폴백합니다.
