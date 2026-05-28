/**
 * 홈 화면에서 선택할 수 있는 회차 목록과 현재 선택된 회차를 관리합니다.
 *
 * 하는 일
 * - 화면이 처음 열릴 때 서버에서 회차 번호 목록을 한 번 불러옵니다.
 * - 목록이 있으면 드롭다운에 쓸 목록을 채우고, 아직 고른 회차가 없으면 첫 회차를 자동으로 선택합니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 없음
 * - 돌려줌: `availableDraws`(회차 번호 배열), `selectedDraw`(현재 선택 회차 또는 아직 없음), `setSelectedDraw`(회차 변경 함수)
 *
 * 역할 나눔
 * - 실제 목록 조회: `helpers/fetchDraws.ts`
 * - 여러 훅을 묶어 화면에 넘김: `hooks/useGridData.ts`
 *
 * 실패·주의
 * - 목록을 못 가져오면 콘솔에 오류가 남고, 회차 목록은 비어 있으며 선택 회차도 정해지지 않습니다.
 * - 목록이 비어 있으면 선택 회차를 바꾸지 않습니다.
 */

import { useEffect, useState } from 'react';

import { fetchDraws } from '../helpers/fetchDraws';

export const useDrawList = () => {
  const [availableDraws, setAvailableDraws] = useState<number[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchDraws()
      .then((draws) => {
        if (cancelled || draws.length === 0) return;
        setAvailableDraws(draws);
        setSelectedDraw((prev) => prev ?? draws[0]);
      })
      .catch((error) => console.error('Error fetching draw numbers:', error));
    return () => {
      cancelled = true;
    };
  }, []);

  return { availableDraws, selectedDraw, setSelectedDraw };
};
