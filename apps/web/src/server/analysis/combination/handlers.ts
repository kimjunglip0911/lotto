import { loadComboBands } from './load';

export async function getComboBands(): Promise<Response> {
  return Response.json(await loadComboBands());
}
