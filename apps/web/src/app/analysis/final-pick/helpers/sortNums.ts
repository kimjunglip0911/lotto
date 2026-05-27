export const sortUniqueNumbers = (nums: number[]): number[] => [...new Set(nums)].sort((a, b) => a - b);
