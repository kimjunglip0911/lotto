type StatusIn = {
  isLoadingDraws: boolean;
  drawLoadError: string | null;
  availableDrawsLength: number;
  isSearching: boolean;
  selectedDraw: string;
  searchError: string | null;
  hasSearched: boolean;
};

export const buildTrendStatusMessage = (p: StatusIn): string | null => {
  if (p.isLoadingDraws) return '회차 정보를 불러오는 중입니다.';
  if (p.drawLoadError) return `${p.drawLoadError} 잠시 후 다시 시도해 주세요.`;
  if (p.availableDrawsLength === 0) return '조회 가능한 회차 정보가 없습니다.';
  if (p.isSearching) return `${p.selectedDraw}회 기준 추세 분석을 계산하고 있습니다.`;
  if (p.searchError) return `${p.searchError} 잠시 후 다시 시도해 주세요.`;
  if (p.hasSearched) return null;
  return '회차를 선택한 뒤 조회 버튼을 누르면 추세 분석 결과를 표시합니다.';
};
