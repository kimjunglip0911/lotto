import type { EqualBuckets, EqualDataState } from '../types/equal';

export const EMPTY_BUCKETS: EqualBuckets = {
  zero: [],
  one: [],
  two: [],
  threePlus: [],
};

export const EMPTY_EQUAL_DATA: EqualDataState = {
  isLoading: true,
  loadError: null,
  analyzedDraws: 0,
  buckets: EMPTY_BUCKETS,
};
