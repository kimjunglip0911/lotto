/** 구간별 번호 확률 표 헤더. */
export function BandHead() {
  return (
    <thead className="sticky top-0 z-10">
      <tr className="border-b border-card-border/30 bg-black/80 backdrop-blur-sm">
        <th scope="col" className="py-2 px-3 font-semibold text-slate-300 text-center align-middle">
          순위
        </th>
        <th scope="col" className="py-2 px-3 font-semibold text-slate-300 text-center align-middle">
          구간
        </th>
        <th scope="col" className="py-2 px-3 font-semibold text-slate-300">
          번호
        </th>
        <th scope="col" className="py-2 px-3 font-semibold text-slate-300 text-right">
          총 회차
        </th>
        <th scope="col" className="py-2 px-3 font-semibold text-slate-300 text-right">
          비율 (%)
        </th>
      </tr>
    </thead>
  );
}
