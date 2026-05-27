import { runChiSearch } from './runChiSearch';

export const execChiSearch = async (
  selectedDrawNo: number,
  session: number,
  searchSessionRef: { current: number },
) => {
  const out = await runChiSearch(selectedDrawNo);
  if (session !== searchSessionRef.current) return null;
  return out;
};
