import { runAccSearch } from './runAccSearch';

/** 한 회차 조회를 실행하고 세션이 유효할 때만 결과를 반환한다. */
export const execAccSearch = async (
  selectedDrawNo: number,
  session: number,
  searchSessionRef: { current: number },
) => {
  const out = await runAccSearch(selectedDrawNo);
  if (session !== searchSessionRef.current) {
    return null;
  }
  return out;
};
