/** 구간(자리) 홀짝에 따라 은은한 번갈이 배경 */
export function positionGroupRowBg(position: number): string {
  return position % 2 === 1 ? 'bg-slate-800/35' : 'bg-slate-900/30';
}
