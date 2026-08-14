# 미추첨 간격 (interval)

## 목적

최신 회차 기준 **최근 3년(156회)** 당첨 이력으로 1~45번의 미추첨 기간을 확인합니다.

- 본번호 6개와 보너스 번호(한 회차 안 중복은 한 번)를 사용합니다.
- 연속 출현은 하나의 묶음으로 보고, 끝난 간격과 현재 미추첨 기간 중 큰 값이 최대입니다.
- 표는 순위, 번호, 미추첨 기간, 최대만 보여 줍니다.
- 현재 미추첨 기간이 과거 최대보다 길면 최대를 그 값으로 갱신합니다.
- 순위는 최대 근접(같으면 미추첨 기간 긴 순) → 미출현 하단입니다.
- 미추첨 기간은 최신 회차 다음을 기준으로 한 현재 간격입니다.

## 주요 파일

| 경로 | 역할 |
|:---|:---|
| `page.tsx` | `Header`/`Sidebar`/`useGapData`/`IntervalMain` 조립 |
| `api/loadHistory.ts` | `@/lib/accu-nums/api`로 당첨 이력 조회 |
| `hooks/useGapData.ts` | 이력 로딩·오류·표 행 상태 관리 |
| `logic/buildGapRows.ts` | 3년 표본·`buildGapRankRows`로 표 행 계산 |
| `ui/table/` | 미추첨 간격 표 UI |
| `tests/buildGapRows.test.ts` | 보너스 포함·열 계약 단위 테스트 |
| `tests/gapSlice.test.ts` | 3년 창·순위 단위 테스트 |

## 로컬에서 확인

루트 `run.bat` 또는 `cd apps/web && npm run dev` 후 사이드바 **미추첨 간격**을 클릭하거나 `http://localhost:1060/interval`로 이동합니다.

## 환경 변수

- API는 같은 오리진 `/api/...` (Next Route Handlers). DB는 `DATABASE_URL`.

## 주의사항

- 데이터는 `src/lib/accu-nums/` 공유 클라이언트가 사용하는 `/api/analysis/accu-nums/draw-numbers`, `/api/analysis/accu-nums/winning-numbers-range`를 통해 가져옵니다.
- 간격 계산 엔진은 추천과 같은 `recommend/logic/gap/gapRank.ts`입니다.
- 이력이 156회보다 짧으면 있는 만큼만 집계합니다.
- 최근 3년 창 안에서 한 번도 안 나온 번호는 미추첨 기간·최대를 `-`로 표시하고 순위 하단입니다.
