import { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';

/** 생성 버튼 진행 단계 안내 문구 */

export const GEN_STATUS_LOADING =
  '통합 채택 번호와 조합 통계를 불러오는 중입니다...';

export const genStatusGenerating = (): string =>
  `조합 제약을 적용해 ${TARGET_SET_COUNT}세트를 생성하는 중입니다...`;

export const GEN_STATUS_SAVING = '서버에 저장하는 중입니다...';

/** 채택 안내와 조합 요약 줄을 합친다 */

export const mergeSummaryLines = (
  infoMessage: string | null,
  summaryLines: readonly string[],
): string[] => [...(infoMessage ? [infoMessage] : []), ...summaryLines];

type SuccessStatusOpts = {
  drawNo: number;
  count: number;
  targetCount: number;
  infoMessage: string | null;
  warning: string | null;
};

/** 생성·저장 완료 후 화면 하단에 보여 줄 상태 문구 */

export const buildSuccessStatusMessage = ({
  drawNo,
  count,
  targetCount,
  infoMessage,
  warning,
}: SuccessStatusOpts): string => {
  const refNote = infoMessage ? ` ${infoMessage}` : '';
  const shortOfGoal =
    count < targetCount ? ` 목표 ${targetCount}세트에 ${targetCount - count}개 부족합니다.` : '';
  const tail = warning ? ` ${warning}` : '';
  return `${drawNo}회차 기준으로 ${count}개 세트를 생성·저장했습니다.${shortOfGoal}${refNote}${tail}`;
};
