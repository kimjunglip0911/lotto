'use client';

import { useMemo } from 'react';
import { resolveApiBaseUrl } from '@/app/recommend/api/core/url';

/** 클라이언트에서 추천 API 베이스 URL을 고정해 반환한다 */
export const useApiUrl = () => useMemo(() => resolveApiBaseUrl(), []);
