# 누적 번호 분석 (accu-nums)

## 목적

선택한 회차 **직전까지** 저장된 당첨번호로 번호별 누적 출현 횟수를 보여 주고, 직전 104회(2년)·전체 구간 차트, 누적 출현 극값 제외, **2년·전체 상·하 출현 전략**과 그에 따른 최종 4개를 함께 확인합니다.

## 주요 파일

| 경로 | 역할 |
|:---|:---|
| `page.tsx` | 레이아웃·`Header`/`Sidebar`·`useAccData`/`useAccView`·`AccuMain` 조립 |
| `components/AccuMain.tsx` | 본문 `<main>` 안 섹션 순서 조립(하위 폴더 컴포넌트만 import) |
| `components/chart/` | 누적 막대 차트(`AccumulatedChartSection`)·표시용 통계 `toChartStats` |
| `components/search/` | 회차 검색 패널(`SearchPanel`)·상태 안내(`AccSearchBlock`)·당첨 스트립 |
| `components/strategy/` | 전략 안내·2년 상·하 차트·극값 제외·전략 채택 블록 |
| `components/chip/AccNumHit.tsx` | 번호 칩(제외·전략·적중 표시) |
| `hooks/useAccData.ts` | 회차 목록·조회·스냅샷 훅을 한 객체로 묶는 조립 훅 |
| `hooks/useAccDrawList.ts` | 조회 가능 회차 목록 로딩·선택 회차 문자열 |
| `hooks/useAccSrch.ts` | 조회 세션·누적 집계·전략 상태(`useReducer`) |
| `hooks/useAccSnap.ts` | 스냅샷 저장 호출·로딩·성공·오류 메시지 |
| `hooks/useAccView.ts` | 안내 문구·차트용 파생값·스냅샷 저장 가능 여부 |
| `logic/parseSelDraw.ts` | 선택 회차 문자열을 숫자로 바꿀 때의 검증 |
| `logic/runAccSearch.ts` | 조회 API 병렬 호출·1회차 분기·집계·전략 실행 |
| `logic/runStratSel.ts` | 상·하(`top4`/`bottom4`) 전략 차트·최종 4개·`strategyPicks` 조립 |
| `logic/stratEval.ts` | 전략·윈도 평가 모듈 공개 진입점(추천 화면과 공유) |
| `logic/stratCore/` | rolling 평가(`evalRun`·`evalBucket`·`evalAcc`), 번호·랭킹·전략 추천(`stratRec*`·`numPick` 등) |
| `logic/accSrchStDef.ts` / `accSrchRed.ts` / `accSrchRedApply.ts` | 조회 전용 상태 초기값·리듀서 |
| `logic/accStatusMsg.ts` | 상단 안내 문구 분기 |
| `logic/mapWinCharts.ts` | 윈도 집계 맵 → 차트 행 배열 |
| `logic/accViewIn.ts` | `useAccView` 입력 타입 |
| `logic/canSnap.ts` | 스냅샷 버튼 활성 조건 |
| `api/` | 백엔드 API 호출(URL 빌더·레거시 폴백·응답 파서·엔드포인트 5종) 분할. 외부 진입점은 `api/index.ts` |
| `types.ts` | 누적 번호 분석 타입 공개 진입점 |
| `types/` | API 행·윈도우·전략·집계·스냅샷 스키마 타입 |
| `test/` | 극값 제외·전략 선정 단위 테스트 |

## 로컬에서 확인

루트에서 `npm run dev` 후 브라우저에서 `http://localhost:3010/analysis/accu-nums` 로 이동합니다. 백엔드 API가 떠 있어야 조회가 됩니다.

## 주의

- 스냅샷 저장은 조회가 끝나고 오류가 없으며, **최종 채택 4개**가 계산된 경우에만 버튼이 활성화됩니다.
