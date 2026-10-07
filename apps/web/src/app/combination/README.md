# 조합 분석 (combination)

## 목적

당첨 이력으로 계산한 주번호 6개(보너스 제외) 자리별 번호대 확률을 보여 줍니다. `combo_pos_bands` 저장본은 추천용 **전체** 집계입니다. 화면은 그 저장본과 별도로 **1년(최근 52회)·3년(최근 156회)·전체** 세 표를 한 줄 세 열로 그립니다. 각 자리는 **10등까지**만 표시합니다. 이력이 그 회차보다 적으면 있는 회차만 집계합니다.

## 주요 파일

| 경로 | 역할 |
|:---|:---|
| `page.tsx` | 레이아웃·`Header`/`Sidebar`·`useCombinationAnalysisData`·`CombinationMain` 조립 |
| `ui/CombinationMain.tsx` | 로딩·에러·1년·3년·전체 표 레이아웃 |
| `ui/table/` | 구간별 번호 확률 표 UI(자리별 10등) |
| `hooks/useCombinationAnalysisData.ts` | 마운트 시 저장본·기간 집계 GET |
| `api/loadStored.ts` | `/api/analysis/combination` 조회 |
| `logic/windows.ts` | 1년·3년·전체 집계 |
| `logic/topRanks.ts` | 화면용 10등 자르기 |
| `logic/rankPositionBands.ts` | 자리별 band 1등~꼴등 순위(추천과 공유) |
| `logic/eligibleBands.ts` | 추천 채택: 1%↑ 목록·자리별 1등 순환 |
| `logic/buildPositionBandDistribution.ts` | 구간별 분포 순수 함수(서버 재집계와 공유) |
| `logic/storedRows.ts` · `fromStored.ts` | 저장 행 매핑 |
| `constants/bandLabels.ts` | 번호대 라벨·폭 상수(1단위 45구간) |
| `types/index.ts` | 집계 행 타입 |
| `tests/` | 비율·순위·저장 매핑·1% 순환 테스트 |

## 로컬에서 확인

루트 `run.bat` 또는 `cd apps/web && npm run dev` 후 사이드바 **조합 분석**을 클릭하거나 `http://localhost:1060/combination` 으로 이동합니다. `apps/web/.env.local`의 `DATABASE_URL`이 필요합니다.

## 주의

- 화면 `windows`는 GET 때 `lotto_winners`를 최근 52회·156회·전체로 집계합니다. 추천 생성은 기준 회차 이전 이력으로 1~10세트 1년, 11~20세트 3년, 21~30세트 전체를 쓰고, 각 기간은 10등 다음 1등으로 순환합니다. `rows` 저장본은 그대로 응답에 남습니다.
- 추천번호확인에서 당첨번호를 저장하면 전체 이력을 다시 집계해 저장본을 덮어씁니다.
- GET 시 저장 테이블이 비어 있으면 서버가 `lotto_winners`로 한 번 채웁니다.
- 화면은 자리별 10등까지, 그 안의 0.x% 행도 보여 줍니다. 추천 생성만 1% 미만을 건너뜁니다.
- `recommend`가 `eligibleBands`·`rankPositionBands`·`numberToBand`를 import합니다.
