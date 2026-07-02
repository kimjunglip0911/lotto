import { formatGap, formatList } from '../../helpers/formatGap';
import type { GapRow } from '../../types/interval';

/**
 * 번호별 간격 표의 행을 그리는 파일입니다.
 *
 * 하는 일
 * - 번호, 출현 회차, 계산 간격, 평균·최대 값을 한 줄씩 보여 줍니다.
 *
 * 실패·주의
 * - 계산할 간격이 없으면 통계 칸은 `-`로 표시합니다.
 */

type Props = {
  rows: GapRow[];
};

export const GapTableRows = ({ rows }: Props) => (
  <>
    {rows.map((row) => (
      <tr key={row.number} className="border-b border-white/[0.06] hover:bg-white/[0.03]">
        <td className="py-2 px-3 text-center text-sky-200 font-semibold tabular-nums">
          {row.number}
        </td>
        <td className="py-2 px-3 text-slate-300 text-xs leading-relaxed">
          {formatList(row.draws)}
        </td>
        <td className="py-2 px-3 text-slate-300 text-xs leading-relaxed">
          {formatList(row.gaps)}
        </td>
        <td className="py-2 px-3 text-right text-slate-200 tabular-nums">
          {formatGap(row.avgGap)}
        </td>
        <td className="py-2 px-3 text-right text-slate-200 tabular-nums">
          {formatGap(row.maxGap)}
        </td>
      </tr>
    ))}
  </>
);
