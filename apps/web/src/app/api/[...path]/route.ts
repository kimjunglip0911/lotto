import { proxyToApi } from '@/lib/proxyApiReq';

type RouteCtx = { params: Promise<{ path: string[] }> };

const handle = async (request: Request, ctx: RouteCtx): Promise<Response> => {
  const { path } = await ctx.params;
  return proxyToApi(request, path);
};

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;
