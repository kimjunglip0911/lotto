/**
 * 홈 화면에서 공통으로 쓰는 상수 모음.
 * 화면/훅/헬퍼가 같은 기본값을 공유하도록 한 곳에서 관리한다.
 */

import type { InputNumber } from '../types/home';

/** 조합 카드 그룹 표시 크기 */
export const GROUP_SIZE = 10;

/** 저장 완료/실패 상태를 idle로 되돌리는 지연 시간(ms) */
export const SAVE_STATUS_RESET_DELAY_MS = 2000;

/** PNG 저장 피드백 표시 시간(ms) */
export const DOWNLOAD_FEEDBACK_MS = 1500;

/** 당첨 번호 입력의 초기 6칸 값 */
export const EMPTY_WINNING_NUMBERS: InputNumber[] = Array(6).fill('');

/** 보너스 번호 입력의 초기값 */
export const EMPTY_BONUS: InputNumber = '';

/** 시뮬레이션 등수 카운트 초기값 */
export const INITIAL_RANK_COUNTS = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, fail: 0 } as const;

/** PNG 캡처 배경색 */
export const PNG_BG_COLOR = '#0b1220';
