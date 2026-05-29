'use client';

/**
 * 홈 화면 본문(main)을 조립하는 파일입니다.
 *
 * 하는 일
 * - `useHomeView`가 모아 준 `view`를 받아, 회차·당첨 입력 → 당첨 통계 → 분석 세트 목록 순으로 배치합니다.
 * - 카드 박스 꾸밈은 `HomeCard`, 각 영역 내용은 하위 UI 컴포넌트가 담당합니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: `view` 한 덩어리(회차, 당첨 입력, 저장 상태, 표시용 세트 목록 등)
 * - 돌려줌: 스크롤 가능한 main 안에 홈 대시보드 섹션 전체
 *
 * 역할 나눔
 * - 데이터·입력·저장 묶음: `hooks/useHomeView.ts`
 * - 카드 테두리·빛 효과: `ui/HomeCard.tsx`
 * - 상단 입력: `ui/controls/GridControls.tsx`
 * - 당첨 통계: `ui/stats/RankStats.tsx`
 * - 세트 목록: `ui/list/SetList.tsx`
 *
 * 실패·주의
 * - 당첨 번호가 비어 있거나 잘못되면 통계 영역은 보이지 않을 수 있습니다(`RankStats`).
 * - 해당 회차에 분석 세트가 없으면 목록 쪽에서 빈 안내를 표시합니다(`SetList`).
 */

import type { HomeGridSlice, HomeView } from '../hooks/useHomeView';
import { GridControls } from './controls/GridControls';
import { HomeCard } from './HomeCard';
import { SetList } from './list/SetList';
import { RankStats } from './stats/RankStats';

export const HomeMain = ({ view }: { view: HomeView }) => {
  const {
    displaySets,
    winningNumbers,
    winningBonus,
    selectedDraw,
    availableDraws,
    setSelectedDraw,
    onWinNumChg,
    onBonusChg,
    saveWinning,
    isSaving,
    saveStatus,
  } = view;

  const gridSlice: HomeGridSlice = {
    selectedDraw,
    availableDraws,
    winningNumbers,
    winningBonus,
    setSelectedDraw,
    onWinNumChg,
    onBonusChg,
    saveWinning,
    isSaving,
    saveStatus,
  };

  return (
    <main className="flex-1 overflow-y-auto pb-8 px-4 pt-4 space-y-8">
      <section>
        <HomeCard>
          <GridControls {...gridSlice} />
          <RankStats
            sets={displaySets}
            winningNumbers={winningNumbers}
            bonusNumber={winningBonus}
          />
          <SetList sets={displaySets} />
        </HomeCard>
      </section>
    </main>
  );
};
