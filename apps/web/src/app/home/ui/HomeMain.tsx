'use client';

/** 홈 메인: 회차·당첨번호·통계·세트 목록 */

import type { HomeView } from '../hooks/useHomeView';
import { GridControls } from './controls/GridControls';
import { SetList } from './list/SetList';
import { RankStats } from './stats/RankStats';

interface HomeMainProps {
  view: HomeView;
}

export function HomeMain({ view }: HomeMainProps) {
  return (
    <main className="flex-1 overflow-y-auto pb-8 px-4 pt-4 space-y-8">
      <section>
        <div className="bg-card border border-card-border rounded-3xl p-4 sm:p-6 flex flex-col relative shadow-2xl overflow-visible">
          <div className="absolute top-0 inset-x-0 h-40 bg-primary/20 blur-[60px] pointer-events-none rounded-t-3xl" />
          <GridControls
            selectedDraw={view.selectedDraw}
            availableDraws={view.availableDraws}
            winningNumbers={view.winningNumbers}
            winningBonus={view.winningBonus}
            onSelectDraw={view.setSelectedDraw}
            onWinNumChg={view.onWinNumChg}
            onBonusChg={view.onBonusChg}
            saveWinning={view.saveWinning}
            isSaving={view.isSaving}
            saveStatus={view.saveStatus}
          />
          <RankStats
            sets={view.displaySets}
            winningNumbers={view.winningNumbers}
            bonusNumber={view.winningBonus}
          />
          <SetList sets={view.displaySets} />
        </div>
      </section>
    </main>
  );
}
