// 누적 번호 분석에서 외부에 공개할 fetch 함수와 컨텍스트 타입만 재내보낸다.

export type { AccumulatedNumbersFetchContext } from './types/fetchCtx';
export { fetchDrawNumbers } from './draw/drawNums';
export { fetchWinningNumberByDraw } from './win/winByDraw';
export { fetchWinningNumbersRange } from './win/winRange';
