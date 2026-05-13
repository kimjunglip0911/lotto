import type { WinningNumberRow } from '../types';
import { DrawSelector } from './DrawSelector';
import { SelectedWinningNumbersPreview } from './SelectedWinningNumbersPreview';

// 회차 선택·조회 영역과 당첨번호 미리보기, 상태 안내를 한 줄에 모아 둔 영역입니다.
// 실제 UI 구성은 DrawSelector + SelectedWinningNumbersPreview 두 컴포넌트에 위임합니다.

type SearchControlsProps = {
  availableDraws: number[];
  selectedDraw: string;
  onSelectedDrawChange: (draw: string) => void;
  isLoadingDraws: boolean;
  isSearching: boolean;
  handleSearch: () => void;
  isLoadingWinningNumber: boolean;
  winningNumberError: string | null;
  selectedWinningNumber: WinningNumberRow | null;
  statusMessage: string | null;
};

export const SearchControls = ({
  availableDraws,
  selectedDraw,
  onSelectedDrawChange,
  isLoadingDraws,
  isSearching,
  handleSearch,
  isLoadingWinningNumber,
  winningNumberError,
  selectedWinningNumber,
  statusMessage,
}: SearchControlsProps) => (
  <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <DrawSelector
        availableDraws={availableDraws}
        selectedDraw={selectedDraw}
        onSelectedDrawChange={onSelectedDrawChange}
        isLoadingDraws={isLoadingDraws}
        isSearching={isSearching}
        onSearch={handleSearch}
      />
      <SelectedWinningNumbersPreview
        isLoadingWinningNumber={isLoadingWinningNumber}
        winningNumberError={winningNumberError}
        selectedWinningNumber={selectedWinningNumber}
      />
    </div>
    {statusMessage && <p className="text-slate-300 text-sm leading-relaxed">{statusMessage}</p>}
  </section>
);
