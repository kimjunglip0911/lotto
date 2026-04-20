'use client';

import React from 'react';

interface AnalysisResultListProps {
  statusMessage?: string | null;
  sets?: unknown[];
  loading?: boolean;
  error?: string | null;
}

export const AnalysisResultList: React.FC<AnalysisResultListProps> = ({ statusMessage, sets, loading, error }) => {
  void sets;
  void loading;
  void error;

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="rounded-xl border border-card-border/60 bg-card/30 px-5 py-6 text-sm text-slate-300 space-y-2">
        <h4 className="text-base font-semibold text-white">신규 생성 로직 연결 대기</h4>
        <p>기존 결과 조회/렌더링 영역은 정리되었습니다. 신규 추천 번호 생성 및 저장 로직 연결 후 결과 표시 영역을 확장할 예정입니다.</p>
        {statusMessage ? <p className="text-emerald-300">{statusMessage}</p> : null}
      </div>
    </div>
  );
};

