/**
 * 분석 세트 목록을 고정 개수(보통 10세트) 묶음으로 나눕니다.
 *
 * 하는 일
 * - 카드 목록을 화면에 10세트씩 보여 주기 위해, 연속된 구간으로 잘라 둡니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 표시용 세트 목록(`LotterySetViewModel[]`), 묶음 크기(`number`, 보통 `constants/home.ts`의 `GROUP_SIZE`)
 * - 돌려줌: 묶음 배열(`LotterySetViewModel[][]`). 마지막 묶음은 10개보다 적을 수 있습니다.
 *
 * 역할 나눔
 * - 묶음을 화면에 그리는 곳: `ui/list/SetList.tsx`
 * - PNG 파일 이름의 세트 번호 범위: `logic/grpSetRange.ts`
 * - DB 형태를 표시용으로 바꾸는 단계: `logic/toSetVm.ts`
 *
 * 주의·화면에 미치는 영향
 * - 묶음 크기가 0 이하이거나 세트가 없으면 빈 배열을 돌려 줍니다(그룹이 하나도 안 보임).
 * - 실제 화면에서는 `GROUP_SIZE=10`만 쓰므로, 정상 데이터에서는 기존과 같이 1~3개 그룹이 나옵니다.
 */
import type { LotterySetViewModel } from '../types/home';

export const chunkSets = (sets: LotterySetViewModel[], size: number): LotterySetViewModel[][] => {
  if (size <= 0 || sets.length === 0) return [];
  return Array.from({ length: Math.ceil(sets.length / size) }, (_, i) =>
    sets.slice(i * size, (i + 1) * size),
  );
};
