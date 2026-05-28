/**
 * 홈 화면 카드 영역을 PNG로 바꿀 때, 첫 캡처가 실패했을 때 쓰는 보조 방식입니다.
 *
 * 하는 일
 * - 화면에 보이는 카드 묶음을 다른 도구로 그림 파일 데이터로 만듭니다.
 *
 * 무엇을 받고 무엇을 돌려주는지
 * - 받음: 캡처할 화면 영역(HTML 요소)
 * - 돌려줌: 그림 데이터 주소(문자열). 실패하면 null
 *
 * 역할 나눔
 * - 보통 `capHtmlImg.ts`를 먼저 시도하고, 그 결과가 없을 때만 호출합니다.
 * - 파일 저장·버튼 피드백: `dlGroupPng.ts`, `hooks/useGroupDl.ts`
 */

import html2canvas from 'html2canvas';

import { PNG_BG_COLOR } from '../../constants/home';

export const capCanvas = async (targetNode: HTMLElement): Promise<string | null> => {
  try {
    const canvas = await html2canvas(targetNode, {
      useCORS: true,
      logging: false,
      scale: Math.max(window.devicePixelRatio, 2),
      backgroundColor: PNG_BG_COLOR,
    });
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
};
