export const parseNumberArrayResponse = (data: unknown, invalidMessage: string): number[] => {
  if (!Array.isArray(data)) {
    throw new Error(invalidMessage);
  }
  return data.filter((item): item is number => typeof item === 'number');
};
