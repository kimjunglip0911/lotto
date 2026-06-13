'use client';

import { DrawSelector } from '@/app/recommend/ui/controller/DrawSelector';
import { GenerateBtn } from '@/app/recommend/ui/controller/GenerateBtn';
import { WinningNumbersView } from '@/app/recommend/ui/controller/WinningNumbersView';

/** 회차 선택·당첨 표시·생성 버튼 */

type Props = {
  onGenerateAndSave: () => void;
  isGenerating: boolean;
  availableDraws: number[];
  selectedDraw: number | null;
  onDrawChange: (draw: number) => void;
  isLoadingDraws: boolean;
  winningNumbers: number[] | null;
};

export const AnalysisController = ({
  onGenerateAndSave,
  isGenerating,
  availableDraws,
  selectedDraw,
  onDrawChange,
  isLoadingDraws,
  winningNumbers,
}: Props) => {
  const isDrawSelectorDisabled = isLoadingDraws || availableDraws.length === 0 || isGenerating;
  const isGenerateDisabled = isGenerating || !selectedDraw || isLoadingDraws;

  return (
    <div className="bg-card/40 border border-card-border/50 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
      <div className="flex flex-col gap-3 w-full sm:w-auto">
        <h3 className="text-lg font-semibold text-white">추천 생성 및 저장 실행</h3>
        <div className="flex flex-wrap items-end gap-4">
          <DrawSelector
            selectedDraw={selectedDraw}
            onDrawChange={onDrawChange}
            isDisabled={isDrawSelectorDisabled}
            isLoadingDraws={isLoadingDraws}
            availableDraws={availableDraws}
          />
          <WinningNumbersView winningNumbers={winningNumbers} />
        </div>
        <p className="text-sm text-slate-400">
          1~45 전체 번호 풀에서 조합 분석 통계를 적용해 20세트를 생성합니다.
        </p>
        <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
          추천 세트는 최근 당첨 이력·추세를 반영한 휴리스틱이며 당첨을 보장하지 않습니다.
        </p>
      </div>
      <div className="w-full sm:w-auto">
        <GenerateBtn
          onGenerateAndSave={onGenerateAndSave}
          isGenerating={isGenerating}
          disabled={isGenerateDisabled}
        />
      </div>
    </div>
  );
};
