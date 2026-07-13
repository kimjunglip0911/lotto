import { handle } from '@/server/http/handle';
import { optionalInt, requireInt } from '@/server/http/parse';
import { generateWheel } from '@/server/recommend/service';

export async function GET(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const count = requireInt(url.searchParams.get('count'), 'count');
    const drawNo = optionalInt(url.searchParams.get('draw_no'));
    const seed = optionalInt(url.searchParams.get('seed'));
    return Response.json(generateWheel(count, drawNo, seed));
  });
}
