# 누적 번호 분석 (accu-nums)

## 목적

선택한 회차 **직전까지** 저장된 당첨번호로 번호별 누적 출현 횟수를 보여 주고, 통합 분석(`final-pick`)과 **동일한 규칙**의 누적 출현 극값 제외(직전 104회·전체 각 최다 1·최소 1, 고유 `excludedUnique`)를 `AccumulatedExclusionCard`로 표시합니다.

## 주요 파일

| 경로 | 역할 |
|:---|:---|
| `page.tsx` | 레이아웃·`Header`/`Sidebar`·`useAccData`/`useAccView`·`AccuMain` 조립 |
| `components/AccuMain.tsx` | 검색·전체 누적 차트·통합과 동일한 극값 제외 카드 조립 |
| `components/chart/` | 누적 막대 차트(`AccumulatedChartSection`)·표시용 통계 `toChartStats` |
| `components/search/` | 회차 검색 패널(`SearchPanel`)·상태 안내(`AccSearchBlock`)·당첨 미리보기 |
| `hooks/useAccData.ts` | 회차 목록·조회 훅을 한 객체로 묶는 조립 훅 |
| `hooks/useAccDrawList.ts` | 조회 가능 회차 목록 로딩·선택 회차 문자열 |
| `hooks/useAccSrch.ts` | 조회 세션·누적 집계 상태(`useReducer`) |
| `hooks/useAccView.ts` | 안내 문구·당첨 번호·적중용 `Set` 파생값 |
| `logic/parseSelDraw.ts` | 선택 회차 문자열을 숫자로 바꿀 때의 검증 |
| `logic/runAccSearch.ts` | 당첨 범위·해당 회차 당첨 API 병렬 호출·1회차 분기·집계·극값 제외 |
| `logic/accuCntExt.ts` | 극값 제외 계산(통합 분석 `accumulatedAdoption`과 동일 함수 사용) |
| `logic/runStratSel.ts` / `logic/stratEval.ts` / `logic/stratCore/` | 카이제곱·추천 화면과 공유하는 전략 평가(이 페이지 조회 경로에서는 호출하지 않음) |
| `logic/accSrchStDef.ts` / `accSrchRed.ts` / `accSrchRedApply.ts` | 조회 전용 상태 초기값·리듀서 |
| `logic/accStatusMsg.ts` | 상단 안내 문구 분기 |
| `logic/accViewIn.ts` | `useAccView` 입력 타입 |
| `api/` | 백엔드 API 호출(URL 빌더·레거시 폴백·응답 파서·엔드포인트). 외부 진입점은 `api/index.ts` |
| `types.ts` | 누적 번호 분석 타입 공개 진입점 |
| `types/` | API 행·윈도우·전략·집계 타입 |
| `test/` | 극값 제외·전략 선정 단위 테스트 |

## 로컬에서 확인

루트에서 `npm run dev` 후 브라우저에서 `http://localhost:3010/analysis/accu-nums` 로 이동합니다. 백엔드 API가 떠 있어야 조회가 됩니다.

## 주의

- 이전에 제공하던 **분석 결과 스냅샷 저장**(최종 4개 번호) UI·API 호출은 제거되었습니다. 백엔드 스냅샷 라우트는 그대로 둘 수 있습니다.
