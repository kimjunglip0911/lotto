import type { WinningNumberRow } from '../../types';

/** 상단 검색 패널에 넘기는 값들의 모양입니다. */

export type SearchPanelProps = {
  availableDraws: number[];
  selectedDraw: string;
  onSelectedDrawChange: (value: string) => void;
  onSearch: () => void;
  isLoadingDraws: boolean;
  isSearching: boolean;
  isLoadingSelectedWinningNumber: boolean;
  selectedWinningNumberError: string | null;
  selectedWinningNumber: WinningNumberRow | null;
  selectedMainNumbers: number[];
  showSaveSnapshot?: boolean;
  onSaveSnapshot?: () => void;
  isSavingSnapshot?: boolean;
  saveSnapshotMessage?: string | null;
  saveSnapshotError?: string | null;
};

export type SearchTopRowProps = Pick<
  SearchPanelProps,
  | 'availableDraws'
  | 'selectedDraw'
  | 'onSelectedDrawChange'
  | 'onSearch'
  | 'isLoadingDraws'
  | 'isLoadingSelectedWinningNumber'
  | 'selectedWinningNumberError'
  | 'selectedWinningNumber'
  | 'selectedMainNumbers'
  | 'showSaveSnapshot'
  | 'onSaveSnapshot'
  | 'isSavingSnapshot'
> & {
  isDrawSelectDisabled: boolean;
  isSearchDisabled: boolean;
  isSaveDisabled: boolean;
};
