import { useEffect, useMemo, useState } from 'react';
import { buildStreakResults, getAverageStreak, getTop5PctThreshold } from '../logic/streak';
import { isWinningNumberRow, type StreakResult, type WinningNumberRow } from '../types';

/** `/api/analysis/absence-streak/` 이하 경로·쿼리(예: `draw-numbers`, `winning-number?draw_no=1`) */
const absenceStreakApiUrl = (pathWithQuery: string): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return `${apiUrl}/api/analysis/absence-streak/${pathWithQuery}`;
};

type UseAbsenceStreakDataResult = {
  availableDraws: number[];
  selectedDraw: string;
  setSelectedDraw: (draw: string) => void;
  isLoadingDraws: boolean;
  drawLoadError: string | null;
  selectedWinningNumber: WinningNumberRow | null;
  isLoadingWinningNumber: boolean;
  winningNumberError: string | null;
  searchedDraw: string;
  isSearching: boolean;
  searchError: string | null;
  analyzedDrawCount: number;
  streakResults: StreakResult[];
  averageStreak: number;
  top5PctThreshold: number;
  handleSearch: () => Promise<void>;
};

export const useAbsenceStreakData = (): UseAbsenceStreakDataResult => {
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<string>('');
  const [isLoadingDraws, setIsLoadingDraws] = useState(true);
  const [drawLoadError, setDrawLoadError] = useState<string | null>(null);

  const [selectedWinningNumber, setSelectedWinningNumber] = useState<WinningNumberRow | null>(null);
  const [isLoadingWinningNumber, setIsLoadingWinningNumber] = useState(false);
  const [winningNumberError, setWinningNumberError] = useState<string | null>(null);

  const [searchedDraw, setSearchedDraw] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [analyzedDrawCount, setAnalyzedDrawCount] = useState(0);
  const [streakResults, setStreakResults] = useState<StreakResult[]>([]);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadDrawNumbers = async () => {
      setIsLoadingDraws(true);
      setDrawLoadError(null);
      try {
        const response = await fetch(absenceStreakApiUrl('draw-numbers'), {
          signal: abortController.signal,
        });
        if (!response.ok) throw new Error(`Failed to fetch draw numbers: ${response.status}`);
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error('Draw numbers response is not an array');
        const draws = data.filter((item): item is number => typeof item === 'number');
        if (!isMounted) return;
        setAvailableDraws(draws);
        setSelectedDraw((prev) => (prev || draws.length === 0 ? prev : String(draws[0])));
      } catch (error) {
        if (abortController.signal.aborted || !isMounted) return;
        console.error('Error fetching draw numbers:', error);
        setAvailableDraws([]);
        setSelectedDraw('');
        setDrawLoadError('회차 정보를 불러오지 못했습니다.');
      } finally {
        if (isMounted) setIsLoadingDraws(false);
      }
    };

    void loadDrawNumbers();
    return () => {
      isMounted = false;
    };
  }, []);

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
        const res = await fetch(absenceStreakApiUrl(`winning-number?draw_no=${drawNo}`));
        if (!res.ok) throw new Error(`Failed to fetch winning number: ${res.status}`);
        const data: unknown = await res.json();
        if (!isWinningNumberRow(data)) throw new Error('Winning number response is invalid');
        setSelectedWinningNumber(data);
        resetResults();
        setAnalyzedDrawCount(0);
        return;
      }

      const [winningNumberRes, rangeRes] = await Promise.all([
        fetch(absenceStreakApiUrl(`winning-number?draw_no=${drawNo}`)),
        fetch(absenceStreakApiUrl(`winning-numbers-range?draw_no=${drawNo}`)),
      ]);

      if (!winningNumberRes.ok) {
        if (winningNumberRes.status === 404) throw new Error('선택한 회차의 당첨번호를 찾을 수 없습니다.');
        throw new Error(`Failed to fetch winning number: ${winningNumberRes.status}`);
      }
      if (!rangeRes.ok) throw new Error(`Failed to fetch winning numbers range: ${rangeRes.status}`);

      const winningData: unknown = await winningNumberRes.json();
      const rangeData: unknown = await rangeRes.json();

      if (!isWinningNumberRow(winningData)) throw new Error('Winning number response is invalid');
      if (!Array.isArray(rangeData)) throw new Error('Winning numbers range response is not an array');

      const rows = rangeData.filter(isWinningNumberRow);
      setSelectedWinningNumber(winningData);
      setAnalyzedDrawCount(rows.length);
      setStreakResults(buildStreakResults(rows, drawNo));
    } catch (error) {
      console.error('Error fetching absence streak data:', error);
      setSearchError('조회 데이터를 불러오지 못했습니다.');
      resetResults();
      setSearchedDraw('');
    } finally {
      setIsSearching(false);
      setIsLoadingWinningNumber(false);
    }
  };

  const averageStreak = useMemo(() => getAverageStreak(streakResults), [streakResults]);
  const top5PctThreshold = useMemo(() => getTop5PctThreshold(streakResults), [streakResults]);

  return {
    availableDraws,
    selectedDraw,
    setSelectedDraw,
    isLoadingDraws,
    drawLoadError,
    selectedWinningNumber,
    isLoadingWinningNumber,
    winningNumberError,
    searchedDraw,
    isSearching,
    searchError,
    analyzedDrawCount,
    streakResults,
    averageStreak,
    top5PctThreshold,
    handleSearch,
  };
};
