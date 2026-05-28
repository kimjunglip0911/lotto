/**
 * 홈 화면에서 10세트 묶음 PNG 다운로드 버튼의 상태를 다루는 훅입니다.
 *
 * 하는 일
 * - 각 10세트 영역의 캡처 대상(화면 조각)을 ref로 모아 둡니다.
 * - 다운로드 버튼을 누르면 그림 저장을 시도하고, 완료·실패 문구를 잠시 보여 줍니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: groupSize — 한 묶음에 들어가는 세트 수(보통 constants의 10)
 * - 돌려줌: pngDlState(어느 묶음이 성공/실패인지), grpCapRefs(캡처 영역 ref), runGrpPng(다운로드 실행)
 *
 * 역할 나눔
 * - 실제 그림 만들기·파일 저장: helpers/png/dlGroupPng.ts
 * - 세트 번호 범위 계산: logic/grpSetRange.ts
 * - 목록·버튼 화면: ui/list/SetList.tsx, SetGroup.tsx
 *
 * 실패·주의
 * - 저장에 실패하면 해당 묶음 버튼에 「다운로드 실패」가 DOWNLOAD_FEEDBACK_MS 동안 표시됩니다.
 * - 화면을 떠나기 전에 타이머를 정리해, 끝난 뒤 문구가 남지 않게 합니다.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { DOWNLOAD_FEEDBACK_MS } from '../constants/home';
import { dlGroupPng } from '../helpers/png/dlGroupPng';
import { grpSetRange } from '../logic/grpSetRange';
import type { LotterySetViewModel } from '../types/home';
import type { PngDlState } from '../types/png';

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

  const runGrpPng = useCallback(
    async (groupIndex: number, groupSets: LotterySetViewModel[]) => {
      const { start, end } = grpSetRange(groupIndex, groupSize, groupSets.length);
      const targetNode = grpCapRefs.current[groupIndex];
      const downloaded = await dlGroupPng(targetNode, start, end);
      setPngDlState({ groupIndex, status: downloaded ? 'success' : 'error' });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setPngDlState((prev) => (prev?.groupIndex === groupIndex ? null : prev));
      }, DOWNLOAD_FEEDBACK_MS);
    },
    [groupSize],
  );

  return { pngDlState, grpCapRefs, runGrpPng };
};
