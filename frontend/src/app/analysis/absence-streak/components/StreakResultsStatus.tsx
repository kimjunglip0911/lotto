import type { ReactNode } from 'react';

type StreakResultsStatusProps = {
  hasSearched: boolean;
  noHistory: boolean;
  isSearching: boolean;
  searchError: string | null;
  hasResults: boolean;
  /** 미조회 시 안내 (차트/테이블 문구 구분) */
  idleHint: string;
  /** 조회 중 안내 (차트/테이블 문구 구분) */
  loadingHint: string;
  children: ReactNode;
};

/**
 * 연속 미출현 차트·테이블 공통: 조회 전/중/오류/무데이터 분기.
 * 분기 순서는 noHistory → 미조회 → 검색중 → 오류 → 빈 결과 → children 고정.
 */
export const StreakResultsStatus = ({
  hasSearched,
  noHistory,
  isSearching,
  searchError,
  hasResults,
  idleHint,
  loadingHint,
  children,
}: StreakResultsStatusProps) => {
  if (noHistory) {
    return <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>;
  }
  if (!hasSearched) {
    return <p className="text-sm text-slate-300">{idleHint}</p>;
  }
  if (isSearching) {
    return <p className="text-sm text-slate-300">{loadingHint}</p>;
  }
  if (searchError) {
    return <p className="text-sm text-rose-300">{searchError}</p>;
  }
  if (!hasResults) {
    return <p className="text-sm text-slate-300">집계할 이전 회차 데이터가 없습니다.</p>;
  }
  return children;
};
