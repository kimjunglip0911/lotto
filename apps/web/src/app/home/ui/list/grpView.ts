import type { LotterySetViewModel } from '../../types/home';

export const grpBtnLabel = (status: 'success' | 'error' | null) =>
  status === 'success' ? '다운로드 완료' : status === 'error' ? '다운로드 실패' : '10세트 다운로드';

export const grpStart = (groupIndex: number, groupSize: number) =>
  groupIndex * groupSize;

export const cardKey = (setInfo: LotterySetViewModel, cardIndex: number) =>
  setInfo.id ?? `${setInfo.drawNo}-${setInfo.numbers.join('-')}-${cardIndex}`;
