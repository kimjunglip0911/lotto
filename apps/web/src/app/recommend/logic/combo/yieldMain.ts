/** 긴 생성 루프 중 UI 양보 */

export const yieldToMain = async (): Promise<void> => {
  const sched = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (sched?.yield) {
    await sched.yield();
    return;
  }
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
};

export const DEFAULT_REPAIR_YIELD_EVERY = 64;

export const MAX_PRIORITY_ROUNDS = 24;
