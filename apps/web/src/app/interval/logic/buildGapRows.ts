/**
 * 번호별 간격 표에 들어갈 계산 결과를 만드는 파일입니다.
 *
 * 하는 일
 * - 당첨 이력을 회차 순서로 정리한 뒤 1~45번 각각이 언제 나왔는지 찾습니다.
 * - 바로 이어서 나온 번호는 하나의 묶음으로 보고, 묶음의 마지막 회차부터 다음 출현까지의 간격만 계산합니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 저장된 당첨 이력 목록
 * - 돌려줌: 번호별 출현 회차, 계산 간격, 평균·최대 간격
 *
 * 역할 나눔
 * - 화면 표시: `ui/table` 파일들이 담당합니다.
 * - 데이터 불러오기: `api/loadHistory.ts`가 담당합니다.
 */

import type { WinningNumberRow } from '@/lib/accu-nums/types';
import { LOTTO_NUMBERS } from '../constants/lotto';
import type { GapRow } from '../types/interval';
import { avgGap, buildGaps, toMainNumbersOnly } from './gapParts';

const collectDraws = (rows: readonly WinningNumberRow[]): number[][] => {
  const buckets = Array.from({ length: LOTTO_NUMBERS.length + 1 }, () => [] as number[]);
  for (const row of rows) {
    for (const number of toMainNumbersOnly(row)) {
      if (number >= 1 && number <= LOTTO_NUMBERS.length) buckets[number].push(row.draw_no);
    }
  }
  return buckets;
};

export const buildGapRows = (rows: readonly WinningNumberRow[]): GapRow[] => {
  const sorted = [...rows].sort((a, b) => a.draw_no - b.draw_no);
  const drawsByNumber = collectDraws(sorted);
  return LOTTO_NUMBERS.map((number) => {
    const draws = drawsByNumber[number];
    const gaps = buildGaps(draws);
    return {
      number,
      draws,
      gaps,
      avgGap: avgGap(gaps),
      maxGap: gaps.length === 0 ? null : Math.max(...gaps),
    };
  });
};
