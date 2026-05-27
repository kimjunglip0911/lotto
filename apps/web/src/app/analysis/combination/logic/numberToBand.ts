import { BAND_WIDTH } from '../constants/bandLabels';

/** 1~45를 5단위 구간 인덱스(0~8)로 매핑 — 조합 세트 검증에서 동일 규칙 재사용 */
export function numberToBandIndex(n: number): number {
  const clamped = Math.min(45, Math.max(1, Math.round(n)));
  return Math.floor((clamped - 1) / BAND_WIDTH);
}
