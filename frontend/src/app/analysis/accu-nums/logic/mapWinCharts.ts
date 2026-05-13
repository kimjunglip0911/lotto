/** 윈도 설정과 집계 맵으로 차트 한 줄씩에 넣을 데이터 배열을 만든다. */

import type { WindowChartData, WindowConfig, WindowCountResultMap } from '../types';
import { createEmptyCountResult } from './numCounts';

export const mapWinCharts = (
  cfgs: readonly WindowConfig[],
  winMap: WindowCountResultMap
): WindowChartData[] =>
  cfgs.map((config) => {
    const result = winMap[config.key] ?? createEmptyCountResult();
    return {
      key: config.key,
      title: config.title,
      counts: result.counts,
      analyzedDrawCount: result.analyzedDrawCount,
      noDataMessage: config.noDataMessage,
    };
  });
