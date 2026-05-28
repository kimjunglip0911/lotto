/** 10세트 PNG 다운로드 버튼 피드백 상태를 관리한다 */

import { useCallback, useRef, useState } from 'react';

import { DOWNLOAD_FEEDBACK_MS } from '../constants/home';
import { dlGroupPng } from '../helpers/png/dlGroupPng';
import type { LotterySetViewModel } from '../types/home';

type DlStatus = 'success' | 'error';

export const useGroupDl = (groupSize: number) => {
  const [downloadState, setDownloadState] = useState<{ groupIndex: number; status: DlStatus } | null>(
    null,
  );
  const groupCaptureRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleDownloadGroup = useCallback(
    async (groupIndex: number, groupSets: LotterySetViewModel[]) => {
      const startSetNo = groupIndex * groupSize + 1;
      const endSetNo = startSetNo + groupSets.length - 1;
      const targetNode = groupCaptureRefs.current[groupIndex];
      const downloaded = await dlGroupPng(targetNode, startSetNo, endSetNo);
      setDownloadState({ groupIndex, status: downloaded ? 'success' : 'error' });
      setTimeout(() => {
        setDownloadState((prev) => (prev?.groupIndex === groupIndex ? null : prev));
      }, DOWNLOAD_FEEDBACK_MS);
    },
    [groupSize],
  );

  return { downloadState, groupCaptureRefs, handleDownloadGroup };
};
