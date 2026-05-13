# 누적 번호 분석 (accu-nums)

## 목적

선택한 회차 **직전까지** 저장된 당첨번호로 번호별 누적 출현 횟수를 보여 주고, 직전 104회(2년)·전체 구간 차트, 누적 출현 극값 제외, 평균근접으로 고른 최종 4개를 함께 확인합니다.

## 주요 파일

| 경로 | 역할 |
|:---|:---|
| `page.tsx` | 레이아웃·`Header`/`Sidebar`·`useAccData`/`useAccView`·`AccuMain` 조립 |
| `components/AccuMain.tsx` | 본문 `<main>` 안 섹션 순서 조립 |
| `components/AccStratPick.tsx` | 전략별 평균근접 번호 카드 한 장 |
| `components/AccSearchBlock.tsx` | 회차 검색 패널·상태 안내 |
| `hooks/useAccData.ts` | API·검색 세션·집계 상태 |
| `hooks/useAccView.ts` | 안내 문구·차트용 파생값·스냅샷 저장 가능 여부 등 |
| `api/` | 백엔드 API 호출(URL 빌더·레거시 폴백·응답 파서·엔드포인트 5종) 분할. 외부 진입점은 `api/index.ts` |
| `types.ts` | 누적 번호 분석 타입 공개 진입점 |
| `types/` | API 행·윈도우·전략·집계·스냅샷 스키마 타입 |
| `test/` | 극값 제외·전략 선정 단위 테스트 |

## 로컬에서 확인

루트에서 `npm run dev` 후 브라우저에서 `http://localhost:3010/analysis/accu-nums` 로 이동합니다. 백엔드 API가 떠 있어야 조회가 됩니다.

## 주의

- 스냅샷 저장은 조회가 끝나고 오류가 없으며, 평균근접 **최종 4개**가 계산된 경우에만 버튼이 활성화됩니다.
