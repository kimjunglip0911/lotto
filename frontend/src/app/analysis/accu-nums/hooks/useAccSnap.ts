/** 평균근접 4개가 나온 뒤 서버에 스냅샷을 남길 때 쓰는 로딩·메시지 상태다. */

import { useCallback, useState } from 'react';

import { saveAccumulatedNumbersSnapshot } from '../api';
import { parseSelDraw } from '../logic/parseSelDraw';
import type { FinalNumberPlan } from '../types';

type Opts = { searchedDraw: string; finalNumberPlan: FinalNumberPlan | null };

export const useAccSnap = ({ searchedDraw, finalNumberPlan }: Opts) => {
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);
  const [saveSnapshotMessage, setSaveSnapshotMessage] = useState<string | null>(null);
  const [saveSnapshotError, setSaveSnapshotError] = useState<string | null>(null);

  const clearSnapMsgs = useCallback(() => {
    setSaveSnapshotMessage(null);
    setSaveSnapshotError(null);
  }, []);

  const saveAccumulatedSnapshot = useCallback(async () => {
    setSaveSnapshotMessage(null);
    setSaveSnapshotError(null);
    const anchor = parseSelDraw(searchedDraw);
    if (anchor === null || anchor <= 1) {
      setSaveSnapshotError('회차 2 이상 조회 후에만 저장할 수 있습니다.');
      return;
    }

    if (!finalNumberPlan || finalNumberPlan.finalNumbers.length !== 4) {
      setSaveSnapshotError('최종 채택 4개 번호가 계산된 뒤에만 저장할 수 있습니다.');
      return;
    }

    setIsSavingSnapshot(true);
    try {
      const quad = finalNumberPlan.finalNumbers as [number, number, number, number];
      const res = await saveAccumulatedNumbersSnapshot(anchor, quad);
      setSaveSnapshotMessage(res.message);
    } catch (error) {
      console.error('Error saving accumulated snapshot:', error);
      setSaveSnapshotError(error instanceof Error ? error.message : '저장에 실패했습니다.');
    } finally {
      setIsSavingSnapshot(false);
    }
  }, [searchedDraw, finalNumberPlan]);

  return {
    isSavingSnapshot,
    saveSnapshotMessage,
    saveSnapshotError,
    saveAccumulatedSnapshot,
    clearSnapMsgs,
  };
};
