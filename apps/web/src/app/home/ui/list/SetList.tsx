'use client';

/** 분석 세트 목록(10세트씩 그룹)과 PNG 다운로드 */

import { useMemo } from 'react';

import { GROUP_SIZE } from '../../constants/home';
import { useGrpPng } from '../../hooks/useGrpPng';
import { chunkSets } from '../../logic/chunkSets';
import type { LotterySetViewModel } from '../../types/home';
import { SetGroup } from './SetGroup';

interface SetListProps {
  sets: LotterySetViewModel[];
}

export function SetList({ sets }: SetListProps) {
  const groups = useMemo(() => chunkSets(sets, GROUP_SIZE), [sets]);
  const { pngDlState, grpCapRefs, runGrpPng } = useGrpPng(GROUP_SIZE);

  return (
    <div className="z-10 w-full mt-4 mb-2">
      <h3 className="text-lg font-bold text-white mb-4 ml-1">현재 회차 분석 번호 ({sets.length}세트)</h3>
      {sets.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-5xl opacity-50 mb-2">hourglass_empty</span>
          <p className="text-lg">해당 회차에 분석된 데이터가 아직 없습니다.</p>
          <p className="text-sm opacity-60">분석/추출 기능 메뉴를 이용해 미리 세트를 생성해 보세요.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((groupSets, groupIndex) => (
            <SetGroup
              key={`set-group-${groupIndex}`}
              groupIndex={groupIndex}
              groupSets={groupSets}
              groupSize={GROUP_SIZE}
              status={pngDlState?.groupIndex === groupIndex ? pngDlState.status : null}
              captureRef={(node) => {
                grpCapRefs.current[groupIndex] = node;
              }}
              onDownload={() => void runGrpPng(groupIndex, groupSets)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
