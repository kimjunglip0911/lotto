import { handle } from '@/server/http/handle';
import { requireInt } from '@/server/http/parse';
import * as drawings from '@/server/home/drawings';

export async function GET(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const drawNo = requireInt(url.searchParams.get('draw_no'), 'draw_no');
    return Response.json(await drawings.getByNo(drawNo));
  });
}
