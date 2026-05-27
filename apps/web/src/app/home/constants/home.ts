/** 홈 화면 기본값·레이아웃 상수 */

import type { InputNumber } from '../types/home';

export const GROUP_SIZE = 10;

export const SAVE_STATUS_RESET_DELAY_MS = 2000;

export const DOWNLOAD_FEEDBACK_MS = 1500;

export const EMPTY_WINNING_NUMBERS: InputNumber[] = Array(6).fill('');

export const EMPTY_BONUS: InputNumber = '';

export const INITIAL_RANK_COUNTS = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, fail: 0 } as const;

export const PNG_BG_COLOR = '#0b1220';
