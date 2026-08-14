'use client';

import { useMemo } from 'react';

import { GROUP_COUNT, GROUP_SIZE } from '../../constants/home';
import { useGrpPng } from '../../hooks/useGrpPng';
import { useGrpSel } from '../../hooks/useGrpSel';
import { fillGroups } from '../../logic/chunkSets';
import type { LotterySetViewModel } from '../../types/home';
import { EmptyBox } from './EmptyBox';
import { GroupBtns } from './GroupBtns';
import { SetGroup } from './SetGroup';

type Props = { sets: LotterySetViewModel[] };

export function SetList({ sets }: Props) {
  const { sel, setSel } = useGrpSel();
  const groups = useMemo(() => fillGroups(sets, GROUP_SIZE, GROUP_COUNT), [sets]);
  const { pngDlState, bindCap, runGrpPng } = useGrpPng(GROUP_SIZE);
  const groupSets = groups[sel] ?? [];

  return (
    <div className="z-10 w-full mt-4 mb-2">
      <h3 className="text-lg font-bold text-white mb-4 ml-1">
        현재 회차 분석 번호 ({sets.length}세트)
      </h3>
      <GroupBtns sel={sel} onSel={setSel} />
      {groupSets.length === 0 ? (
        <EmptyBox />
      ) : (
        <SetGroup
          groupIndex={sel}
          groupSets={groupSets}
          groupSize={GROUP_SIZE}
          status={pngDlState?.groupIndex === sel ? pngDlState.status : null}
          captureRef={bindCap(sel)}
          onDownload={() => void runGrpPng(sel, groupSets)}
        />
      )}
    </div>
  );
}
