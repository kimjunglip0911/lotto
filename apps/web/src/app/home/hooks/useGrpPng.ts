import { useCallback, useEffect, useRef, useState } from 'react';

import { DOWNLOAD_FEEDBACK_MS } from '../constants/home';
import { dlGroupPng } from '../helpers/png/dlGroupPng';
import { grpSetRange } from '../logic/grpSetRange';
import type { LotterySetViewModel } from '../types/home';
import type { PngDlState } from '../types/png';

/** 10세트 PNG 캡처 ref·다운로드 상태 */

export const useGrpPng = (groupSize: number) => {
  const [pngDlState, setPngDlState] = useState<PngDlState>(null);
  const grpCapRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const bindCap = useCallback(
    (groupIndex: number) => (node: HTMLDivElement | null) => {
      grpCapRefs.current[groupIndex] = node;
    },
    [],
  );

  const runGrpPng = useCallback(
    async (groupIndex: number, groupSets: LotterySetViewModel[]) => {
      const { start, end } = grpSetRange(groupIndex, groupSize, groupSets.length);
      const downloaded = await dlGroupPng(grpCapRefs.current[groupIndex], start, end);
      setPngDlState({ groupIndex, status: downloaded ? 'success' : 'error' });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setPngDlState((prev) => (prev?.groupIndex === groupIndex ? null : prev));
      }, DOWNLOAD_FEEDBACK_MS);
    },
    [groupSize],
  );

  return { pngDlState, bindCap, runGrpPng };
};
