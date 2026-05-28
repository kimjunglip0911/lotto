/**
 * 홈 화면에서 10세트 카드 묶음을 PNG 파일로 저장할 때 쓰는 헬퍼입니다.
 *
 * 하는 일
 * - 카드 영역을 그림으로 만든 뒤, 브라우저 저장 대화상자로 내려받게 합니다.
 * - 첫 캡처가 안 되면 다른 방식으로 한 번 더 시도합니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 캡처할 영역, 세트 시작·끝 번호(파일 이름에 사용)
 * - 돌려줌: 저장 시도가 끝났으면 true, 영역이 없거나 캡처가 모두 실패하면 false
 *
 * 역할 나눔
 * - 1차 캡처: `capHtmlImg.ts` · 2차 캡처: `capCanvas.ts`
 * - 다운로드 버튼·완료/실패 문구: `hooks/useGroupDl.ts`
 *
 * 실패 시 화면 영향
 * - false이면 훅이 「다운로드 실패」 피드백을 잠시 보여 줍니다.
 */

import { capCanvas } from './capCanvas';
import { capHtmlImg } from './capHtmlImg';

export const dlGroupPng = async (
  targetNode: HTMLElement | null,
  startSetNo: number,
  endSetNo: number,
): Promise<boolean> => {
  if (!targetNode || typeof document === 'undefined') return false;

  let dataUrl = await capHtmlImg(targetNode);
  if (!dataUrl) dataUrl = await capCanvas(targetNode);
  if (!dataUrl) return false;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${startSetNo}~${endSetNo}세트.png`;
  link.click();
  return true;
};
