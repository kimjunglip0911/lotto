# 균등 분석 (equal)

## 목적

최근 6회차 당첨 번호(보너스 포함)의 출현 횟수를 집계해 **0회 / 1회 / 2회 / 3회 이상** 네 그룹으로 보여 줍니다. 원본 회차 목록은 표시하지 않습니다.

## 주요 파일

| 경로 | 역할 |
|:---|:---|
| `page.tsx` | Header·Sidebar·`useEqualData`·`EqualMain` 조립 |
| `ui/EqualMain.tsx` | 로딩·오류·네 버킷 섹션 |
| `ui/BucketSection.tsx` | 그룹 제목·개수·`LotteryBall` 나열 |
| `hooks/useEqualData.ts` | 이력 로드 → 최근 6회 슬라이스 → 버킷 |
| `api/loadHistory.ts` | accu-nums draw·winning-range 조회 |
| `logic/countWithBonus.ts` | 주6+보너스 출현 카운트 |
| `logic/buildBuckets.ts` | 0·1·2·3+ 버킷 분할 |
| `constants/window.ts` | `EQUAL_WINDOW = 6` |
| `tests/buildBuckets.test.ts` | 보너스 포함·3+ 합침·전수 검증 |
| `tests/equalWindow.test.ts` | 최근 6회 슬라이스 반영 |

## 로컬에서 확인

루트 `run.bat` 또는 `cd apps/web && npm run dev` 후 사이드바 **균등 분석** 또는 `http://localhost:1060/equal`. `DATABASE_URL` 필요.

## 주의

- 표본은 **최근 6회차**이며 이력이 더 적으면 있는 회차만 사용합니다.
- 보너스 번호를 출현에 포함합니다. `lib/accu-nums`의 보너스 제외 카운터를 쓰지 않습니다.
- 3회·4회… 출현은 **3회 이상** 한 그룹으로 합칩니다.
