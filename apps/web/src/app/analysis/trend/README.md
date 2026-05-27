# 추세 분석 (`trend`)

## 목적

선택 회차 기준으로 1~45번의 **EMA(지수이동평균) 출현율**·기댓값 대비 편차 구간 분포를 차트·표로 보여 줍니다. 주번호 6개만 집계하며 보너스는 EMA·기댓값 계산에서 제외합니다.

## 실행 방법

- 저장소 루트에서 `npm run dev` 후 브라우저에서 추세 분석 메뉴(`/analysis/trend`)로 이동합니다.
- 프론트만 단독 실행: `cd apps/web` 후 `npm run dev` (포트 **3010**).

## 환경 변수

- `NEXT_PUBLIC_API_URL`: 백엔드 베이스 URL. 비우면 같은 출처의 `/api/analysis/trend/...` 를 호출합니다.

## 폴더 구조 (8대표)

| 폴더 | 역할 |
|:---|:---|
| `api/` | HTTP 클라이언트 (`draw-numbers`, `winning-number`, `all-history`) |
| `ui/` | 화면 컴포넌트 (`search/`, `chart/`, `table/`, `summary/`) |
| `hooks/` | `useTrendData`, `useTrendView`, 회차·조회 훅 |
| `logic/` | EMA·편차 구간(`bins/`), 조회 오케스트레이션(`trend/trSearch.ts`) |
| `helpers/` | 상태 메시지·차트 메트릭·당첨번호 헬퍼 |
| `types/` | `WinningNumberRow`, `NumberTrendResult`, 편차 구간 타입 |
| `constants/` | EMA k, 차트 크기 |
| `tests/` | Vitest 단위 테스트 |

루트에는 `page.tsx`, `README.md`만 둡니다.

## 주의

- 1회차는 이전 이력이 없어 EMA·편차 표는 표시되지 않습니다.
- 당첨 이력이 DB에 없으면 회차 목록이 비어 안내만 표시됩니다.
- 오프라인 최종 사용자 환경을 고려해, 새 패키지 없이 기존 의존성만 사용합니다.
