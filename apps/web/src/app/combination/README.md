# 조합 분석 (combination)

## 목적

당첨 이력 전체로 계산한 주번호 6개(보너스 제외) 자리별 번호대 확률을 **DB에 저장**해 보여 줍니다.

- 구간별(num1~num6) 번호 확률(번호 1개 단위 45구간) — **저장된 최신 집계** · **1등~꼴등 순위** 표시(0.x% 행 포함)

## 주요 파일

| 경로 | 역할 |
|:---|:---|
| `page.tsx` | 레이아웃·`Header`/`Sidebar`·`useCombinationAnalysisData`·`CombinationMain` 조립 |
| `ui/CombinationMain.tsx` | 로딩·에러·구간별 집계 표 레이아웃 |
| `ui/table/` | 구간별 번호 확률 표 UI |
| `hooks/useCombinationAnalysisData.ts` | 마운트 시 저장본 GET |
| `api/loadStored.ts` | `/api/analysis/combination` 조회 |
| `logic/rankPositionBands.ts` | 자리별 band 1등~꼴등 순위(화면 표시) |
| `logic/eligibleBands.ts` | 추천 채택: 1%↑ 목록·자리별 1등 순환 |
| `logic/buildPositionBandDistribution.ts` | 구간별 분포 순수 함수(서버 재집계와 공유) |
| `logic/storedRows.ts` · `fromStored.ts` | 저장 행 매핑 |
| `constants/bandLabels.ts` | 번호대 라벨·폭 상수(1단위 45구간) |
| `types/index.ts` | 집계 행 타입 |
| `tests/` | 비율·순위·저장 매핑·1% 순환 테스트 |

## 로컬에서 확인

루트 `run.bat` 또는 `cd apps/web && npm run dev` 후 사이드바 **조합 분석**을 클릭하거나 `http://localhost:1060/combination` 으로 이동합니다. `apps/web/.env.local`의 `DATABASE_URL`이 필요합니다.

## 주의

- 표 데이터는 `combo_pos_bands` 저장본입니다. 추천번호확인에서 당첨번호를 저장하면 전체 이력을 다시 집계해 덮어씁니다.
- GET 시 테이블이 비어 있으면 서버가 `lotto_winners`로 한 번 채웁니다.
- 화면은 0.x% 행도 보여 줍니다. 추천 생성만 1% 미만을 건너뜁니다.
- `recommend`가 `eligibleBands`·`rankPositionBands`·`numberToBand`를 import합니다.
