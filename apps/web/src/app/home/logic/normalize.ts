/**
 * 당첨번호·보너스 입력을, 세트별 당첨 유무·등수를 볼 때 쓰는 숫자로 바꿉니다.
 *
 * 하는 일
 * - 한 칸 입력을 숫자로 바꾸거나, 비어 있으면 건너뜁니다.
 * - 6칸 당첨번호를 숫자만 모은 배열로 만듭니다.
 * - 6개가 모두 채워졌고 0이 없을 때만 등수 집계를 할 수 있다고 판단합니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 입력 한 칸(`InputNumber`), 6칸 배열(`InputNumber[]`), 정리된 숫자 배열(`number[]`)
 * - 돌려줌: 숫자 또는 null(`toNumOrNull`), 유효 숫자만 담은 배열(`toWinNums`), 집계 가능 여부(`canCalcWins`)
 *
 * 역할 나눔
 * - 화면 입력 문자열을 칸 값으로 바꾸는 곳: `logic/parseNum.ts`의 `toInputNum`
 * - 세트별 등수·건수를 모으는 곳: `logic/rankStats.ts`
 * - 집계 결과를 보여 주는 화면: `ui/stats/RankStats.tsx`
 *
 * 주의·화면에 미치는 영향
 * - 6칸이 다 채워지지 않았거나 0이 있으면 `canCalcWins`는 false입니다. 이때는 당첨 통계만 안내 문구로 보입니다.
 * - 1~45 범위 검사는 이 파일이 아니라 `types/win.ts`의 `isValidLottoNumber`에서 합니다.
 */
import type { InputNumber } from '../types/home';

export const toNumOrNull = (value: InputNumber): number | null => {
  const parsedValue = Number.parseInt(String(value), 10);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

export const toWinNums = (winningNumbers: InputNumber[]): number[] =>
  winningNumbers
    .map(toNumOrNull)
    .filter((number): number is number => number !== null);

export const canCalcWins = (winningNumbers: number[]): boolean =>
  winningNumbers.length === 6 && !winningNumbers.some((number) => number === 0);
