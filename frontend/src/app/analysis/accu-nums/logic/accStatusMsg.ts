/** 상단 안내 문구 — 분기 순서·문구는 이 파일이 단일 출처이다. */

export type AccStatusIn = {
  isLoadingDraws: boolean;
  drawLoadError: string | null;
  availableDrawsLength: number;
  isSearching: boolean;
  selectedDraw: string;
  searchError: string | null;
  searchedDraw: string;
};

export const accStatusMsg = (p: AccStatusIn): string | null => {
  if (p.isLoadingDraws) {
    return '회차 정보를 불러오는 중입니다.';
  }
  if (p.drawLoadError) {
    return `${p.drawLoadError} 잠시 후 다시 시도해 주세요.`;
  }
  if (p.availableDrawsLength === 0) {
    return '조회 가능한 회차 정보가 없습니다.';
  }
  if (p.isSearching) {
    return `${p.selectedDraw}회 기준 누적 당첨번호를 집계하고 있습니다.`;
  }
  if (p.searchError) {
    return `${p.searchError} 잠시 후 다시 시도해 주세요.`;
  }
  if (p.searchedDraw) {
    return null;
  }
  return '회차를 선택한 뒤 조회 버튼을 누르면 해당 회차 기준 분석을 시작합니다.';
};
