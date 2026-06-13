/** 정렬 유틸 */

export const sortPickedAsc = (picked: readonly number[]): number[] => [...picked].sort((a, b) => a - b);
