// 조회 화면 상단에 보여 줄 안내 문구를 결정하는 함수입니다.
// 회차 로딩 중·에러·검색 중 등 화면 상태에 따라 적절한 한 줄을 골라 줍니다.

type StatusMessageParams = {
  isLoadingDraws: boolean;
  drawLoadError: string | null;
  availableDrawsLength: number;
  isSearching: boolean;
  selectedDraw: string;
  searchError: string | null;
  hasSearched: boolean;
};

/** SearchControls 상단 안내 문구 — 분기 순서와 문구는 기존 동작과 동일해야 한다. */
export const buildStatusMessage = ({
  isLoadingDraws,
  drawLoadError,
  availableDrawsLength,
  isSearching,
  selectedDraw,
  searchError,
  hasSearched,
}: StatusMessageParams): string | null => {
  if (isLoadingDraws) return '회차 정보를 불러오는 중입니다.';
  if (drawLoadError) return `${drawLoadError} 잠시 후 다시 시도해 주세요.`;
  if (availableDrawsLength === 0)
    return 'DB에 저장된 당첨 번호가 없어 회차를 만들 수 없습니다. 홈 화면에서 당첨번호를 먼저 저장한 뒤 다시 열어 주세요.';
  if (isSearching) return `${selectedDraw}회 기준 본번호 연속 출현을 계산하고 있습니다.`;
  if (searchError) return `${searchError} 잠시 후 다시 시도해 주세요.`;
  if (hasSearched) return null;
  return '회차를 선택한 뒤 조회 버튼을 누르면 연속 출현 분석 결과를 표시합니다.';
};
