import type { UseGapDataResult } from '../hooks/useGapData';
import { GapTable } from './table/GapTable';

/**
 * 번호별 간격 화면의 본문을 조립하는 파일입니다.
 *
 * 하는 일
 * - 데이터를 불러오는 중, 오류, 정상 표 상태를 나누어 보여 줍니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: `useGapData`가 준비한 화면 상태
 * - 돌려줌: 스크롤 가능한 본문 영역
 */

export const IntervalMain = ({ isLoading, loadError, totalDraws, rows }: UseGapDataResult) => (
  <main className="flex-1 overflow-y-auto pb-12 px-4 pt-4 space-y-6">
    {isLoading && <p className="text-sm text-slate-300">데이터를 불러오는 중...</p>}
    {!isLoading && loadError && <p className="text-sm text-rose-300">{loadError}</p>}
    {!isLoading && !loadError && <GapTable totalDraws={totalDraws} rows={rows} />}
  </main>
);
