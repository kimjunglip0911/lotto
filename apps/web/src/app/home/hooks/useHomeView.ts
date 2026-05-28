/**
 * 홈(로또 그리드) 화면에 필요한 데이터·입력·저장을 한곳에서 묶어 돌려주는 훅입니다.
 *
 * 하는 일
 * - 회차 목록·선택, 분석 세트, 당첨번호 입력, 저장 상태를 하위 훅에서 모아 화면에 넘깁니다.
 * - 카드·통계·목록에 맞게 세트 목록을 표시용 형태(`displaySets`)로 바꿉니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 없음
 * - 돌려줌: 당첨 입력(`winningNumbers`, `winningBonus`, `onWinNumChg`, `onBonusChg`),
 *   회차(`availableDraws`, `selectedDraw`, `setSelectedDraw`),
 *   저장(`isSaving`, `saveStatus`, `saveWinning`),
 *   표시용 세트(`displaySets`)
 *
 * 역할 나눔
 * - 회차·세트·당첨 조회: `hooks/useGridData.ts`
 * - 당첨 입력: `hooks/useWinInput.ts`
 * - 저장: `hooks/useSaveWinning.ts`
 * - 세트 표시 변환: `logic/toSetVm.ts`
 * - 화면 배치: `ui/HomeMain.tsx`
 *
 * 실패·주의
 * - 회차 미선택 시 저장 버튼 동작은 `useSaveWinning`에서 막습니다.
 * - 회차를 바꾸면 당첨 입력 칸과 저장 안내 문구가 각각 하위 훅에서 맞춰집니다.
 */

import { useMemo } from 'react';

import { toSetVm } from '../logic/toSetVm';
import { useGridData } from './useGridData';
import { useSaveWinning } from './useSaveWinning';
import { useWinInput } from './useWinInput';

export const useHomeView = () => {
  const { sets, winningByDraw, availableDraws, selectedDraw, setSelectedDraw } = useGridData();
  const { winningNumbers, winningBonus, onWinNumChg, onBonusChg } = useWinInput(winningByDraw);
  const { isSaving, saveStatus, saveWinning } = useSaveWinning({
    selectedDraw,
    winningNumbers,
    winningBonus,
  });

  const displaySets = useMemo(() => toSetVm(sets, selectedDraw), [selectedDraw, sets]);

  return {
    winningNumbers,
    winningBonus,
    onWinNumChg,
    onBonusChg,
    availableDraws,
    selectedDraw,
    setSelectedDraw,
    isSaving,
    saveStatus,
    saveWinning,
    displaySets,
  };
};

export type HomeView = ReturnType<typeof useHomeView>;
