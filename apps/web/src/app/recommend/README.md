# Recommend Page

로또 추천 페이지(`apps/web/src/app/recommend`)의 화면 흐름과 로직 구조를 설명합니다.

## 목적

- **1부터 45 전체 번호 풀**에서 **제외 번호**(직전 회차 본6+보너스 ∪ 최근 6회 2회↑ 출현, 보너스 포함)를 뺀 뒤, 당첨 통계로 **목표 30세트**를 만들어 저장합니다.
- **자리대 순위** — 기준 회차 직전 **전체** 표본(출현 번호만 순위, 미출현 제외).
- **① 조합 생성** — **RANK N**은 조합분석 **N등** 자리대 ladder(1구→6구). 제외·이미 쓴 번호면 다음 등수. 번호 **30세트 전체 3회 한도는 현재 임시 비활성**(주석).
- 생성 후보가 **기준 회차 이전 실제 당첨 본번호 6개 조합**과 같으면 제외합니다(보너스 번호 제외).
- **②** strategy 형식: `combo:rank{k}`.
- **④** 홀짝·고저 합산 제약은 사용하지 않습니다.

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

- 개발: 루트 `run.bat` 또는 `cd apps/web && npm run dev` → `1060` (같은 오리진 `/api`)
- `DATABASE_URL` — Supabase Session pooler (서버 전용)

## 검증

```bash
cd apps/web
npm run test -- src/app/recommend/tests
npm run lint
```

## 주요 모듈

- `constants/lottoPool.ts` — `FULL_LOTTO_POOL`(1~45) 고정 풀
- `constants/comboThresholds.ts` — `LOTTO_SUM_MIN`/`LOTTO_SUM_MAX`(주6 합 물리 범위 21~255)
- `@/lib/statsWindow.ts` — 윈도우 상수(전체)·`STATS_BAND_CASCADE_WINDOWS`
- `logic/generation/fetchInputs.ts` — 당첨 이력 조회
- `@/lib/pickStatsHistory` — 기준 회차 직전 이력 슬라이스
- `logic/generation/runPipeline.ts` — 생성·저장 파이프라인(band=전체, 균등·직전 제외, 과거 당첨 조합 제외)
- `logic/generation/buildGenArgs.ts` — 제외 = `buildEqualExclude`(6회 2회↑ ∪ 직전 7)
- `logic/generation/prevDrawExclude.ts` — 직전 회차 행·번호 추출·풀 필터
- `@/app/equal/logic/buildExclude.ts` — 제외 집합 계산(균등 페이지와 공유)
- `logic/combo/generate.ts` — 30세트 생성(RANK N = N등 자리대)
- `logic/combo/fillRange.ts` · `fillSlots.ts` — 전 구간 한 번에 채우기
- `logic/combo/findOneSet.ts` — 자리대 세트 1개
- `logic/repair/sequentialPick.ts` — 1구간→6구간 rank ladder 순차 선택
- `logic/combo/buildBandTargets.ts` — `buildBandTargetsForRankCascade`·`buildBandLadderForRankCascade(tier=rank)`
- `combination/logic/rankPositionBands.ts` — `pickBandIndexForCascadeRank`(공용)
- `logic/repair/` — band·합 수리(합은 21~255 전체 허용)
- `ui/result/SetList.tsx` · `SetRankTable.tsx` — 세트별 **구간·순위·번호** 표
- `hooks/usePositionRankLookup.ts` — 표시용 자리별 순위 lookup

## 주의사항

- 백엔드 응답은 `unknown` 수신 후 `helpers/validators`로 검증합니다.
- 저장 시 `excluded_numbers`에 **제외 번호 전체**(2회↑ ∪ 직전)를 넣습니다. 둘 다 없으면 빈 배열입니다.
- 적용 규칙 ID: `full-pool-45`, `exclude-prev-draw-7`, `combination-rank-30sets`, `stats-window-all`, `pos-band-ranks-1-30`, `pos-band-ladder-fallback`, `unused-pool-tail-fill`.
- **RANK N**은 조합분석 N등 자리대 ladder. (번호당 3회 한도는 임시 비활성)
- **과거 당첨 조합 제외**는 `selectedDraw` 기준 **이전 회차**의 본번호 6개만 비교합니다. 과거 회차를 선택해 재생성할 때도 해당 회차 자체는 제외 대상에 넣지 않습니다.
- 미생성 슬롯은 **직전 세트를 되돌리며 다른 조합으로 재시도**(ripple recovery).
- **동일 조합 중복** 시 번호 **1개만** 교체합니다(백트래킹 전체 재생성 없음). 대상 구간은 구간별 조합분석 **총 회차(drawCount)가 가장 낮은** 번호부터 순서대로 시도합니다.
- `/combination` 조합 분석도 **전체** 표본을 사용합니다(추천과 동일).
- 목표는 30세트이다. 번호당 3회 한도(`MAX_NUM_USAGE`)는 **현재 생성 로직에서 임시 비활성**이며, 상수는 재활성화용으로 남겨 둔다.
- 번호 추천 화면은 생성 세트를 **전체 표시**하고, 10세트 묶음 선택은 홈(`/`)만 담당한다.
- 2단계 폴백 세트는 UI에서 **조합 폴백** 배지(amber)로 구분됩니다(레거시 저장분만 해당).
