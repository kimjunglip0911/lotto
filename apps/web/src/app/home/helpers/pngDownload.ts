/** 카드 UI 영역을 PNG로 캡처해 다운로드한다 */

import html2canvas from 'html2canvas';
import { toPng as toPngFromHtmlToImage } from 'html-to-image';

import { PNG_BG_COLOR } from '../constants/home';

const captureWithHtmlToImage = async (targetNode: HTMLElement): Promise<string | null> => {
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

const captureWithHtml2Canvas = async (targetNode: HTMLElement): Promise<string | null> => {
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

export const downloadGroupImage = async (
  targetNode: HTMLElement | null,
  startSetNo: number,
  endSetNo: number,
): Promise<boolean> => {
  if (!targetNode || typeof document === 'undefined') return false;

  let dataUrl = await captureWithHtmlToImage(targetNode);
  if (!dataUrl) dataUrl = await captureWithHtml2Canvas(targetNode);
  if (!dataUrl) return false;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${startSetNo}~${endSetNo}세트.png`;
  link.click();
  return true;
};
