# Recommend Page

로또 추천 페이지(`apps/web/src/app/recommend`)의 화면 흐름과 로직 구조를 설명합니다.

## 목적

- 통합 분석(`final-pick`)과 **동일한 경로**로 최종 채택 번호 풀을 계산하고, 조합 분석 페이지와 같은 통계로 **목표 20세트**를 만든 뒤 저장합니다.
- **①** 자리마다 band **1~3등** 구간에서 번호 1개. 자리별 **N등 비율이 20% 미만**이면 그 자리만 **1등 구간** 목표로 대체.
- **②** 합·홀짝·연속 슬롯당 10회·폴백. **③** **15슬롯 + oe1 앞 5슬롯 재시도** = 20세트.
- 미추첨 회차는 `(N−1)`회 당첨 본6을 reference로 대체해 채택을 계산합니다(화면 안내 문구 표시).

## 폴더 구조 (8대표)

```text
recommend/
├── page.tsx
├── README.md
├── api/          # draw, chi, recommend, adopt, core
├── ui/           # RecommendMain, controller, result, alert
├── hooks/
├── logic/        # combo, repair, adopt, rank, generation, saved
├── helpers/      # validators, genExcluded, genPayload, genMessages, savedMessages, savedState
├── types/
├── constants/
└── tests/        # combo, repair, lottoRank, saved
```

## 실행·환경

- 개발: 루트 `npm run dev` → web `3010`, api `8010`
- `NEXT_PUBLIC_API_URL` — API 베이스(예: `http://localhost:8010`)

## 검증

```bash
cd apps/web
npm run test -- src/app/recommend/tests
npm run lint
```

## 주요 모듈

- `logic/adopt/computeAdopted.ts` — 통합 채택 조회 오케스트레이션(`fetchFinalPickAdopted`)
- `logic/adopt/fetchDrawOne.ts` — 1회차 당첨·채택
- `logic/adopt/resolveMain.ts` — 본번호 결정(미추첨 시 전회차 대체)
- `logic/adopt/parseWinRows.ts` — 당첨 API JSON 검증
- `logic/adopt/buildSlice.ts` — 채택 슬라이스 계산(final-pick·연속·누적)
- `logic/adopt/adoptEmpty.ts` — 실패 시 빈 결과
- `logic/saved/loadSavedDraw.ts` — 저장 세트·채택 병렬 조회(훅에서 호출)
- `helpers/savedMessages.ts` — 저장 조회·초기 안내 문구
- `helpers/savedState.ts` — 저장 조회 전·후 UI 상태 갱신
- `logic/generation/runPipeline.ts` — 생성·저장 파이프라인(훅에서 호출)
- `logic/combo/generate.ts` — 20세트 생성
- `logic/combo/bandSlot.ts` — band 구간·내부 슬롯·슬롯 키
- `logic/combo/sortMains.ts` — 당첨 행 본번호 정렬
- `logic/combo/bandMonotonic.ts` — band 목표 단조 검사·보정
- `logic/combo/bandRankPick.ts` — 자리별 N등 band 인덱스 선택
- `logic/combo/buildBandTargets.ts` — 6자리 band 목표 배열
- `logic/combo/rankAtPct.ts` — 비율 랭크 기준 홀짝·연속 값
- `logic/repair/` — band·합·홀짝·연속 수리
- `api/recommend/` — 저장·조회 HTTP

## 주의사항

- 백엔드 응답은 `unknown` 수신 후 `helpers/validators`로 검증합니다.
- 목표는 20세트이며, 채택 풀 부족·주6 전부 중복일 때만 그보다 적게 저장되고 경고가 표시됩니다.
