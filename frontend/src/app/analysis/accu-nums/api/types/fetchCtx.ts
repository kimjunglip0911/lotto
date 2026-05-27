// API 호출에 공통으로 쓰는 컨텍스트 타입.

/** 백테스트 스크립트 등에서 베이스 URL 오버라이드 시 사용. 미지정이면 NEXT_PUBLIC_API_URL */
export type AccumulatedNumbersFetchContext = {
  signal?: AbortSignal;
  baseUrl?: string;
};
