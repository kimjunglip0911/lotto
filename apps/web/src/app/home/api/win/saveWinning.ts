/** 당첨번호를 서버에 저장한다 */

import { homeApiUrl } from '../core/url';

export const saveWinningNumbers = async (body: Record<string, unknown>): Promise<boolean> => {
  const response = await fetch(homeApiUrl('/api/drawings/save-winning'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.ok;
};
