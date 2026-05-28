/**
 * 홈 그리드에 필요한 회차·세트·당첨 데이터를 한곳에서 모아 돌려줍니다.
 *
 * 하는 일
 * - 회차 목록과 선택 회차는 `useDrawList`가, 선택 회차의 세트·당첨은 `useDrawBundle`이 담당합니다.
 * - 이 파일은 두 훅 결과를 합쳐 `useHomeView` 등 상위에서 쓰기 쉽게 만듭니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 없음
 * - 돌려줌: `sets`, `winningByDraw`, `availableDraws`, `selectedDraw`, `setSelectedDraw`
 *
 * 역할 나눔
 * - 회차 목록·선택: `hooks/useDrawList.ts`
 * - 회차별 세트·당첨: `hooks/useDrawBundle.ts`
 * - 입력·저장·화면 조합: `hooks/useHomeView.ts`
 *
 * 실패·주의
 * - 각 하위 훅의 실패 처리와 동일합니다(목록 실패 시 회차 미선택, 세트·당첨 실패 시 당첨 비움).
 */

import { useDrawBundle } from './useDrawBundle';
import { useDrawList } from './useDrawList';

export const useGridData = () => {
  const { availableDraws, selectedDraw, setSelectedDraw } = useDrawList();
  const { sets, winningByDraw } = useDrawBundle(selectedDraw);

  return { sets, winningByDraw, availableDraws, selectedDraw, setSelectedDraw };
};
