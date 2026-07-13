import { handle } from '@/server/http/handle';
import { requireInt } from '@/server/http/parse';
import { getDrawDuplicateInsight } from '@/server/recommend/save';

export async function GET(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const drawNo = requireInt(url.searchParams.get('draw_no'), 'draw_no');
    const count = requireInt(url.searchParams.get('count'), 'count');
    return Response.json(getDrawDuplicateInsight(drawNo, count));
  });
}
