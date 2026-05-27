# 통합 분석 (final-pick)

## 목적

선택한 회차 **직전까지**의 당첨 이력으로 연속 미출현·누적 출현 극값·카이제곱 워크포워드 제외를 한 화면에 모아 **통합 채택 번호**와 종합 차트(1~45)를 보여 줍니다. 번호 추천(`recommend`)은 여기와 동일한 채택 로직을 재사용합니다.

## 주요 파일

| 경로 | 역할 |
|:---|:---|
| `page.tsx` | 레이아웃·`Header`/`Sidebar`·`useFinalPickData`·`FinalPickMain` |
| `ui/FinalPickMain.tsx` | 검색·채택 카드·종합 차트·출처별 카드 조립 |
| `ui/search/` | 회차 검색 패널·본번호 미리보기 |
| `ui/chart/` | 종합 누적 출현 막대 차트 |
| `ui/cards/` | 누적 제외·출처별 번호 카드 |
| `ui/summary/` | 통합 채택 번호 카드 |
| `hooks/useFinalPickDrawList.ts` | 조회 가능 회차 목록 |
| `hooks/useFinalPickSrch.ts` | 회차 조회·당첨·이전 회차 행 |
| `hooks/useFinalPickDerived.ts` | 연속·누적·카이·차트 파생값 |
| `hooks/useFinalPickData.ts` | 위 훅 조립 |
| `api/` | `run-streak`·`drawings` HTTP (`draw/`·`win/`·`core/`) |
| `logic/chiWf/` | 카이제곱 워크포워드 채택·제외(분할 모듈) |
| `logic/accuAdopt.ts` | 누적 출현 극값 제외 |
| `types/winRow.ts` | 당첨번호 행 타입·파싱 |
| `constants/` | UI 상수·카드 tone |
| `tests/` | 단위 테스트 |

## 로컬에서 확인

루트에서 `npm run dev` 후 `http://localhost:3010/analysis/final-pick` 로 이동합니다. 백엔드 API(8010)가 떠 있어야 조회가 됩니다.

## 주의

- API는 현재 `/api/analysis/run-streak/*`, `/api/drawings/draw-numbers` 를 재사용합니다. URL을 바꿀 때는 `api/` 만 수정하세요.
- `chi-square`·`accu-nums`·`recommend` 가 `logic/chiWf`, `logic/accuAdopt`, `ui/cards/AccumulatedExclusionCard` 를 import 합니다. 경로 변경 시 함께 맞춥니다.
