/**
 * 이 파일은 복권 번호 카드 묶음(기본 10세트)을 화면에 보여 주고,
 * 현재 묶음만 이미지로 내려받는 버튼을 함께 제공한다.
 * 입력으로는 묶음 순서, 묶음 데이터, 묶음 크기, 다운로드 상태, 캡처 영역 연결 함수,
 * 다운로드 실행 함수를 받는다.
 * 출력은 화면에 보이는 카드 목록과 버튼이며, 실패 상태일 때는 버튼 문구만 바뀌고
 * 카드 목록 자체는 그대로 유지된다.
 * 카드 한 장의 실제 표시 책임은 LotteryCard 파일이 맡고,
 * 이 파일은 "묶음 단위 배치와 상태 문구 표시" 역할만 담당한다.
 */

import type { LotterySetViewModel } from '../../types/home';
import { LotteryCard } from '../card/LotteryCard';

interface SetGroupProps {
  groupIndex: number;
  groupSets: LotterySetViewModel[];
  groupSize: number;
  status: 'success' | 'error' | null;
  captureRef: (node: HTMLDivElement | null) => void;
  onDownload: () => void;
}

const getBtnLabel = (status: SetGroupProps['status']) =>
  status === 'success' ? '다운로드 완료' : status === 'error' ? '다운로드 실패' : '10세트 다운로드';

const getSetRange = (groupIndex: number, groupSize: number, groupLen: number) => {
  const start = groupIndex * groupSize;
  return {
    start,
    end: start + groupLen,
  };
};

const getCardKey = (setInfo: LotterySetViewModel, cardIndex: number) =>
  setInfo.id ?? `${setInfo.drawNo}-${setInfo.numbers.join('-')}-${cardIndex}`;

export function SetGroup({ groupIndex, groupSets, groupSize, status, captureRef, onDownload }: SetGroupProps) {
  const { start, end } = getSetRange(groupIndex, groupSize, groupSets.length);
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-200">
          {start + 1}~{end}세트
        </h4>
        <button
          type="button"
          onClick={onDownload}
          className="rounded-md border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/25"
        >
          {getBtnLabel(status)}
        </button>
      </div>
      <div ref={captureRef} className="rounded-xl bg-slate-950/35 p-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {groupSets.map((setInfo, index) => (
            <LotteryCard
              key={getCardKey(setInfo, start + index)}
              setIndex={start + index}
              drawNo={setInfo.drawNo}
              numbers={setInfo.numbers}
              method={setInfo.method}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
