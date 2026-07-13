# 누적 번호 데이터 모듈 (accu-nums)

## 목적

당첨번호 조회·파싱·검증 로직을 **공유 라이브러리**로 제공합니다. `combination`·`recommend`가 같은 오리진 `/api`와 이 모듈을 통해 당첨 이력을 사용합니다.

## 주요 파일

| 경로 | 역할 |
|:---|:---|
| `api/` | `/api/analysis/accu-nums/*` 클라이언트 |
| `types/` | `WinningNumberRow` 등 공유 타입 |
| `logic/numCounts.ts` | 행 검증·누적 집계 순수 함수 |
| `constants/` | 번호 범위 상수 |

## API

- `/api/analysis/accu-nums/draw-numbers`
- `/api/analysis/accu-nums/winning-numbers-range`
- 서버 구현: `apps/web/src/server/analysis/accu-nums/`

## 주의

- API·타입·파서 변경 시 `combination`·`recommend` 회귀를 함께 확인합니다.
