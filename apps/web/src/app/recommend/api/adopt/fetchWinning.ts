import { chiSquareApiUrl } from '@/app/recommend/api/core/url';

/** 카이제곱 당첨 단건·범위 API를 호출한다 */

export const fetchWinningOne = async (apiUrl: string, drawNo: number) =>
  fetch(chiSquareApiUrl(`winning-number?draw_no=${drawNo}`, apiUrl));

export const fetchWinningRange = async (apiUrl: string, drawNo: number) =>
  fetch(chiSquareApiUrl(`winning-numbers-range?draw_no=${drawNo}`, apiUrl));
