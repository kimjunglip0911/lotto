'use client';

import type { GeneratedSet } from '@/app/recommend/types/generatedSet';
import type { PositionRankLookup } from '@/app/recommend/helpers/positionRankLookup';
import type { GapRankLookup } from '@/app/recommend/types/gapRank';
import { SetList } from '@/app/recommend/ui/result/SetList';

/** 추천 생성 결과 요약·세트 목록 */

type Props = {
  statusMessage?: string | null;
  targetDrawNo?: number | null;
  combinationSummaryLines?: string[];
  sets?: GeneratedSet[];
  winningNumbers?: number[];
  rankLookup: PositionRankLookup;
  gapLookup: GapRankLookup;
};

export const AnalysisResultList = ({
  statusMessage,
  targetDrawNo,
  combinationSummaryLines = [],
  sets = [],
  rankLookup,
  gapLookup,
}: Props) => {
  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="rounded-xl border border-card-border/60 bg-card/30 px-5 py-6 text-sm text-slate-300 space-y-4">
        <h4 className="text-base font-semibold text-white">추천 생성 결과</h4>
        <p>
          1~45 전체 번호 풀과 조합 분석(구간별 순위) 통계로 rank별 세트를 만듭니다.
        </p>
        {targetDrawNo ? <p className="text-slate-200">기준 회차: {targetDrawNo}회</p> : null}
        {statusMessage ? <p className="text-emerald-300">{statusMessage}</p> : null}

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

        <SetList sets={sets} rankLookup={rankLookup} gapLookup={gapLookup} />
      </div>
    </div>
  );
};
