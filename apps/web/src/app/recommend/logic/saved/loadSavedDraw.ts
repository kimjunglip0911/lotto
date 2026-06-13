import { fetchSavedRecommendData } from '@/app/recommend/api/recommend/saved';
import { orderSetsByProfileSlots } from '@/app/recommend/logic/combo';
import {
  savedEmptyMessage,
  savedSuccessMessage,
} from '@/app/recommend/helpers/savedMessages';
import type { SavedDrawLoadResult } from '@/app/recommend/types/savedLoad';

/** 선택 회차 저장 세트를 조회해 화면용 결과로 조립한다 */

export const loadSavedRecommendDraw = async (
  apiUrl: string,
  drawNo: number,
): Promise<SavedDrawLoadResult> => {
  const saved = await fetchSavedRecommendData(apiUrl, drawNo);
  const orderedSets = orderSetsByProfileSlots(saved.sets);
  const statusMessage =
    saved.sets.length > 0
      ? savedSuccessMessage(drawNo, saved.sets.length)
      : savedEmptyMessage(drawNo);

  return {
    winningNumbers: saved.winningNumbers,
    orderedSets,
    summaryLines: [],
    statusMessage,
  };
};
