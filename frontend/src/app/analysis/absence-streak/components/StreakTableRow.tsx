import type { StreakResult } from '../types';

// 테이블 한 줄(번호 1개의 결과)을 그리는 컴포넌트입니다.
// 저빈도 후보로 판정된 줄은 주황색 강조를 적용해 한눈에 띄게 만듭니다.

type StreakTableRowProps = {
  row: StreakResult;
};

export const StreakTableRow = ({ row }: StreakTableRowProps) => (
  <tr
    className={`border-b border-white/5 transition-colors ${
      row.isCold ? 'bg-orange-500/10 hover:bg-orange-500/15' : 'hover:bg-white/3'
    }`}
  >
    <td className="py-2 pr-3">
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
          row.isCold ? 'bg-orange-500/30 text-orange-200' : 'bg-white/10 text-white'
        }`}
      >
        {row.number}
      </span>
    </td>
    <td className="py-2 pr-3 text-right tabular-nums text-slate-300">
      {row.lastDrawNo !== null ? `${row.lastDrawNo}회` : '출현 기록 없음'}
    </td>
    <td className={`py-2 pr-3 text-right tabular-nums font-semibold ${row.isCold ? 'text-orange-300' : 'text-white'}`}>
      {row.streak}회차
    </td>
    <td className="py-2 text-center">
      {row.isCold ? (
        <span className="text-xs font-semibold text-orange-300 bg-orange-500/20 rounded-md px-2 py-0.5">저빈도 후보</span>
      ) : (
        <span className="text-xs text-slate-500">-</span>
      )}
    </td>
  </tr>
);
