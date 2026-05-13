import { SearchDrawSelect } from './SearchDrawSelect';

/** 조회·(조건 시) 스냅샷 저장 버튼과 회차 선택을 한 줄에 둡니다. */

type Props = {
  availableDraws: number[];
  selectedDraw: string;
  onSelectedDrawChange: (value: string) => void;
  onSearch: () => void;
  isLoadingDraws: boolean;
  isDrawSelectDisabled: boolean;
  isSearchDisabled: boolean;
  searchButtonClassName: string;
  showSaveSnapshot: boolean;
  onSaveSnapshot?: () => void;
  isSaveDisabled: boolean;
  saveButtonClassName: string;
  isSavingSnapshot: boolean;
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
  showSaveSnapshot,
  onSaveSnapshot,
  isSaveDisabled,
  saveButtonClassName,
  isSavingSnapshot,
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
    {showSaveSnapshot && (
      <button type="button" onClick={onSaveSnapshot} disabled={isSaveDisabled} className={saveButtonClassName}>
        {isSavingSnapshot ? '저장 중…' : '분석 결과 저장'}
      </button>
    )}
  </div>
);
