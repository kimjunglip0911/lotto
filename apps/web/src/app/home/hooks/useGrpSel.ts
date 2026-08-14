import { useState } from 'react';

/** 홈 10세트 묶음 선택. 회차가 바뀌면 SetList key로 첫 묶음이 된다 */

export const useGrpSel = () => {
  const [sel, setSel] = useState(0);
  return { sel, setSel };
};
