# Recommend Page

로또 추천 페이지(`frontend/src/app/recommend`)의 화면 흐름과 로직 구조를 설명합니다.

## 목적

- 통합 분석(`final-pick`)과 **동일한 경로**로 최종 채택 번호 풀을 계산하고, 조합 분석 페이지와 같은 통계로 **목표 20세트**를 만든 뒤 저장합니다. **①** 자리마다 band **1~3등** 구간에서 번호 1개(**band4 미사용**). 자리별 **N등 비율이 20% 미만**이면 그 자리만 **1등 구간** 목표로 대체(예: band3 프로필·1번 자리 3등 13% → 1등). **②** 합·홀짝·연속 슬롯당 10회·폴백. **③** **15슬롯 + oe1 앞 5슬롯 재시도** = 20세트. 동일 주6 조합은 제외.
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
- `logic/combinationBasedSets.ts` — `COMBO_PROFILE_SLOT_CYCLE`(band1~3)×15+5, `MIN_BAND_TIER_PERCENT`(20), `effectiveBandRankIdx`. `orderSetsByProfileSlots`로 표시 순서 유지.
- `logic/combinationBandRepair.ts` — `RepairPickCtx`(세트 간 usage·구간 칸 다양성), `buildOneSetWithFallback`(10회+2단계 폴백).
- `logic/api.ts` — `fetchChiSquareFullHistory`(조합 통계용 전체 이력), 저장/조회 API
- `logic/types.ts` — `GeneratedSet`, `RecommendRule*` 타입(저장 데이터·타입 호환용으로 일부 유지)
- `logic/validators.ts` — `fetchSavedRecommendData` 응답 검증
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
- 목표는 항상 20세트이며, 채택 풀 부족·주6 전부 중복일 때만 그보다 적게 저장되고 경고가 표시됩니다.
