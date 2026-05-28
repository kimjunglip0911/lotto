/**
 * 입력된 당첨번호와 비교해 계산된 세트별 등수를 목록으로 보여준다.
 * 화면에서는 세트 번호와 등수를 간단히 읽을 수 있게 표시하며,
 * 이 파일은 "순위 목록 표시" 역할만 담당한다.
 */

import type { SetRanking } from '../../types/home';

interface RankListProps {
  setRankings: SetRanking[];
}

export function RankList({ setRankings }: RankListProps) {
  const getItemKey = ({ setNumber }: SetRanking) => `set-${setNumber}`;

  return (
    <div className="bg-black/20 rounded-2xl p-5 border border-white/5">
      <h4 className="text-base text-slate-300 font-semibold mb-4">당첨 세트 순위</h4>
      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
        {setRankings.map((setStat, index) => (
          <div key={getItemKey(setStat)} className="flex flex-col gap-1 bg-white/5 p-3 rounded-xl">
            <div className="flex justify-between items-center text-base">
              <span className="text-primary font-medium truncate pr-2">
                {index + 1}. SET {setStat.setNumber}
              </span>
              <span className="text-emerald-400 font-bold whitespace-nowrap">{setStat.rank}등</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
