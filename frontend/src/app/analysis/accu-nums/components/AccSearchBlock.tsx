import type { AccuData } from '../hooks/useAccData';
import type { AccuView } from '../hooks/useAccView';
import { SearchPanel } from './AccSearch';

/** 회차 선택·조회와 그 아래 상태 안내 문구만 모은 블록입니다. */

export const AccSearchBlock = ({ data, view }: { data: AccuData; view: AccuView }) => (
  <>
    <SearchPanel
      availableDraws={data.availableDraws}
      selectedDraw={data.selectedDraw}
      onSelectedDrawChange={data.setSelectedDraw}
      onSearch={data.handleSearch}
      isLoadingDraws={data.isLoadingDraws}
      isSearching={data.isSearching}
      isLoadingSelectedWinningNumber={data.isLoadingSelectedWinningNumber}
      selectedWinningNumberError={data.selectedWinningNumberError}
      selectedWinningNumber={data.selectedWinningNumber}
      selectedMainNumbers={view.selectedMainNumbers}
      showSaveSnapshot={view.canSaveSnapshot}
      onSaveSnapshot={() => {
        void data.saveAccumulatedSnapshot();
      }}
      isSavingSnapshot={data.isSavingSnapshot}
      saveSnapshotMessage={data.saveSnapshotMessage}
      saveSnapshotError={data.saveSnapshotError}
    />
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-4 space-y-3">
      {view.statusMessage && <p className="text-slate-300 text-sm leading-relaxed">{view.statusMessage}</p>}
    </section>
  </>
);
