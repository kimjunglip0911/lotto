import { searchRunBtnCls } from './searchBtnCls';
import type { SearchTopRowProps } from './searchPanelProps';
import { SearchDrawBar } from './SearchDrawBar';
import { SearchWinPreview } from './SearchWinPreview';

/** 회차·조회·당첨 미리보기를 한 가로 줄에 둡니다. */

export const SearchTopRow = ({
  availableDraws,
  selectedDraw,
  onSelectedDrawChange,
  onSearch,
  isLoadingDraws,
  isLoadingSelectedWinningNumber,
  selectedWinningNumberError,
  selectedWinningNumber,
  selectedMainNumbers,
  isDrawSelectDisabled,
  isSearchDisabled,
}: SearchTopRowProps) => (
  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
    <SearchDrawBar
      availableDraws={availableDraws}
      selectedDraw={selectedDraw}
      onSelectedDrawChange={onSelectedDrawChange}
      onSearch={onSearch}
      isLoadingDraws={isLoadingDraws}
      isDrawSelectDisabled={isDrawSelectDisabled}
      isSearchDisabled={isSearchDisabled}
      searchButtonClassName={searchRunBtnCls(!isSearchDisabled)}
    />
    <SearchWinPreview
      isLoadingSelectedWinningNumber={isLoadingSelectedWinningNumber}
      selectedWinningNumberError={selectedWinningNumberError}
      selectedWinningNumber={selectedWinningNumber}
      selectedMainNumbers={selectedMainNumbers}
    />
  </div>
);
