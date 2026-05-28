/**
 * 홈 화면 카드 영역을 PNG로 바꿀 때, 첫 번째로 시도하는 캡처 방식입니다.
 *
 * 하는 일
 * - 화면에 보이는 카드 묶음을 그림 파일 데이터로 만듭니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 캡처할 화면 영역(HTML 요소)
 * - 돌려줌: 그림 데이터 주소(문자열). 실패하면 null
 *
 * 역할 나눔
 * - 첫 시도가 실패하면 `capCanvas.ts`로 같은 영역을 다시 캡처합니다.
 * - 파일 저장·버튼 피드백: `dlGroupPng.ts`, `hooks/useGroupDl.ts`
 */

import { toPng as toPngFromHtmlToImage } from 'html-to-image';

import { PNG_BG_COLOR } from '../../constants/home';

export const capHtmlImg = async (targetNode: HTMLElement): Promise<string | null> => {
  try {
    return await toPngFromHtmlToImage(targetNode, {
      cacheBust: true,
      pixelRatio: Math.max(window.devicePixelRatio, 2),
      backgroundColor: PNG_BG_COLOR,
      fontEmbedCSS: '',
    });
  } catch {
    return null;
  }
};
