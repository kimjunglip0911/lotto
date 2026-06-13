# 조합 분석 (combination)

## 목적

DB에 저장된 **전체 당첨 이력**을 기준으로 주번호 6개(보너스 제외)의 조합 패턴을 집계합니다.

- 홀짝(짝수 개수 0~6) 분포
- 자리별(num1~num6) 번호대(5개 단위 9구간) 확률
- 주6 합산 고·저 극단(10%/5% 제외) 및 최근 52회 창 건수

## 주요 파일

| 경로 | 역할 |
|:---|:---|
| `page.tsx` | 레이아웃·`Header`/`Sidebar`·`useCombinationAnalysisData`·`CombinationMain` 조립 |
| `ui/CombinationMain.tsx` | 로딩·에러·3개 집계 표 레이아웃 |
| `ui/table/` | 홀짝·구간·고저 합산 표 UI |
| `hooks/useCombinationAnalysisData.ts` | 마운트 시 전체 이력 로드·집계 상태 |
| `api/loadHistory.ts` | accu-nums API로 draw 목록·당첨 범위 조회 |
| `logic/runComboAnalysis.ts` | 3개 빌더 일괄 실행 |
| `logic/build*.ts` | 분포·극단 통계 순수 함수 |
| `logic/numberToBand.ts` | 번호→번호대 인덱스(추천 로직과 공유) |
| `constants/bandLabels.ts` | 번호대 라벨·폭 상수 |
| `types/index.ts` | 집계 행·통계 타입 |
| `tests/` | `numberToBandIndex`·구간별 비율 합 100% 단위 테스트 |

## 로컬에서 확인

루트에서 `npm run dev` 후 `http://localhost:3010/analysis/combination` 으로 이동합니다. 백엔드 API(`8010`)와 `NEXT_PUBLIC_API_URL` 설정이 필요합니다.

## 주의

- 데이터는 **accu-nums** Nest 엔드포인트(`/api/analysis/accu-nums/draw-numbers`, `winning-numbers-range`)를 사용합니다. accu-nums API·파서 변경 시 이 화면도 함께 확인합니다.
- `recommend` 모듈이 `logic/numberToBand.ts`·`constants/bandLabels.ts`를 import합니다. 경로·규칙 변경 시 추천 조합 생성 로직도 검증합니다.
