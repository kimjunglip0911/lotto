# Recommend Page

로또 추천 페이지(`apps/web/src/app/recommend`)의 화면 흐름과 로직 구조를 설명합니다.

## 목적

- **1~45 전체 번호 풀**과 당첨 통계로 **목표 20세트**를 만든 뒤 저장합니다.
- **자리대 순위** — 3개월(13회)→6개월(26회)→1년(52회) **cascade**(출현 번호만 순위, 미출현 제외).
- **고저 합산** — 기준 회차 직전 **전체 누적** 이력(개월 윈도우 아님).
- **① 조합 생성** — rank 1~18: **자리별 band**(3세트마다 tier 증가)·**1구→6구 순차**·**고저 합**·자리 ladder. rank **19~20**: **0회 미사용 번호 우선**·**고저 무시**.
- **②** strategy 형식: `combo:rank{k}`. **rank 19~20**은 band·고저 무시, **아직 0회 쓰이지 않은 번호 우선**(부족 시 한도 남은 번호)으로 조합.
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
- `@/lib/statsWindow.ts` — 윈도우 상수(13/26/52회)·`STATS_BAND_CASCADE_WINDOWS`
- `logic/generation/fetchInputs.ts` — 당첨 이력 조회
- `@/lib/pickStatsHistory` — 기준 회차 직전 이력 슬라이스
- `logic/generation/runPipeline.ts` — 생성·저장 파이프라인(합산=전체·band=3/6/12 cascade)
- `logic/combo/generate.ts` — 20세트 생성(rank 1~20·순차 선택)
- `logic/repair/sequentialPick.ts` — 1구간→6구간 고저 lookahead 선택
- `logic/combo/buildBandTargets.ts` — `buildBandTargetsForRankCascade`
- `combination/logic/rankPositionBands.ts` — `pickBandIndexForCascadeRank`(공용)
- `logic/repair/` — band·합 수리
- `api/recommend/` — 저장·조회 HTTP

## 주의사항

- 백엔드 응답은 `unknown` 수신 후 `helpers/validators`로 검증합니다.
- 저장 시 `excluded_numbers`는 빈 배열로 전송합니다(레거시 필드 호환).
- 적용 규칙 ID: `full-pool-45`, `combination-rank-20sets`, `stats-window-cascade-3-6-12`, `rank-band-tier-repeat-3`, `pos-band-ladder-fallback`, `unused-pool-tail-fill`, `tail-rank-unused-no-sum`, `sum-stats-full-history`.
- **자리대 band**는 3→6→12개월 cascade(출현 번호만). **동일 순위 band는 rank 3개씩 반복** 후 다음 순위로 넘어갑니다. **각 자리는 1등→2등→… ladder**로만 내려가며, band 무시 조합 폴백은 사용하지 않습니다.
- `/combination` 구간별 번호 확률 표는 **10년(520회)** 표본입니다(추천과 별도).
- 목표는 20세트이며, **번호당 3회 한도** 기준 풀 고유 번호 `N`개일 때 **이론상 최대 `floor(N×3÷6)`세트**입니다(1~45 전체이면 **최대 22세트**).
- 2단계 폴백 세트는 UI에서 **조합 폴백** 배지(amber)로 구분됩니다(레거시 저장분만 해당).
