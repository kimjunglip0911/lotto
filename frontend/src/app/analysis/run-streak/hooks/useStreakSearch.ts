import { useState } from 'react';
import { fetchJson, runStreakUrl } from '../logic/api';
import { buildStreakResults } from '../logic/streak';
import { isWinningNumberRow, type StreakResult, type WinningNumberRow } from '../types';

// 조회 버튼을 누르면 선택한 회차의 당첨번호와 이전 회차들을 받아 와
// 번호별 연속 출현(본 6개) 결과를 만들어 화면에 넘겨 주는 코드입니다.

/** 1회차 단독 조회: 당첨번호만 받아오고 streak 결과는 비워 둔다. */
const fetchFirstDraw = async (drawNo: number): Promise<WinningNumberRow> => {
  const data = await fetchJson<unknown>(runStreakUrl(`winning-number?draw_no=${drawNo}`));
  if (!isWinningNumberRow(data)) throw new Error('Winning number response is invalid');
  return data;
};

/** 일반 회차 조회: 당첨번호 + 이전 회차 범위를 동시에 받아 온다. */
const fetchWithHistory = async (drawNo: number) => {
  const [winRes, rangeRes] = await Promise.all([
    fetch(runStreakUrl(`winning-number?draw_no=${drawNo}`)),
    fetch(runStreakUrl(`winning-numbers-range?draw_no=${drawNo}`)),
  ]);
  if (!winRes.ok) {
    if (winRes.status === 404) throw new Error('선택한 회차의 당첨번호를 찾을 수 없습니다.');
    throw new Error(`Failed to fetch winning number: ${winRes.status}`);
  }
  if (!rangeRes.ok) throw new Error(`Failed to fetch winning numbers range: ${rangeRes.status}`);
  const winning: unknown = await winRes.json();
  const range: unknown = await rangeRes.json();
  if (!isWinningNumberRow(winning)) throw new Error('Winning number response is invalid');
  if (!Array.isArray(range)) throw new Error('Winning numbers range response is not an array');
  return { winning, rows: range.filter(isWinningNumberRow) };
};

export const useStreakSearch = (selectedDraw: string) => {
  const [selectedWinningNumber, setSelectedWinningNumber] = useState<WinningNumberRow | null>(null);
  const [isLoadingWinningNumber, setIsLoadingWinningNumber] = useState(false);
  const [winningNumberError, setWinningNumberError] = useState<string | null>(null);
  const [searchedDraw, setSearchedDraw] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [analyzedDrawCount, setAnalyzedDrawCount] = useState(0);
  const [streakResults, setStreakResults] = useState<StreakResult[]>([]);

  const resetResults = () => {
    setAnalyzedDrawCount(0);
    setStreakResults([]);
    setSelectedWinningNumber(null);
    setWinningNumberError(null);
  };

  const handleSearch = async () => {
    if (!selectedDraw) return;
    const drawNo = Number(selectedDraw);
    if (!Number.isInteger(drawNo) || drawNo < 1) {
      setSearchError('유효한 회차를 선택해 주세요.');
      setSearchedDraw('');
      resetResults();
      return;
    }
    setIsSearching(true);
    setIsLoadingWinningNumber(true);
    setSearchError(null);
    setWinningNumberError(null);
    setSearchedDraw(selectedDraw);
    try {
      if (drawNo === 1) {
        const winning = await fetchFirstDraw(drawNo);
        resetResults();
        setSelectedWinningNumber(winning);
        return;
      }
      const { winning, rows } = await fetchWithHistory(drawNo);
      setSelectedWinningNumber(winning);
      setAnalyzedDrawCount(rows.length);
      setStreakResults(buildStreakResults(rows, drawNo));
    } catch (error) {
      console.error('Error fetching consecutive appearance data:', error);
      setSearchError('조회 데이터를 불러오지 못했습니다.');
      resetResults();
      setSearchedDraw('');
    } finally {
      setIsSearching(false);
      setIsLoadingWinningNumber(false);
    }
  };

  return { selectedWinningNumber, isLoadingWinningNumber, winningNumberError, searchedDraw, isSearching, searchError, analyzedDrawCount, streakResults, handleSearch };
};
