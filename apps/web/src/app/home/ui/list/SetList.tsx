'use client';

/**
 * 이 파일은 분석된 번호 세트 목록 화면의 "목록 단위 배치"를 담당한다.
 * 세트 배열을 받아 10개씩 묶어 그룹으로 나누고, 각 그룹 화면과 그룹별 이미지 저장 동작을 연결한다.
 * 세트가 없으면 안내 문구를 보여 주고, 세트가 있으면 그룹 목록만 그려 준다.
 * 실제 카드 한 장 표시와 그룹 내부 배치는 SetGroup 파일이 맡고,
 * 이 파일은 목록 제목/빈 상태/그룹 반복 연결 역할만 담당한다.
 */

import { useMemo } from 'react';

import { GROUP_SIZE } from '../../constants/home';
import { useGrpPng } from '../../hooks/useGrpPng';
import { chunkSets } from '../../logic/chunkSets';
import type { LotterySetViewModel } from '../../types/home';
import { SetGroup } from './SetGroup';

interface SetListProps {
  sets: LotterySetViewModel[];
}

const EmptyBox = () => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
    <span className="material-symbols-outlined text-5xl opacity-50 mb-2">hourglass_empty</span>
    <p className="text-lg">해당 회차에 분석된 데이터가 아직 없습니다.</p>
    <p className="text-sm opacity-60">분석/추출 기능 메뉴를 이용해 미리 세트를 생성해 보세요.</p>
  </div>
);

export function SetList({ sets }: SetListProps) {
  const groups = useMemo(() => chunkSets(sets, GROUP_SIZE), [sets]);
  const { pngDlState, grpCapRefs, runGrpPng } = useGrpPng(GROUP_SIZE);

  const renderGroups = () =>
    groups.map((groupSets, groupIndex) => (
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
    ));

  return (
    <div className="z-10 w-full mt-4 mb-2">
      <h3 className="text-lg font-bold text-white mb-4 ml-1">현재 회차 분석 번호 ({sets.length}세트)</h3>
      {sets.length === 0 ? <EmptyBox /> : <div className="space-y-6">{renderGroups()}</div>}
    </div>
  );
}
