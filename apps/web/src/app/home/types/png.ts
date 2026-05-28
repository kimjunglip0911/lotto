/** 10세트 PNG 다운로드 버튼 피드백 결과 */

export type PngDlStatus = 'success' | 'error';

export type PngDlState = { groupIndex: number; status: PngDlStatus } | null;
