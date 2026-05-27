import { isWinningNumberRow, type WinningNumberRow } from '../../types/winRow';
import { finalPickApiUrl } from '../core/url';

export type WinSearchResult =
  | { kind: 'draw1'; winningNumber: WinningNumberRow }
  | { kind: 'range'; winningNumber: WinningNumberRow | null; previousDrawRows: WinningNumberRow[]; winningNumberError: string | null };

/** 1회차: 당첨 단건만. 2회차 이상: 범위 + 당첨(404 시 미추첨 처리). */
export const fetchFinalPickWinSearch = async (drawNo: number): Promise<WinSearchResult> => {
  if (drawNo === 1) {
    const response = await fetch(finalPickApiUrl(`winning-number?draw_no=${drawNo}`));
    if (!response.ok) {
      if (response.status === 404) throw new Error('선택한 회차의 당첨번호를 찾을 수 없습니다.');
      throw new Error(`Failed to fetch winning number: ${response.status}`);
    }
    const data: unknown = await response.json();
    if (!isWinningNumberRow(data)) throw new Error('Winning number response is invalid');
    return { kind: 'draw1', winningNumber: data };
  }

  const [winningNumberRes, rangeRes] = await Promise.all([
    fetch(finalPickApiUrl(`winning-number?draw_no=${drawNo}`)),
    fetch(finalPickApiUrl(`winning-numbers-range?draw_no=${drawNo}`)),
  ]);

  if (!rangeRes.ok) throw new Error(`Failed to fetch winning numbers range: ${rangeRes.status}`);
  const rangeData: unknown = await rangeRes.json();
  if (!Array.isArray(rangeData)) throw new Error('Winning numbers range response is not an array');
  const previousDrawRows = rangeData.filter(isWinningNumberRow);

  if (winningNumberRes.ok) {
    const winningData: unknown = await winningNumberRes.json();
    if (!isWinningNumberRow(winningData)) throw new Error('Winning number response is invalid');
    return { kind: 'range', winningNumber: winningData, previousDrawRows, winningNumberError: null };
  }
  if (winningNumberRes.status === 404) {
    return {
      kind: 'range',
      winningNumber: null,
      previousDrawRows,
      winningNumberError: '해당 회차는 아직 당첨번호가 확정되지 않았습니다.',
    };
  }
  throw new Error(`Failed to fetch winning number: ${winningNumberRes.status}`);
};
