# Recommend Page

로또 추천 페이지(`apps/web/src/app/recommend`)의 화면 흐름과 로직 구조를 설명합니다.

## 목적

- **1부터 45 전체 번호 풀**에서 **제외 번호**(직전 회차 본6+보너스 ∪ 최근 6회 2회↑ 출현, 보너스 포함)를 뺀 뒤, 당첨 통계로 **목표 30세트**를 만들어 저장합니다.
- **자리대 순위** — 최근 **3년(156회)** 표본(출현 번호만 순위, 미출현 제외).
- **미추첨 간격** — 기준 회차 직전 **3년(156회)** 표본의 **본번호+보너스** 출현으로 현재·최대 간격을 구합니다. 현재가 더 길면 최대를 갱신하고, **최대 근접**(같으면 미추첨 기간 긴 순)으로 우선합니다(미출현은 하단). 자리대와 같은 3년 창을 씁니다.
- **① 조합 생성** — **RANK1부터 10(미추첨 간격)**: 최대간격 근접 우선 6칸. **RANK11부터 17(항목별 순위)**: 구간 band ladder. **RANK18부터 20(균등 0회 3세트)**: 최근 6회 0회 번호만 — 18=미추첨 간격, 19부터 20=조합. **RANK21부터 25**: 1부터 10세트 미사용 번호를 leftover 간격 1등부터 5세트. **RANK26부터 30**: 11부터 20세트 미사용 번호·항목별 11등부터 5세트. 미사용이 8개 미만이면 풀에서 채운다. 번호 **30세트 전체 3회 한도는 현재 임시 비활성**(주석).
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
- `@/lib/statsWindow.ts` — 윈도우 상수(3년 156회)·`STATS_BAND_CASCADE_WINDOWS`
- `logic/generation/fetchInputs.ts` — 당첨 이력 조회
- `@/lib/pickStatsHistory` — 기준 회차 직전 이력 슬라이스
- `logic/generation/runPipeline.ts` — 생성·저장 파이프라인(band=최근 3년, 균등·직전 제외, 과거 당첨 조합 제외)
- `logic/generation/buildGenArgs.ts` — 제외 = `buildEqualExclude`(6회 2회↑ ∪ 직전 7)
- `logic/generation/prevDrawExclude.ts` — 직전 회차 행·번호 추출·풀 필터
- `@/app/equal/logic/buildExclude.ts` — 제외 집합 계산(균등 페이지와 공유)
- `logic/gap/keepPoolGaps.ts` — 제외 후 풀에 맞게 간격순위 lookup 축소
- `logic/combo/generate.ts` — 30세트 생성(1부터 20 고정 후 leftover 21부터 30)
- `logic/combo/fillRange.ts` · `leftFill.ts` · `leftSlot.ts` · `leftGapPick.ts` — 구간 채우기·leftover 풀·폴백
- `logic/combo/findOneGapSet.ts` — 간격순위 세트(RANK1부터 10·RANK18·leftover 21부터 25)
- `logic/gap/gapTargets.ts` — 간격순위 6칸 목표·역 lookup
- `constants/gapSetRanks.ts` — RANK1부터 10 / RANK11부터 슬롯 분할 상수
- `constants/leftRanks.ts` — leftover RANK21부터 30 창·band
- `constants/zeroEqualRanks.ts` — RANK18부터 20 균등 0회 3세트
- `logic/gap/gapRank.ts` — 미추첨 간격 현재·최대 근접 순위 계산(본번호+보너스, 현재가 길면 최대 갱신)
- `logic/gap/gapCompare.ts` — 최대 근접 → 미추첨 기간 긴 순 → 하단 정렬
- `logic/repair/sequentialPick.ts` — 1구간→6구간 rank ladder 순차 선택
- `logic/combo/buildBandTargets.ts` — `buildBandTargetsForRankCascade`·`buildBandLadderForRankCascade(tier=rank)`
- `combination/logic/rankPositionBands.ts` — `pickBandIndexForCascadeRank`(공용)
- `logic/repair/` — band·합 수리(합은 21~255 전체 허용)
- `ui/result/SetList.tsx` · `SetRankTable.tsx` — 세트별 **구간·순위·미추첨 기간·번호** 표(자리대·미추첨 간격 모두 기준 회차 직전 3년)
- `hooks/usePositionRankLookup.ts` — 표시용 자리별 순위 lookup
- `hooks/useGapRankLookup.ts` — 표시용 번호별 현재 간격 lookup(3년 156회)

## 주의사항

- 백엔드 응답은 `unknown` 수신 후 `helpers/validators`로 검증합니다.
- 저장 시 `excluded_numbers`에 **제외 번호 전체**(2회↑ ∪ 직전)를 넣습니다. 둘 다 없으면 빈 배열입니다.
- 적용 규칙 ID: `full-pool-45`, `exclude-prev-draw-7`, `combination-rank-30sets`, `stats-window-three-year`, `gap-window-three-year`, `gap-set-ranks-1-10`, `pos-band-ranks-11-17`, `equal-zero-ranks-18-20`, `pos-band-ladder-fallback`, `unused-pool-tail-fill`.
- **RANK1부터 10** 미추첨 간격, **RANK11부터 17** 자리대 ladder, **RANK18부터 20** 균등 0회(18 미추첨 간격·19부터 20 조합), **RANK21부터 25** leftover 미추첨 간격, **RANK26부터 30** leftover 항목별. (번호당 3회 한도는 임시 비활성)
- **과거 당첨 조합 제외**는 `selectedDraw` 기준 **이전 회차**의 본번호 6개만 비교합니다. 과거 회차를 선택해 재생성할 때도 해당 회차 자체는 제외 대상에 넣지 않습니다.
- rank 19~20 미생성 시 **직전 rank 세트를 되돌리며 다른 조합으로 재시도**(ripple recovery).
- **동일 조합 중복** 시 번호 **1개만** 교체합니다(백트래킹 전체 재생성 없음). 대상 구간은 구간별 조합분석 **총 회차(drawCount)가 가장 낮은** 번호부터 순서대로 시도합니다.
- `/combination` 조합 분석도 **3년(156회)** 표본을 사용합니다(추천과 동일).
- 목표는 30세트이다. 1부터 20세트를 채운 뒤에만 leftover를 붙인다. 번호당 3회 한도(`MAX_NUM_USAGE`)는 **현재 생성 로직에서 임시 비활성**이며, 상수는 재활성화용으로 남겨 둔다.
- leftover는 앞 묶음 미사용을 쓰고, 부족하면 풀에서 채워 30세트를 맞춘다. 번호 추천 화면은 생성 세트를 **전체 표시**하고, 10세트 묶음 선택은 홈(`/`)만 담당한다.
- 2단계 폴백 세트는 UI에서 **조합 폴백** 배지(amber)로 구분됩니다(레거시 저장분만 해당).
