# 균등 분석 (equal)

## 목적

최근 6회차 당첨 번호(보너스 포함)의 출현 횟수를 집계해 **0회 / 1회 / 2회 / 3회 이상** 네 그룹으로 보여 줍니다.  
페이지 최상단에 **제외 번호**(2회 이상 ∪ 직전 회차 본6+보너스, 중복 제거)를 표시하며, 이 목록은 추천 생성 풀에서도 동일하게 빠집니다.

## 주요 파일

| 경로 | 역할 |
|:---|:---|
| `page.tsx` | Header·Sidebar·`useEqualData`·`EqualMain` 조립 |
| `ui/EqualMain.tsx` | 제외번호 → 네 버킷 |
| `ui/BucketSection.tsx` | 그룹 제목·개수·`LotteryBall` 나열 |
| `hooks/useEqualData.ts` | 이력 로드 → 6회 슬라이스 → 버킷·제외 |
| `api/loadHistory.ts` | accu-nums draw·winning-range 조회 |
| `logic/countWithBonus.ts` | 주6+보너스 출현 카운트 |
| `logic/buildBuckets.ts` | 0·1·2·3+ 버킷 분할 |
| `logic/freqGeTwo.ts` | 2회 이상 번호 |
| `logic/buildExclude.ts` | 제외 집합(추천 `buildGenArgs`와 공유) |
| `constants/window.ts` | `EQUAL_WINDOW = 6` |
| `tests/` | 버킷·창·제외 단위 테스트 |

## 로컬에서 확인

루트 `run.bat` 또는 `cd apps/web && npm run dev` 후 사이드바 **균등 분석** 또는 `http://localhost:1060/equal`. `DATABASE_URL` 필요.

## 주의

- 표본은 **최근 6회차**이며 이력이 더 적으면 있는 회차만 사용합니다.
- 보너스 번호를 출현·제외에 포함합니다.
- 3회·4회… 출현은 **3회 이상** 한 그룹으로 합칩니다.
- **제외 번호** = (6회 창에서 2회 이상) ∪ (최신 회차 7개). 추천 세트의 `numberPool`에서 제거됩니다.
- 추천 **RANK18부터 20**은 이 페이지의 **0회** 번호를 씁니다(18=간격, 19부터 20=조합). leftover **RANK21부터 30**은 0회 풀이 아니라, 조합분석에서 안 쓴 8등부터 17등 자리대를 씁니다.
