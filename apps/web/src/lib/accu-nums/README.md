# 누적 번호 데이터 모듈 (accu-nums)

## 목적

당첨번호 조회·파싱·검증 로직을 **공유 라이브러리**로 제공합니다. 전용 화면은 없으며, `combination`·`recommend`가 Nest API와 이 모듈을 통해 당첨 이력을 사용합니다.

## 주요 파일

| 경로 | 역할 |
|:---|:---|
| `api/` | 백엔드 API 클라이언트(`draw-numbers`, `winning-numbers-range` 등) |
| `types/` | `WinningNumberRow` 등 공유 타입 |
| `logic/numCounts.ts` | 행 검증·누적 집계 순수 함수 |
| `constants/` | 번호 범위 상수 |

## Nest API

- `/api/analysis/accu-nums/draw-numbers`
- `/api/analysis/accu-nums/winning-numbers-range`
- 상세: `apps/api/src/analysis/accu-nums/README.md`

## 주의

- API·타입·파서 변경 시 `combination`·`recommend` 회귀를 함께 확인합니다.
