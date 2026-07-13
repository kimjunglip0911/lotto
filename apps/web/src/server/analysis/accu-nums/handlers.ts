import * as accu from '@/server/analysis/accu-nums/accu';
import * as snap from '@/server/analysis/accu-nums/snapshot';
import { requireInt } from '@/server/http/parse';
import { parseSnapshotSave } from '@/server/validate/snapshot';

/** accu-nums / accumulated-numbers 공통 핸들러 */
export async function getDrawNumbers(): Promise<Response> {
  return Response.json(await accu.drawNumbers());
}

export async function getWinningRange(url: URL): Promise<Response> {
  const drawNo = requireInt(url.searchParams.get('draw_no'), 'draw_no');
  return Response.json(await accu.winningRange(drawNo));
}

export async function getWinningNumber(url: URL): Promise<Response> {
  const drawNo = requireInt(url.searchParams.get('draw_no'), 'draw_no');
  return Response.json(await accu.winningNumber(drawNo));
}

export async function getWinningWindow(url: URL): Promise<Response> {
  const drawNo = requireInt(url.searchParams.get('draw_no'), 'draw_no');
  const windowSize = requireInt(
    url.searchParams.get('window_size'),
    'window_size',
  );
  return Response.json(await accu.winningWindow(drawNo, windowSize));
}

export async function postSnapshot(req: Request): Promise<Response> {
  const body = parseSnapshotSave(await req.json());
  await snap.saveSnapshot(body);
  return Response.json({ message: '저장되었습니다.' });
}

export async function getSnapshot(url: URL): Promise<Response> {
  const drawNo = requireInt(url.searchParams.get('draw_no'), 'draw_no');
  return Response.json(await snap.getSnapshot(drawNo));
}
