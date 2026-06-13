# Recommend Page

로또 추천 페이지(`apps/web/src/app/recommend`)의 화면 흐름과 로직 구조를 설명합니다.

## 목적

- **1~45 전체 번호 풀**과 조합 분석 페이지와 같은 통계로 **목표 20세트**를 만든 뒤 저장합니다.
- **① 1단계** — 자리마다 band **1~3등** 구간·합·홀짝·연속 제약. band4~6 확장까지 시도 후 불가 슬롯은 비움. 슬롯당 `PROFILE_BUILD_ATTEMPTS`회.
- **② 2단계 폴백** — 1단계 빈 슬롯을 **합·홀짝·연속·band 무시** 조합으로 채움. **6개 조합 중복 금지**·**번호당 최대 3회** 유지.
- **③** **15슬롯 + oe1 앞 5슬롯 재시도** = 20세트. 폴백 세트 strategy는 `combo:fallback:oeX-runY-bandZ`.
- **④** 목표 band(1~3구간)에 풀 번호가 없으면 **band 4~6구간**에서 후보를 확장(1단계만).

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
- `logic/generation/fetchInputs.ts` — 조합 분석용 당첨 이력 조회
- `logic/generation/runPipeline.ts` — 생성·저장 파이프라인(훅에서 호출)
- `logic/saved/loadSavedDraw.ts` — 저장 세트 조회(훅에서 호출)
- `logic/combo/generate.ts` — 20세트 생성(1단계+2단계)
- `logic/combo/fillFallback.ts` — 2단계 폴백
- `logic/repair/` — band·합·홀짝·연속 수리
- `api/recommend/` — 저장·조회 HTTP

## 주의사항

- 백엔드 응답은 `unknown` 수신 후 `helpers/validators`로 검증합니다.
- 저장 시 `excluded_numbers`는 빈 배열로 전송합니다(레거시 필드 호환).
- 적용 규칙 ID: `full-pool-45`, `combination-20sets`.
- 목표는 20세트이며, **번호당 3회 한도** 기준 풀 고유 번호 `N`개일 때 **이론상 최대 `floor(N×3÷6)`세트**입니다(1~45 전체이면 **최대 22세트**).
- 2단계 폴백 세트는 UI에서 **조합 폴백** 배지(amber)로 구분됩니다.
