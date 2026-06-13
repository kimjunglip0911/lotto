# 통합 분석 (final-pick)

## 목적

선택한 회차 **직전까지**의 당첨 이력으로 **번호별 누적 출현 종합 차트(1~45)** 를 보여 줍니다. 회차 검색 후 당첨 본번호를 차트에서 하이라이트합니다.

## 주요 파일

| 경로 | 역할 |
|:---|:---|
| `page.tsx` | 레이아웃·`Header`/`Sidebar`·`useFinalPickData`·`FinalPickMain` |
| `ui/FinalPickMain.tsx` | 검색·종합 차트 조립 |
| `ui/search/` | 회차 검색 패널·본번호 미리보기 |
| `ui/chart/` | 종합 누적 출현 막대 차트 |
| `ui/cards/` | `AccumulatedExclusionCard` 등(다른 분석 페이지와 공유, 본 페이지에서는 미사용) |
| `hooks/useFinalPickDrawList.ts` | 조회 가능 회차 목록 |
| `hooks/useFinalPickSrch.ts` | 회차 조회·당첨·이전 회차 행 |
| `hooks/useFinalPickDerived.ts` | 차트용 누적 출현 집계 |
| `hooks/useFinalPickData.ts` | 위 훅 조립 |
| `api/` | `accu-nums`·`drawings` HTTP (`draw/`·`win/`·`core/`) |
| `logic/accuAdopt.ts` | 누적 극값 제외( `accu-nums` 와 공유) |
| `types/winRow.ts` | 당첨번호 행 타입·파싱 |
| `tests/` | `accuAdopt` 단위 테스트 |

## 로컬에서 확인

루트에서 `npm run dev` 후 `http://localhost:3010/analysis/final-pick` 로 이동합니다. 백엔드 API(8010)가 떠 있어야 조회가 됩니다.

## 주의

- API는 `/api/analysis/accu-nums/*`, `/api/drawings/draw-numbers` 를 사용합니다. URL을 바꿀 때는 `api/` 만 수정하세요.
- `accu-nums` 가 `logic/accuAdopt`, `ui/cards/AccumulatedExclusionCard` 를 import 합니다. 경로 변경 시 함께 맞춥니다.
- 번호 추천(`recommend`)은 본 페이지와 연동하지 않으며 **1~45 전체 풀**로 세트를 생성합니다.
