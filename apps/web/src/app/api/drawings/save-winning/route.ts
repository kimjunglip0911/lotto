import { handle } from '@/server/http/handle';
import * as drawings from '@/server/home/drawings';
import { parseSaveWinning } from '@/server/validate/winning';

export async function POST(req: Request) {
  return handle(async () => {
    const body = parseSaveWinning(await req.json());
    return Response.json(await drawings.saveWinning(body));
  });
}
