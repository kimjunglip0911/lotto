/** 스냅샷 저장 버튼을 눌러도 되는지 조건을 한곳에서 판별한다. */

export const canAccSnap = (
  hasSearched: boolean,
  isSearching: boolean,
  searchError: string | null,
  selectedSearchDrawNo: number,
  finalLen: number | undefined
) =>
  hasSearched &&
  !isSearching &&
  !searchError &&
  Number.isFinite(selectedSearchDrawNo) &&
  selectedSearchDrawNo > 1 &&
  finalLen === 4;
