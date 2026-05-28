import { TARGET_SET_COUNT } from '@/app/recommend/constants/comboThresholds';

/** 저장 세트 조회·초기 화면 안내 문구 */

export const initialStatusMessage = (): string =>
  `생성 및 저장을 실행하면 통합 채택·조합 분석 기준으로 ${TARGET_SET_COUNT}세트를 만듭니다.`;

export const savedLoadingMessage = (drawNo: number): string =>
  `${drawNo}회차 저장된 추천 세트를 불러오는 중입니다...`;

export const savedSuccessMessage = (drawNo: number, count: number): string =>
  `${drawNo}회차 기준 저장된 ${count}개 추천 세트를 불러왔습니다.`;

export const savedEmptyMessage = (drawNo: number): string =>
  `${drawNo}회차 기준 저장된 추천 세트가 없습니다. 생성 및 저장을 실행해 보세요.`;

export const savedErrorMessage = (drawNo: number): string =>
  `${drawNo}회차 세트 조회 중 오류가 발생했습니다.`;
