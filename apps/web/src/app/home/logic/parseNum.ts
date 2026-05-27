/** 번호 입력 필드 문자열을 InputNumber로 파싱 */

import type { InputNumber } from '../types/home';

export const parseInputNumber = (value: string): InputNumber => {
  if (value === '') return '';
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? '' : parsed;
};
