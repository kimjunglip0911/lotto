/**
 * 로또 번호 한 세트의 일치 개수와 보너스 일치 여부를 받아 최종 등수를 정합니다.
 * 숫자 두 개만 입력받고(일치 개수, 보너스 일치 여부), 1~5등 중 하나 또는 낙첨(null)을 돌려줍니다.
 * 이 파일은 "등수 판정 규칙"만 담당하고, 세트 순회·집계 같은 일은 `rankSet.ts`에서 맡습니다.
 * 잘못된 입력(예: 3개 미만 일치)처럼 당첨 규칙을 만족하지 않으면 null을 돌려서
 * 화면 집계 단계에서 낙첨으로 처리할 수 있게 합니다.
 */

import type { Rank } from '../types/home';

export const getRank = (matchCount: number, isBonusMatched: boolean): Rank | null => {
  if (matchCount === 6) return 1;
  if (matchCount === 5) return isBonusMatched ? 2 : 3;
  if (matchCount === 4) return 4;
  if (matchCount === 3) return 5;
  return null;
};
