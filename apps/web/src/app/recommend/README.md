# Recommend Page

로또 추천 페이지(`apps/web/src/app/recommend`)의 화면 흐름과 로직 구조를 설명합니다.

## 목적

- **1~45 전체 번호 풀**과 당첨 통계로 **목표 20세트**를 만든 뒤 저장합니다.
- **자리대 순위** — 최근 **3년(156회)** 표본(출현 번호만 순위, 미출현 제외).
- **① 조합 생성** — **RANK N = N등 band** 시작(각 구간)·**1구→6구 순차**·ladder 폴백. 번호는 **20세트 전체 3회 한도**만 적용. **고저 합·mid-band 폴백 없음**.
- **②** strategy 형식: `combo:rank{k}`.
- **④** 홀짝 제약은 사용하지 않습니다.

## 폴더 구조 (8대표)

```text
recommend/
├── page.tsx
├── README.md
├── api/          # draw, chi, recommend, core
├── ui/           # RecommendMain, controller, result, alert
├── hooks/
├── logic/        # combo, repair, rank, generation, saved
├── helpers/      # validators, genPayload, genMessages, savedMessages, savedState
├── types/
├── constants/    # lottoPool, comboThresholds, generationRules, …
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

- `constants/lottoPool.ts` — `FULL_LOTTO_POOL`(1~45) 고정 풀
- `constants/comboThresholds.ts` — `LOTTO_SUM_MIN`/`LOTTO_SUM_MAX`(고저 미적용 시 전체 허용)
- `@/lib/statsWindow.ts` — 윈도우 상수(3년 156회)·`STATS_BAND_CASCADE_WINDOWS`
- `logic/generation/fetchInputs.ts` — 당첨 이력 조회
- `@/lib/pickStatsHistory` — 기준 회차 직전 이력 슬라이스
- `logic/generation/runPipeline.ts` — 생성·저장 파이프라인(band=최근 3년)
- `logic/combo/generate.ts` — 20세트 생성(rank 1~20·rank별 band)
- `logic/repair/sequentialPick.ts` — 1구간→6구간 rank ladder 순차 선택
- `logic/combo/buildBandTargets.ts` — `buildBandTargetsForRankCascade`·`buildBandLadderForRankCascade(tier=rank)`
- `combination/logic/rankPositionBands.ts` — `pickBandIndexForCascadeRank`(공용)
- `logic/repair/` — band·합 수리(합은 21~255 전체 허용)
- `ui/result/SetList.tsx` · `SetRankTable.tsx` — 세트별 **구간·순위·번호** 표(기준 회차 직전 3년 조합 분석 순위)
- `hooks/usePositionRankLookup.ts` — 표시용 자리별 순위 lookup

## 주의사항

- 백엔드 응답은 `unknown` 수신 후 `helpers/validators`로 검증합니다.
- 저장 시 `excluded_numbers`는 빈 배열로 전송합니다(레거시 필드 호환).
- 적용 규칙 ID: `full-pool-45`, `combination-rank-20sets`, `stats-window-three-year`, `pos-band-ladder-fallback`, `unused-pool-tail-fill`.
- **자리대 band**는 최근 **3년(156회)** 표본. **rank N 세트는 N등 band부터** ladder(최대 45단). **겹침·3회 한도**면 **다음 등수 ladder**로 넘어감.
- rank 19~20 미생성 시 **직전 rank 세트를 되돌리며 다른 조합으로 재시도**(ripple recovery).
- **동일 조합 중복** 시 번호 **1개만** 교체합니다(백트래킹 전체 재생성 없음). 대상 구간은 구간별 조합분석 **총 회차(drawCount)가 가장 낮은** 번호부터 순서대로 시도합니다.
- `/combination` 조합 분석도 **3년(156회)** 표본을 사용합니다(추천과 동일).
- 목표는 20세트이며, **번호당 3회 한도** 기준 풀 고유 번호 `N`개일 때 **이론상 최대 `floor(N×3÷6)`세트**입니다(1~45 전체이면 **최대 22세트**).
- 2단계 폴백 세트는 UI에서 **조합 폴백** 배지(amber)로 구분됩니다(레거시 저장분만 해당).
