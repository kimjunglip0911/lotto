/**
 * 저장소에서 받은 분석 세트 한 줄을, 카드·통계·다운로드에 맞는 표시용 형태로 바꿉니다.
 *
 * 하는 일
 * - 여섯 개 번호 칸(num1~num6)을 하나의 번호 목록으로 묶습니다.
 * - 회차 번호가 없으면 사용자가 고른 회차, 그것도 없으면 0을 넣습니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: `LotterySetData[]`(DB 형태 세트 목록), 현재 선택 회차(`number | null`)
 * - 돌려줌: `LotterySetViewModel[]`(카드에 맞춘 표시용 형태)
 *
 * 역할 나눔
 * - 서버 응답을 세트 배열로 만드는 단계는 `logic/toLotterySets.ts`가 담당합니다.
 * - 화면에서 이 변환을 쓰는 조합은 `hooks/useHomeView.ts`가 담당합니다.
 * - 10세트씩 나누기·등수 계산은 `logic/chunkSets.ts`, `logic/rankSet.ts` 등이 이어서 처리합니다.
 *
 * 주의·화면에 미치는 영향
 * - 회차가 모두 비어 있으면 카드에 0회차로 보일 수 있습니다(기존과 동일).
 * - 번호 순서는 DB 칸 순서 그대로이며, 정렬은 하지 않습니다.
 */
import type { LotterySetData, LotterySetViewModel } from '../types/home';

export const toSetVm = (
  sets: LotterySetData[],
  selectedDraw: number | null,
): LotterySetViewModel[] =>
  sets.map((set) => ({
    id: set.id,
    numbers: [set.num1, set.num2, set.num3, set.num4, set.num5, set.num6],
    method: set.method,
    drawNo: set.draw_no ?? selectedDraw ?? 0,
  }));
