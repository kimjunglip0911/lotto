'use client'

import { useMemo } from 'react'

export function useRecommendApiUrl() {
  return useMemo(() => process.env.NEXT_PUBLIC_API_URL || '', [])
}
