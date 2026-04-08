import React from 'react';
import { LotteryCard } from '@features/home/components/LotteryCard';

interface LotterySetViewModel {
  numbers: number[];
  method?: string;
  drawNo: number;
}

interface LotterySetListProps {
  sets: LotterySetViewModel[];
}

export function LotterySetList({ sets }: LotterySetListProps) {
  return (
    <div className="z-10 w-full mb-2">
      <h3 className="text-lg font-bold text-white mb-4 ml-1">현재 회차 분석 번호 ({sets.length}세트)</h3>
      {sets.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-5xl opacity-50 mb-2">hourglass_empty</span>
          <p className="text-lg">해당 회차에 분석된 데이터가 아직 없습니다.</p>
          <p className="text-sm opacity-60">분석/추출 기능 메뉴를 이용해 미리 세트를 생성해 보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {sets.map((setInfo, index) => (
            <LotteryCard
              key={index}
              setIndex={index}
              drawNo={setInfo.drawNo}
              numbers={setInfo.numbers}
              method={setInfo.method}
            />
          ))}
        </div>
      )}
    </div>
  );
}
