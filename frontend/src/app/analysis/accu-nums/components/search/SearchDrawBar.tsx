import { SearchDrawSelect } from './SearchDrawSelect';

/** 조회 버튼과 회차 선택을 한 줄에 둡니다. */

type Props = {
  availableDraws: number[];
  selectedDraw: string;
  onSelectedDrawChange: (value: string) => void;
  onSearch: () => void;
  isLoadingDraws: boolean;
  isDrawSelectDisabled: boolean;
  isSearchDisabled: boolean;
  searchButtonClassName: string;
};

export const SearchDrawBar = ({
  availableDraws,
  selectedDraw,
  onSelectedDrawChange,
  onSearch,
  isLoadingDraws,
  isDrawSelectDisabled,
  isSearchDisabled,
  searchButtonClassName,
}: Props) => (
  <div className="flex flex-col sm:flex-row sm:items-end gap-3">
    <SearchDrawSelect
      availableDraws={availableDraws}
      selectedDraw={selectedDraw}
      onSelectedDrawChange={onSelectedDrawChange}
      isLoadingDraws={isLoadingDraws}
      isDrawSelectDisabled={isDrawSelectDisabled}
    />
    <button type="button" onClick={onSearch} disabled={isSearchDisabled} className={searchButtonClassName}>
      조회
    </button>
  </div>
);
