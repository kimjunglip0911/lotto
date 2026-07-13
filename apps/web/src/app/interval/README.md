# 번호별 간격 (interval)

## 목적

DB에 저장된 전체 당첨 이력을 기준으로 1~45번 주번호가 다시 나올 때까지의 간격을 확인합니다.

- 주번호 6개(`num1`~`num6`)만 사용합니다.
- 보너스 번호는 집계에서 제외합니다.
- 연속 출현은 하나의 묶음으로 보고, 묶음의 마지막 회차부터 다음 출현까지의 간격만 계산합니다.
- 번호별 평균·최대 간격을 표로 보여 줍니다.
- 평균은 소수점 첫째 자리에서 반올림해 정수로 표시합니다.

## 주요 파일

| 경로 | 역할 |
|:---|:---|
| `page.tsx` | `Header`/`Sidebar`/`useGapData`/`IntervalMain` 조립 |
| `api/loadHistory.ts` | `@/lib/accu-nums/api`로 전체 당첨 이력 조회 |
| `hooks/useGapData.ts` | 이력 로딩·오류·번호별 간격 계산 상태 관리 |
| `logic/buildGapRows.ts` | 주번호별 출현 회차와 간격 통계 계산 |
| `ui/table/` | 번호별 간격 표 UI |
| `tests/buildGapRows.test.ts` | 연속 출현 묶음과 통계 계산 단위 테스트 |

## 로컬에서 확인

루트 `run.bat` 또는 `cd apps/web && npm run dev` 후 사이드바 **번호별 간격**을 클릭하거나 `http://localhost:1060/interval`로 이동합니다.

## 환경 변수

- API는 같은 오리진 `/api/...` (Next Route Handlers). DB는 `DATABASE_URL`.

## 주의사항

- 데이터는 `src/lib/accu-nums/` 공유 클라이언트가 사용하는 `/api/analysis/accu-nums/draw-numbers`, `/api/analysis/accu-nums/winning-numbers-range`를 통해 가져옵니다.
- 간격은 회차 차이입니다. 예를 들어 10회, 11회, 12회, 20회에 나온 번호는 12회부터 20회까지의 간격 `8`만 통계에 반영합니다.
- 다음 출현이 없어 간격을 만들 수 없는 번호는 평균·최대 값을 `-`로 표시합니다.
