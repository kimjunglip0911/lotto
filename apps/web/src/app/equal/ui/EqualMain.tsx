import type { EqualDataState } from '../types/equal';
import { BucketSection } from './BucketSection';

/** 균등 분석 본문: 로딩·오류·네 버킷 섹션. */
export function EqualMain({
  isLoading,
  loadError,
  analyzedDraws,
  buckets,
}: EqualDataState) {
  return (
    <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-8">
      {isLoading && <p className="text-sm text-slate-300">데이터를 불러오는 중...</p>}
      {!isLoading && loadError && (
        <p className="text-sm text-rose-300">{loadError}</p>
      )}
      {!isLoading && !loadError && analyzedDraws === 0 && (
        <p className="text-sm text-slate-300">저장된 당첨 이력이 없습니다.</p>
      )}
      {!isLoading && !loadError && analyzedDraws > 0 && (
        <>
          <p className="text-sm text-slate-400">최근 {analyzedDraws}회차 · 보너스 포함</p>
          <BucketSection title="0회" numbers={buckets.zero} />
          <BucketSection title="1회" numbers={buckets.one} />
          <BucketSection title="2회" numbers={buckets.two} />
          <BucketSection title="3회 이상" numbers={buckets.threePlus} />
        </>
      )}
    </main>
  );
}
