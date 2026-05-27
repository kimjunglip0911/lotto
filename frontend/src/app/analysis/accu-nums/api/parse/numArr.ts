// 숫자 배열 응답의 형태를 검증하고 안전한 값만 반환한다.

export const parseNumberArrayResponse = (data: unknown, invalidMessage: string): number[] => {
  if (!Array.isArray(data)) {
    throw new Error(invalidMessage);
  }
  return data.filter((item): item is number => typeof item === 'number');
};
