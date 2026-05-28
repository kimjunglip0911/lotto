/**
 * 사용자가 고른 회차의 분석 세트와 당첨번호를 불러옵니다.
 *
 * 하는 일
 * - 선택된 회차가 바뀔 때마다 그 회차의 추천 번호 세트와 저장된 당첨번호를 함께 요청합니다.
 * - 회차가 아직 정해지지 않았으면 아무 것도 요청하지 않습니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: `selectedDraw`(현재 선택 회차, 없으면 null)
 * - 돌려줌: `sets`(분석 세트 목록, 없으면 빈 배열), `winningByDraw`(당첨번호, 없으면 null)
 *
 * 역할 나눔
 * - 세트·당첨을 한꺼번에 가져오기: `helpers/fetchBundle.ts`
 * - 회차 목록·선택: `hooks/useDrawList.ts`
 * - 화면용으로 묶기: `hooks/useGridData.ts`
 *
 * 실패·주의
 * - 불러오기에 실패하면 콘솔에 오류가 남고, 당첨번호는 비웁니다(입력란은 빈 값으로 맞춰짐).
 * - 분석 세트가 없는 회차는 `sets`가 빈 배열이며, 화면에 빈 상태 안내가 나올 수 있습니다.
 */

import { useEffect, useState } from 'react';

import { fetchDrawBundle } from '../helpers/fetchBundle';
import type { LotterySetData, WinningNumbersByDraw } from '../types/home';

export const useDrawBundle = (selectedDraw: number | null) => {
  const [sets, setSets] = useState<LotterySetData[]>([]);
  const [winningByDraw, setWinningByDraw] = useState<WinningNumbersByDraw | null>(null);

  useEffect(() => {
    if (selectedDraw === null) return;
    let cancelled = false;
    void fetchDrawBundle(selectedDraw)
      .then(({ sets: nextSets, winning }) => {
        if (cancelled) return;
        setSets(nextSets);
        setWinningByDraw(winning);
      })
      .catch((error) => {
        console.error('Error loading draw data:', error);
        if (!cancelled) setWinningByDraw(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDraw]);

  return { sets, winningByDraw };
};
