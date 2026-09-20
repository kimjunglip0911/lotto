/** 균등 분석: 출현 횟수 버킷과 화면 상태 타입. */

export type EqualBuckets = {
  zero: number[];
  one: number[];
  two: number[];
  threePlus: number[];
};

export type EqualDataState = {
  isLoading: boolean;
  loadError: string | null;
  analyzedDraws: number;
  buckets: EqualBuckets;
  /** 추천에서 빼는 번호: 최근 6회 2회 이상 */
  excludeNums: number[];
};
