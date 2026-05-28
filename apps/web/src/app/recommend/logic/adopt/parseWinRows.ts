import {
  extractMainNumbers,
  isWinningNumberRow,
  type WinningNumberRow,
} from '@/app/analysis/final-pick/types/winRow';

/** 단건 당첨 JSON을 검증해 본번호 6개를 반환한다 */

export const parseWinRow = (
  data: unknown,
): { row: WinningNumberRow; main: number[] } | { error: string } => {
  if (!isWinningNumberRow(data)) {
    return { error: '당첨번호 응답 형식이 올바르지 않습니다.' };
  }
  return { row: data, main: extractMainNumbers(data) };
};

/** 범위 당첨 JSON을 검증해 이전 회차 행 목록을 반환한다 */

export const parseWinRange = (
  data: unknown,
): { previousDrawRows: WinningNumberRow[] } | { error: string } => {
  if (!Array.isArray(data)) {
    return { error: '당첨 이력 응답 형식이 올바르지 않습니다.' };
  }
  return { previousDrawRows: data.filter(isWinningNumberRow) };
};
