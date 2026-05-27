import React, { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { toPng as toPngFromHtmlToImage } from 'html-to-image';
import { LotteryCard } from '@/app/home/components/LotteryCard';
import type { LotterySetViewModel } from '@/app/home/components/types';

interface LotterySetListProps {
  sets: LotterySetViewModel[];
}

const GROUP_SIZE = 10;

const chunkSets = (sets: LotterySetViewModel[], size: number): LotterySetViewModel[][] => {
  const groups: LotterySetViewModel[][] = [];
  for (let index = 0; index < sets.length; index += size) {
    groups.push(sets.slice(index, index + size));
  }
  return groups;
};

const downloadGroupImage = async (
  targetNode: HTMLElement | null,
  startSetNo: number,
  endSetNo: number,
): Promise<boolean> => {
  try {
    if (!targetNode || typeof document === 'undefined') return false;

    const link = document.createElement('a');
    let dataUrl: string | null = null;

    try {
      // cssRules 접근 이슈를 피하기 위해 폰트 자동 임베딩을 비활성화하고 먼저 시도한다.
      dataUrl = await toPngFromHtmlToImage(targetNode, {
        cacheBust: true,
        pixelRatio: Math.max(window.devicePixelRatio, 2),
        backgroundColor: '#0b1220',
        fontEmbedCSS: '',
      });
    } catch (primaryError) {
      // Tailwind v4 색상 파싱/환경 이슈를 대비해 html2canvas로 한 번 더 시도한다.
      try {
        const canvas = await html2canvas(targetNode, {
          useCORS: true,
          logging: false,
          scale: Math.max(window.devicePixelRatio, 2),
          backgroundColor: '#0b1220',
        });
        dataUrl = canvas.toDataURL('image/png');
      } catch (fallbackError) {
        console.error('Group image download failed in both capture engines.', {
          primaryError,
          fallbackError,
        });
        return false;
      }
    }

    if (!dataUrl) return false;
    link.href = dataUrl;
    link.download = `${startSetNo}~${endSetNo}세트.png`;
    link.click();
    return true;
  } catch (error) {
    console.error('Group image download unexpected error.', error);
    return false;
  }
};

export function LotterySetList({ sets }: LotterySetListProps) {
  const [downloadState, setDownloadState] = useState<{ groupIndex: number; status: 'success' | 'error' } | null>(null);
  const groups = useMemo(() => chunkSets(sets, GROUP_SIZE), [sets]);
  const groupCaptureRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleDownloadGroup = async (groupIndex: number, groupSets: LotterySetViewModel[]) => {
    const startSetNo = groupIndex * GROUP_SIZE + 1;
    const endSetNo = startSetNo + groupSets.length - 1;
    const targetNode = groupCaptureRefs.current[groupIndex];
    const downloaded = await downloadGroupImage(targetNode, startSetNo, endSetNo);
    setDownloadState({ groupIndex, status: downloaded ? 'success' : 'error' });
    setTimeout(() => {
      setDownloadState((prev) => (prev?.groupIndex === groupIndex ? null : prev));
    }, 1500);
  };

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
          {groups.map((groupSets, groupIndex) => {
            const groupStartIndex = groupIndex * GROUP_SIZE;
            const status = downloadState?.groupIndex === groupIndex ? downloadState.status : null;

            return (
              <section key={`set-group-${groupIndex}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-slate-200">
                    {groupStartIndex + 1}~{groupStartIndex + groupSets.length}세트
                  </h4>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleDownloadGroup(groupIndex, groupSets);
                    }}
                    className="rounded-md border border-primary/40 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/25"
                  >
                    {status === 'success' ? '다운로드 완료' : status === 'error' ? '다운로드 실패' : '10세트 다운로드'}
                  </button>
                </div>
                <div
                  ref={(node) => {
                    groupCaptureRefs.current[groupIndex] = node;
                  }}
                  className="rounded-xl bg-slate-950/35 p-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                    {groupSets.map((setInfo, index) => (
                      <LotteryCard
                        key={setInfo.id ?? `${setInfo.drawNo}-${setInfo.numbers.join('-')}-${groupStartIndex + index}`}
                        setIndex={groupStartIndex + index}
                        drawNo={setInfo.drawNo}
                        numbers={setInfo.numbers}
                        method={setInfo.method}
                      />
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

