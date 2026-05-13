import type { WindowKey } from './window';

/** 회차 묶음 기준 번호별 집계 결과와 윈도우별 집계 맵 타입. */
export type CountResult = {
  counts: number[];
  analyzedDrawCount: number;
};

export type WindowCountResultMap = Record<WindowKey, CountResult>;
