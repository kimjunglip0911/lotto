import { handle } from '@/server/http/handle';
import { optionalInt } from '@/server/http/parse';
import { getExclusionCandidates } from '@/server/recommend/service';

export async function GET(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const drawNo = optionalInt(url.searchParams.get('draw_no'));
    return Response.json(await getExclusionCandidates(drawNo));
  });
}
