# Recommend Page

로또 추천 페이지(`frontend/src/app/recommend`)의 화면 흐름과 로직 구조를 설명합니다.

## 목적

- 추천 실행 시 제외 규칙을 순차 적용하고, 누적번호분석 최종 4개(사용 번호)를 함께 표시하며 최종 추천 세트를 생성/저장합니다.
- 향후 규칙이 늘어나도 `logic/rules`에 파일을 추가하는 방식으로 확장할 수 있게 합니다.

## 화면 구성

- `page.tsx`: 화면 레이아웃과 컴포넌트 조합만 담당
- `hooks/useRecommendData.ts`: 회차 목록 로드 + 선택 회차 저장 세트/파이프라인 상태 조회
- `hooks/useRecommendGeneration.ts`: 생성/저장 실행 플로우 담당
- `components/AnalysisController.tsx`: 실행 버튼/회차 선택/당첨번호 표시
- `components/AnalysisResultList.tsx`: 사용 번호(누적번호분석 최종 4개), 적용 규칙, 제외 번호, 생성 결과 표시

## 로직 구조

- `logic/types.ts`
  - 규칙 공통 타입(`RecommendRule`, `RecommendRuleResult`, `RecommendRuleContext`)
  - API 응답 타입(`ExclusionCandidatesResponse`)
- `logic/api.ts`
  - Recommend/Analysis API 호출과 응답 파싱, 타입가드, 추세 계산 공통화
- `logic/pipeline.ts`
  - 규칙 배열을 순회하며 제외 번호를 누적 계산
- `logic/pipelineContext.ts`
  - `RecommendBaseData` → `runRecommendPipeline` 입력(`toRecommendPipelineBaseContext`) — UI와 검증 스크립트가 동일 필드만 넘기도록 정본화
- `logic/lottoRank.ts`
  - 6/45 등수 계산(`rankLotto645`, `bestRank`, `rankLabel`) — 백테스트 스크립트와 공유, 단위 테스트 대상
- `logic/recommendRulesList.ts`
  - 추천 파이프라인에 쓰는 규칙 배열 정본(`RECOMMEND_RULES`, UI·Node 검증 스크립트 공통)
- `logic/rules/excludeChiSquareHighDeviation.ts`
  - 카이제곱 편차 기반 제외 규칙
- `logic/rules/excludeTrendDown.ts`
  - 추세 하락 번호 제외 규칙(복원 번호 처리 포함)
- `logic/rules/excludeAbsenceStreakTop5.ts`
  - 장기 미출현 상위 번호 제외 규칙
- `logic/generator.ts`
  - 제외 후 사용 가능 번호 풀에서 최종 추천 세트 생성
- `logic/usedNumbers.ts`
  - 누적번호분석과 동일한 전략 조합으로 최종 사용 번호 4개 계산
- `logic/generator/scoring.ts`
  - 이력 단번·페어 가중, 테마/세트 점수 내 사용량 페널티(기존보다 소폭 완화)로 최근 출현 정보를 조금 더 반영
  - `hotTierBonusForNumber`: `generateDeterministicSets` 보충 경로에서만 사용하는 출현 비율 단계 가산
- `logic/generator/coverage.ts`
  - `scoreCoverageGain`의 트리플·페어 가중을 소폭 상향해 포트폴리오 다양성을 유지

**백테스트 참고**: 최근 52회 구간에서 지표는 DB·가중치 조합에 따라 달라질 수 있다. 과거 구간에서의 수치 개선이 미래 회차로 이어진다고 보장할 수 없다.

## 확장 방법

1. `logic/rules`에 신규 규칙 파일 생성
2. `RecommendRule` 인터페이스로 `id`, `name`, `apply` 구현
3. `logic/recommendRulesList.ts`의 `RECOMMEND_RULES` 배열에 신규 규칙을 추가

## 주의사항

- 백엔드 응답은 `unknown`으로 수신 후 타입 가드로 검증합니다.
- 추천 페이지는 `NEXT_PUBLIC_API_URL` 기반으로 백엔드와 통신합니다.
- 임시 디버그 호출/미사용 상태값/미사용 props는 유지하지 않습니다.

## 검증

- **등수 로직**: `cd frontend && npm run test` — `logic/lottoRank.test.ts` 등으로 회귀를 막습니다.
- **파이프라인·생성 품질**: 추천 페이지(3010)에서 백엔드(8010) 연동 후 실제 생성·비교 흐름을 확인합니다. UI는 `toRecommendPipelineBaseContext` → `runRecommendPipeline` → `generate20Sets` 경로를 사용합니다.
- **과거 CLI로 남긴 지표 스냅샷**: [`docs/추천번호검증.md`](../../../../docs/추천번호검증.md) (문서만 보관, 해당 터미널 스크립트는 제거됨)

### 지표 해석(문서·실험 공통)

- **등수별 누적 / 비율(분모 = 총 비교 건수)**: 회차 × 세트(최대 20) 각 조합을 한 건으로 세어, 5등·4등 등이 몇 번 나왔는지에 대한 비율입니다.
- **회차당 “5등 이상 1건 이상” 비율**: 당첨 데이터가 있는 회차만 분모로, 그중 한 세트라도 5등 이상이 나온 회차 비율입니다. 세트당 적중률과 의미가 다릅니다.

가중치·규칙을 과거 구간에 맞춰 조정하면 지표는 좋아질 수 있으나, 로또 추첨은 무작위에 가깝기 때문에 **미래 회차로의 일반화는 보장되지 않습니다.** 실험 결과는 검증·설명용으로만 취급하는 것이 좋습니다.

## 단위 테스트

등수 로직 회귀 방지:

```bash
cd frontend && npm run test
```
