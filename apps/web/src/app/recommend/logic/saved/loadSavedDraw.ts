import { fetchSavedRecommendData } from '@/app/recommend/api/recommend/saved';
import { fetchFinalPickAdopted } from '@/app/recommend/logic/adopt/computeAdopted';
import { orderSetsByProfileSlots } from '@/app/recommend/logic/combo';
import {
  savedEmptyMessage,
  savedSuccessMessage,
} from '@/app/recommend/helpers/savedMessages';
import type { SavedDrawLoadResult } from '@/app/recommend/types/savedLoad';

/** 선택 회차 저장 세트·채택 번호를 병렬 조회해 화면용 결과로 조립한다 */

export const loadSavedRecommendDraw = async (
  apiUrl: string,
  drawNo: number,
): Promise<SavedDrawLoadResult> => {
  const [saved, adoptedRes] = await Promise.all([
    fetchSavedRecommendData(apiUrl, drawNo),
    fetchFinalPickAdopted(apiUrl, drawNo),
  ]);

  const adopted = adoptedRes.error ? [] : adoptedRes.adopted;
  const summaryLines = adoptedRes.infoMessage ? [adoptedRes.infoMessage] : [];
  const orderedSets = orderSetsByProfileSlots(saved.sets);
  const statusMessage =
    saved.sets.length > 0
      ? savedSuccessMessage(drawNo, saved.sets.length)
      : savedEmptyMessage(drawNo);

  return {
    winningNumbers: saved.winningNumbers,
    adopted,
    orderedSets,
    summaryLines,
    statusMessage,
  };
};
