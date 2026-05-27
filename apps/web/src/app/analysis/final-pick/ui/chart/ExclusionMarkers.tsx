type Props = {
  number: number;
  streakSet: Set<number>;
  accumulatedSet: Set<number>;
  chiSquareExcludedSet: Set<number>;
};

/** 막대 위 제외 표시 동그라미(연속·카이·누적). */
export function ExclusionMarkers({ number, streakSet, accumulatedSet, chiSquareExcludedSet }: Props) {
  const streak = streakSet.has(number);
  const accumulated = accumulatedSet.has(number);
  const chiExcluded = chiSquareExcludedSet.has(number);
  const hasAny = streak || accumulated || chiExcluded;
  return (
    <div className="flex h-[26px] shrink-0 flex-col items-center justify-end gap-0.5" aria-hidden={!hasAny}>
      {streak ? (
        <span className="block size-1.5 shrink-0 rounded-full bg-sky-400" aria-label="연속 미출현 분석 후보 제외" />
      ) : null}
      {chiExcluded ? (
        <span className="block size-1.5 shrink-0 rounded-full bg-red-500" aria-label="카이제곱 검정 워크포워드 후보 제외" />
      ) : null}
      {accumulated ? (
        <span className="block size-1.5 shrink-0 rounded-full bg-amber-400" aria-label="누적 번호 분석 후보 제외" />
      ) : null}
    </div>
  );
}
