// 연속 출현 분석 화면이 공통으로 쓰는 데이터 형태를 모아 둔 파일입니다.
// 당첨번호 한 줄(WinningNumberRow), 번호별 분석 결과(StreakResult)와
// 응답이 올바른지 검사하는 가드(isWinningNumberRow)를 함께 둡니다.

export type WinningNumberRow = {
  draw_no: number;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  bonus_num: number;
};

export type StreakResult = {
  /** 1~45 본번호 */
  number: number;
  /** 연속 구간의 가장 오래된(시작) 회차; streak이 0이면 null(1회만 출현 포함) */
  lastDrawNo: number | null;
  /** 연속으로 나온 회차 수 − 1 (직전 1회만 본번호 출현 → 0, 2회 연속 → 1) */
  streak: number;
  /** 연속 출현 길이가 전체 평균보다 김 */
  isCold: boolean;
};

export type StreakSearchProps = {
  availableDraws: number[];
  selectedDraw: string;
  setSelectedDraw: (draw: string) => void;
  isLoadingDraws: boolean;
  isSearching: boolean;
  handleSearch: () => void;
  isLoadingWinningNumber: boolean;
  winningNumberError: string | null;
  selectedWinningNumber: WinningNumberRow | null;
  statusMessage: string | null;
};

export type StreakSummaryProps = {
  canShowStreakPanels: boolean;
  analyzedDrawCount: number;
  maxStreak: number;
  averageStreak: number;
  coldNumbers: StreakResult[];
};

export type StreakTableProps = {
  hasSearched: boolean;
  noHistory: boolean;
  isSearching: boolean;
  searchError: string | null;
  streakResults: StreakResult[];
};

export const isWinningNumberRow = (value: unknown): value is WinningNumberRow => {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<WinningNumberRow>;
  return (
    typeof c.draw_no === 'number' &&
    typeof c.num1 === 'number' &&
    typeof c.num2 === 'number' &&
    typeof c.num3 === 'number' &&
    typeof c.num4 === 'number' &&
    typeof c.num5 === 'number' &&
    typeof c.num6 === 'number' &&
    typeof c.bonus_num === 'number'
  );
};
