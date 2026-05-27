import { isWinningNumberRow } from '../../logic/numCounts';
import type { WinningNumberRow } from '../../types';

// 당첨 번호 행 배열 응답의 형태를 검증하고 안전한 값만 반환한다.

export const parseWinningNumberRowsResponse = (data: unknown, invalidMessage: string): WinningNumberRow[] => {
  if (!Array.isArray(data)) {
    throw new Error(invalidMessage);
  }
  return data.filter(isWinningNumberRow);
};
