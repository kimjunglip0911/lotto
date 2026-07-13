import { handle } from '@/server/http/handle';
import { generateAndSave } from '@/server/recommend/save';
import { parseGenerateSave } from '@/server/validate/recommend';

export async function POST(req: Request) {
  return handle(async () => {
    const body = parseGenerateSave(await req.json());
    return Response.json(await generateAndSave(body));
  });
}
