/**
 * 번호별 간격 화면에서 쓰는 번호 범위 상수입니다.
 *
 * 하는 일
 * - 로또 주번호 범위인 1~45번 목록을 한 곳에서 제공합니다.
 *
 * 무엇을 돌려주는지
 * - 화면 표와 계산 로직이 함께 쓰는 번호 배열입니다.
 */

import { NUMBER_RANGE_MAX } from '@/lib/accu-nums/constants';

export const LOTTO_NUMBERS = Array.from({ length: NUMBER_RANGE_MAX }, (_, index) => index + 1);
