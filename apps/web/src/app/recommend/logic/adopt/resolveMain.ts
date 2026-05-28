import { fetchWinningOne } from '@/app/recommend/api/adopt/fetchWinning';
import { parseWinRow } from '@/app/recommend/logic/adopt/parseWinRows';

/** 당첨 단건 응답에서 본번호·안내 문구를 결정한다(미추첨 시 전회차 대체) */

export type ResolvedMain = { main: number[]; infoMessage: string | null };

export const resolveMainNumbers = async (
  apiUrl: string,
  drawNo: number,
  winningRes: Response,
): Promise<ResolvedMain | { error: string }> => {
  if (winningRes.ok) {
    const parsed = parseWinRow(await winningRes.json());
    if ('error' in parsed) return parsed;
    return { main: parsed.main, infoMessage: null };
  }

  if (winningRes.status === 404 && drawNo > 1) {
    const prevRes = await fetchWinningOne(apiUrl, drawNo - 1);
    if (!prevRes.ok) {
      return {
        error:
          prevRes.status === 404
            ? `${drawNo}회·${drawNo - 1}회 당첨번호를 모두 찾을 수 없습니다.`
            : `전회차 당첨 조회 실패: ${prevRes.status}`,
      };
    }
    const parsed = parseWinRow(await prevRes.json());
    if ('error' in parsed) {
      return { error: '전회차 당첨번호 응답 형식이 올바르지 않습니다.' };
    }
    return {
      main: parsed.main,
      infoMessage: `${drawNo}회는 아직 당첨번호가 없어, 카이제곱 워크포워드 기준 번호로 ${drawNo - 1}회 당첨 본번호 6개를 사용했습니다.`,
    };
  }

  throw new Error(`winning-number: ${winningRes.status}`);
};
