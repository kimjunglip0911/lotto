import { isWinningNumberRow } from '../../logic/numCounts';
import type { WinningNumberRow } from '../../types';

// 단일 당첨 번호 행 응답의 형태를 검증하고 안전한 값만 반환한다.

export const parseWinningNumberRowResponse = (data: unknown, invalidMessage: string): WinningNumberRow => {
  if (!isWinningNumberRow(data)) {
    throw new Error(invalidMessage);
  }
  return data;
};
