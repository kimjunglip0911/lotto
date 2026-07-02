import { useEffect, useState } from 'react';
import { loadGapHistory } from '../api/loadHistory';
import { buildGapRows } from '../logic/buildGapRows';
import type { GapRow } from '../types/interval';

/**
 * 번호별 간격 화면에서 쓸 데이터를 준비하는 훅입니다.
 *
 * 하는 일
 * - 저장된 당첨 이력을 불러와 번호별 간격 통계로 바꿉니다.
 *
 * 무엇을 돌려주는지
 * - 로딩 여부, 오류 문구, 전체 회차 수, 번호별 표 행을 돌려줍니다.
 *
 * 실패·주의
 * - 이력을 불러오지 못하면 표 대신 오류 안내가 보이도록 빈 목록을 둡니다.
 */

export type UseGapDataResult = {
  isLoading: boolean;
  loadError: string | null;
  totalDraws: number;
  rows: GapRow[];
};

const EMPTY_DATA: UseGapDataResult = {
  isLoading: true,
  loadError: null,
  totalDraws: 0,
  rows: [],
};

export const useGapData = (): UseGapDataResult => {
  const [data, setData] = useState<UseGapDataResult>(EMPTY_DATA);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const load = async () => {
      try {
        const history = await loadGapHistory({ signal: abortController.signal });
        if (!isMounted) return;
        setData({
          isLoading: false,
          loadError: null,
          totalDraws: history.length,
          rows: buildGapRows(history),
        });
      } catch (error) {
        if (abortController.signal.aborted || !isMounted) return;
        console.error('Error loading interval data:', error);
        setData({
          isLoading: false,
          loadError: '데이터를 불러오지 못했습니다.',
          totalDraws: 0,
          rows: [],
        });
      }
    };

    void load();
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  return data;
};
