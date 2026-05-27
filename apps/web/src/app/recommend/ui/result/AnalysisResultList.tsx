'use client';

import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import { AdoptedChips } from '@/app/recommend/ui/result/AdoptedChips';
import { SetList } from '@/app/recommend/ui/result/SetList';

/** 추천 생성 결과 요약·채택·세트 목록 */

type Props = {
  statusMessage?: string | null;
  targetDrawNo?: number | null;
  adoptedNumbers?: number[];
  combinationSummaryLines?: string[];
  sets?: GeneratedSet[];
  winningNumbers?: number[];
};

export const AnalysisResultList = ({
  statusMessage,
  targetDrawNo,
  adoptedNumbers = [],
  combinationSummaryLines = [],
  sets = [],
  winningNumbers,
}: Props) => {
  const winningSet = new Set(winningNumbers ?? []);

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="rounded-xl border border-card-border/60 bg-card/30 px-5 py-6 text-sm text-slate-300 space-y-4">
        <h4 className="text-base font-semibold text-white">추천 생성 결과</h4>
        <p>
          통합 분석에서 확정한 채택 번호 풀과 조합 분석(고저 합·홀짝·연속·구간별) 통계를 사용해
          세트를 만듭니다. 기준 회차에 당첨번호가 DB에 있어야 통합 채택이 계산됩니다.
        </p>
        {targetDrawNo ? <p className="text-slate-200">기준 회차: {targetDrawNo}회</p> : null}
        {statusMessage ? <p className="text-emerald-300">{statusMessage}</p> : null}

        <div className="rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-4 py-3 space-y-2">
          <p className="text-sm font-semibold text-emerald-200">통합 채택 번호</p>
          <AdoptedChips adoptedNumbers={adoptedNumbers} winningSet={winningSet} />
        </div>

        {combinationSummaryLines.length > 0 ? (
          <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 px-4 py-3 space-y-1.5">
            <p className="text-sm font-semibold text-sky-200">조합 분석 요약</p>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5">
              {combinationSummaryLines.map((line, i) => (
                <li key={`combo-sum-${i}`}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <SetList sets={sets} />
      </div>
    </div>
  );
};
