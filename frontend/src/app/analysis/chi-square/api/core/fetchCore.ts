import { chiSquareApiUrl } from './url';

export const fetchChiSquareApi = async (
  pathWithQuery: string,
  init: RequestInit,
  baseUrl?: string,
): Promise<Response> => fetch(chiSquareApiUrl(pathWithQuery, baseUrl), init);
