# Recommend Page

로또 추천 페이지(`frontend/src/app/recommend`)의 화면 흐름과 로직 구조를 설명합니다.

## 목적

- 통합 분석(`final-pick`)과 **동일한 경로**로 최종 채택 번호 풀을 계산하고, 조합 분석 페이지와 같은 통계(고저 합·홀짝·연속·구간별)로 제약을 걸어 **최대 20세트**를 만든 뒤 `POST /api/recommend/generate-and-save`로 저장합니다. 각 세트의 **6개 번호는 통합 채택 풀 안에서만** 고르며, **C(n,6) 전수 탐색 없이** 자리별 band 구간 랜덤 시드와 교체 루프로 구성합니다. **고저 합산 허용 구간**은 모든 세트에 공통 적용된다. 홀짝·연속 랭크 후보는 분포 비율 **10% 초과**만 쓴다. **자리대(1~6번째 번호 각각)**는 번호대(1~5, 6~10, …, 41~45)별 비율을 내림차순 정렬했을 때 `band1`~`band3`는 각각 1~3등 구간만 정확히 맞춘다. 교체 시 **선택 회차 미만** 누적 출현이 적은 번호를 같은 band 구간 안에서 우선한다. 20개가 부족하면 (홀짝·연속·band) **우선순위 라운드**를 반복하고, 한 라운드에서 진전이 없으면 중단한다. 동일 주6 조합은 `usedKeys`로 제외한다.
- 기준 회차에 당첨번호가 있으면 그 본6을 워크포워드 reference로 쓴다.
- **미추첨 회차**(N회 당첨 미등록)는 `(N−1)`회 당첨 본6을 reference로 대체해 채택을 계산한다(화면에 안내 문구 표시).

## 화면 구성

- `page.tsx`: 레이아웃·훅 연결
- `hooks/useRecommendData.ts`: 회차 목록, 선택 회차 저장 세트·당첨·통합 채택 표시
- `hooks/useRecommendGeneration.ts`: 통합 채택 + 전체 이력 조회 → 조합 20세트 생성·저장
- `components/AnalysisController.tsx`: 실행 버튼·회차 선택·당첨번호 표시
- `components/AnalysisResultList.tsx`: 통합 채택 번호, 조합 요약, 생성 세트 목록

## 로직 구조

- `logic/finalPickAdopted.ts` — `winning-number` / `winning-numbers-range` + `getChiSquareFinalPickSlice` 등 통합 페이지와 동일 채택(카이제곱 워크포워드는 조회 직전 전체 기간)
- `logic/combinationBasedSets.ts` — 전체 이력 기준 `buildSumExtremeStats`·홀짝·연속·자리대 통계 + **통합 채택 풀**만 사용. 프로필 `(oe, run, band)`마다 `logic/combinationBandRepair.ts`로 **자리별 band 목표 구간에서 랜덤 시드(최대 48회)** → 합·홀짝·연속 불일치 시 **같은 자리 band 구간 안**에서 **기준 회차(`selectedDraw`) 미만 누적 출현이 적은 번호**로 교체(최대 300스텝). C(n,6) 전수 탐색 없음. 삼중항 순서 **oe → run → band(1→3)**, `sortGeneratedSetsByComboStrategy` 유지.
- `logic/combinationBandRepair.ts` — `buildHistCounts`, `randomBandSeed`, `repairOneStep`, `tryBuildOneSet`.
- `logic/api.ts` — `fetchChiSquareFullHistory`(조합 통계용 전체 이력), 저장/조회 API
- `logic/types.ts` — `GeneratedSet`, `RecommendRule*` 타입(저장 데이터·타입 호환용으로 일부 유지)
- `logic/trend.ts`, `logic/usedNumbers.ts`, `logic/validators.ts` — `fetchSavedRecommendData` / 과거 데이터 로드에 사용
- `logic/lottoRank.ts` — 등수 계산(단위 테스트), UI 비필수

## 검증

```bash
cd frontend && npm run test
```

- `logic/combinationBasedSets.test.ts` — 채택 부족·빈 이력·요약·중복 검사
- `logic/lottoRank.test.ts` — 등수 로직 회귀

추천 페이지(3010)에서 백엔드(8010) 연동 후 실제 생성·저장을 한 번 확인하는 것이 좋습니다.

## 주의사항

- 백엔드 응답은 `unknown`으로 수신 후 타입 가드로 검증합니다.
- `NEXT_PUBLIC_API_URL` 기준으로 API를 호출합니다.
- 채택 풀·제약이 맞지 않으면 20개 미만만 생성될 수 있으며, 상태 메시지에 안내됩니다.
