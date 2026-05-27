# 카이제곱 검정 (chi-square)

## 목적

선택한 회차 **직전까지** 저장된 당첨번호로 번호별 누적 출현(O)·기대(E)·편차·χ²를 계산하고, 편차 구간 워크포워드·제외 규칙을 표·차트로 보여 줍니다. 통합 분석(`final-pick`)과 워크포워드 제외·채택 로직을 공유합니다.

## 주요 파일

| 경로 | 역할 |
|:---|:---|
| `page.tsx` | 레이아웃·`Header`/`Sidebar`·`useChiSquareData`/`useChiSquareDerived`·`ChiMain` 조립 |
| `ui/ChiMain.tsx` | 검색·요약·워크포워드 표·제외 카드·차트·결과표 조립 |
| `ui/search/` | 회차 검색 패널 |
| `ui/chart/` | 편차(O−E) 막대 차트 |
| `ui/table/` | 검정 결과표·구간별 워크포워드 표 |
| `hooks/useChiSquareData.ts` | 회차 목록·조회 훅 조립 |
| `hooks/useChiSquareDrawList.ts` | 조회 가능 회차 목록 |
| `hooks/useChiSquareSrch.ts` | 조회 세션·χ²·워크포워드 행 상태 |
| `hooks/useChiSquareDerived.ts` | 안내 문구·워크포워드 파생·제외 집합 |
| `logic/runChiSearch.ts` | 당첨·범위 API 병렬 호출·χ² 집계 |
| `logic/chiSquare.ts` | χ² 결과 빌드·편차 순 채택 헬퍼 |
| `logic/walkForwardStats.ts` | 워크포워드·구간 집계(하위 `logic/wf/` 재export) |
| `api/` | 백엔드 API(`core/`·`parse/`·`draw/`·`win/`·`index.ts`) |
| `types/index.ts` | 타입 공개 진입점 |
| `constants/` | 임계값·구간·차트 상수 |
| `tests/` | χ²·워크포워드 단위 테스트 |

## 로컬에서 확인

루트에서 `npm run dev` 후 `http://localhost:3010/analysis/chi-square` 로 이동합니다. 백엔드 API(8010)가 떠 있어야 조회가 됩니다.

## 주의

- API 경로 `/api/analysis/chi-square/*` 는 `combination`·`recommend`에서도 사용합니다. URL을 바꾸지 마세요.
- `final-pick`은 `logic/chiSquare`, `logic/walkForwardStats`, `constants`를 import 합니다. 경로 변경 시 함께 맞춥니다.
