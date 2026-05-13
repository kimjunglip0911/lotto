import type { SearchPanelProps } from './searchPanelProps';
import { SearchTopRow } from './SearchTopRow';
import { SnapSaveMsgs } from './SnapSaveMsgs';

/**
 * 누적 번호 분석 상단 패널: 기준 회차 선택 → 조회 → (조건 충족 시) 분석 결과 저장.
 * 당첨번호 줄은 `SearchWinPreview`·`WinStrip`에 둡니다.
 */
export function SearchPanel({
  availableDraws,
  selectedDraw,
  onSelectedDrawChange,
  onSearch,
  isLoadingDraws,
  isSearching,
  isLoadingSelectedWinningNumber,
  selectedWinningNumberError,
  selectedWinningNumber,
  selectedMainNumbers,
  showSaveSnapshot = false,
  onSaveSnapshot,
  isSavingSnapshot = false,
  saveSnapshotMessage = null,
  saveSnapshotError = null,
}: SearchPanelProps) {
  const isDrawSelectDisabled = isLoadingDraws || availableDraws.length === 0;
  const isSearchDisabled = !selectedDraw || isDrawSelectDisabled || isSearching;
  const isSaveDisabled = !showSaveSnapshot || isSavingSnapshot || isSearching || !onSaveSnapshot;
  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      <SearchTopRow
        availableDraws={availableDraws}
        selectedDraw={selectedDraw}
        onSelectedDrawChange={onSelectedDrawChange}
        onSearch={onSearch}
        isLoadingDraws={isLoadingDraws}
        isLoadingSelectedWinningNumber={isLoadingSelectedWinningNumber}
        selectedWinningNumberError={selectedWinningNumberError}
        selectedWinningNumber={selectedWinningNumber}
        selectedMainNumbers={selectedMainNumbers}
        showSaveSnapshot={showSaveSnapshot}
        onSaveSnapshot={onSaveSnapshot}
        isSavingSnapshot={isSavingSnapshot}
        isDrawSelectDisabled={isDrawSelectDisabled}
        isSearchDisabled={isSearchDisabled}
        isSaveDisabled={isSaveDisabled}
      />
      <SnapSaveMsgs saveSnapshotMessage={saveSnapshotMessage} saveSnapshotError={saveSnapshotError} />
    </section>
  );
}
