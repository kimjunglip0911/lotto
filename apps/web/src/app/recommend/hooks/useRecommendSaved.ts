'use client';

import { useEffect } from 'react';
import { fetchSavedRecommendData } from '@/app/recommend/api/recommend/saved';
import { fetchFinalPickAdopted } from '@/app/recommend/logic/adopt/computeAdopted';
import { orderSetsByProfileSlots, TARGET_SET_COUNT } from '@/app/recommend/logic/combo';
import type { GeneratedSet } from '@/app/recommend/types/generatedSet';

type SavedState = {
  statusMessage: string | null;
  setStatusMessage: (v: string | null) => void;
  error: string | null;
  setError: (v: string | null) => void;
  setGeneratedSets: (v: GeneratedSet[]) => void;
  setWinningNumbers: (v: number[] | null) => void;
  setAdoptedNumbers: (v: number[]) => void;
  setCombinationSummaryLines: (v: string[]) => void;
};

/** 선택 회차의 저장 세트·채택 번호 로드 */

export const useRecommendSaved = (
  apiUrl: string,
  selectedDraw: number | null,
  isLoadingDraws: boolean,
  state: SavedState,
) => {
  const {
    setStatusMessage,
    setError,
    setGeneratedSets,
    setWinningNumbers,
    setAdoptedNumbers,
    setCombinationSummaryLines,
  } = state;

  useEffect(() => {
    if (!selectedDraw || isLoadingDraws) return;
    let isMounted = true;

    const load = async () => {
      setGeneratedSets([]);
      setWinningNumbers(null);
      setAdoptedNumbers([]);
      setCombinationSummaryLines([]);
      setError(null);
      setStatusMessage(`${selectedDraw}회차 저장된 추천 세트를 불러오는 중입니다...`);

      try {
        const saved = await fetchSavedRecommendData(apiUrl, selectedDraw);
        const adoptedRes = await fetchFinalPickAdopted(apiUrl, selectedDraw);
        if (!isMounted) return;

        const adopted = adoptedRes.error ? [] : adoptedRes.adopted;
        setWinningNumbers(saved.winningNumbers);
        setAdoptedNumbers(adopted);
        setGeneratedSets(orderSetsByProfileSlots(saved.sets));
        setCombinationSummaryLines(adoptedRes.infoMessage ? [adoptedRes.infoMessage] : []);
        setStatusMessage(
          saved.sets.length > 0
            ? `${selectedDraw}회차 기준 저장된 ${saved.sets.length}개 추천 세트를 불러왔습니다.`
            : `${selectedDraw}회차 기준 저장된 추천 세트가 없습니다. 생성 및 저장을 실행해 보세요.`,
        );
      } catch (err) {
        if (!isMounted) return;
        setGeneratedSets([]);
        setAdoptedNumbers([]);
        setCombinationSummaryLines([]);
        setStatusMessage(`${selectedDraw}회차 세트 조회 중 오류가 발생했습니다.`);
        console.error('Error fetching saved drawings:', err);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [
    apiUrl,
    isLoadingDraws,
    selectedDraw,
    setAdoptedNumbers,
    setCombinationSummaryLines,
    setError,
    setGeneratedSets,
    setStatusMessage,
    setWinningNumbers,
  ]);
};

export const initialStatusMessage = () =>
  `생성 및 저장을 실행하면 통합 채택·조합 분석 기준으로 ${TARGET_SET_COUNT}세트를 만듭니다.`;
