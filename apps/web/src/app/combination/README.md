# 조합 분석 (combination)

## 목적

DB에 저장된 당첨 이력을 기준으로 주번호 6개(보너스 제외)의 조합 패턴을 집계합니다.

- 구간별(num1~num6) 번호 확률(번호 1개 단위 45구간) — **DB 전체** · **1등~꼴등 순위** 표시

## 주요 파일

| 경로 | 역할 |
|:---|:---|
| `page.tsx` | 레이아웃·`Header`/`Sidebar`·`useCombinationAnalysisData`·`CombinationMain` 조립 |
| `ui/CombinationMain.tsx` | 로딩·에러·구간별 집계 표 레이아웃 |
| `ui/table/` | 구간별 번호 확률 표 UI |
| `hooks/useCombinationAnalysisData.ts` | 마운트 시 이력 로드·전체 집계 |
| `api/loadHistory.ts` | `@/lib/accu-nums/api`로 draw 목록·당첨 범위 전체 조회 |
| `logic/rankPositionBands.ts` | 자리별 band 1등~꼴등 순위 계산(추천과 공유) |
| `logic/buildPositionBandDistribution.ts` | 구간별 분포 순수 함수 |
| `logic/numberToBand.ts` | 번호→번호대 인덱스(추천 로직과 공유) |
| `constants/bandLabels.ts` | 번호대 라벨·폭 상수(1단위 45구간) |
| `types/index.ts` | 집계 행 타입 |
| `tests/` | 구간별 비율·순위 단위 테스트 |

## 로컬에서 확인

루트 `run.bat` 또는 `cd apps/web && npm run dev` 후 사이드바 **조합 분석**을 클릭하거나 `http://localhost:1060/combination` 으로 이동합니다. `apps/web/.env.local`의 `DATABASE_URL`이 필요합니다.

## 주의

- 데이터는 **accu-nums** Nest 엔드포인트(`/api/analysis/accu-nums/draw-numbers`, `winning-numbers-range`)를 사용합니다. Web 클라이언트는 `src/lib/accu-nums/`입니다.
- **구간별 번호 확률** 표본은 **DB 전체**(`STATS_POSITION_BAND_WINDOW`)입니다. 상수는 `@/lib/statsWindow.ts`와 공유합니다.
- `recommend` 모듈이 `logic/rankPositionBands.ts`·`logic/numberToBand.ts`·`constants/bandLabels.ts`를 import합니다. 경로·규칙 변경 시 추천 조합 생성 로직도 검증합니다.
