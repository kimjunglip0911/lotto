/**
 * 분석 결과 한 세트를 카드로 보여 주는 화면 조각이다.
 * 세트 순번, 회차, 번호 6개, 분석 기법 이름을 받아 사용자에게 보기 좋게 배치한다.
 * 번호 공 모양 표시 자체는 LotteryBall 컴포넌트가 맡고, 이 파일은 배치와 문구 표시만 담당한다.
 * method 값이 비어 있으면 화면에는 "기본"으로 보여 사용자에게 빈 값이 노출되지 않도록 한다.
 */

import React from 'react';

import { LotteryBall } from '@/components/ui/LotteryBall';

import type { LotteryCardProps } from '../../types/home';

export function LotteryCard({ setIndex, drawNo, numbers, method }: LotteryCardProps) {
  const methodText = method || '기본';
  const roundText = `(${drawNo}회차)`;

  const renderHead = () => (
    <div className="flex justify-between w-full items-center mb-1 px-1">
      <span className="text-[16px] font-black text-primary uppercase tracking-wider">SET {setIndex + 1}</span>
      <span className="mr-1 whitespace-nowrap text-[13px] font-semibold text-slate-300 bg-slate-800/50 px-2.5 py-1 rounded-md">
        {roundText}
      </span>
    </div>
  );

  const renderNums = () => (
    <div className="flex items-center justify-center gap-1.5 flex-nowrap shrink-0 w-full my-2 scale-[0.98] group-hover:scale-100 transition-transform duration-300">
      <div className="flex gap-1.5">
        {numbers.map((num, idx) => (
          <LotteryBall key={`${num}-${idx}`} num={num} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-background/20 backdrop-blur-sm border border-card-border/60 rounded-3xl p-6 py-7 flex flex-col items-center justify-center gap-5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] transition-all hover:bg-background/40 hover:border-primary/30 w-full overflow-hidden relative group">
      {renderHead()}
      {renderNums()}
      <div className="mt-1 text-[13px] font-medium text-slate-300 bg-black/20 border border-white/10 px-3 py-2 rounded-lg w-full text-center truncate">
        분석 기법 : <span className="text-white ml-1">{methodText}</span>
      </div>
    </div>
  );
}
