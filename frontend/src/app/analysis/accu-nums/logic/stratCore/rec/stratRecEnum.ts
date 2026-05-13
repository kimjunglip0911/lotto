/** 번호 풀(정렬됨)에서 4개를 고르는 모든 조합을 만든다(개수가 적을 때만 쓴다). */

export function enumerateFourCombos(sortedPool: number[]): number[][] {
  const combos: number[][] = [];
  const generated: number[] = [];
  const dfs = (start: number) => {
    if (generated.length === 4) {
      combos.push([...generated]);
      return;
    }
    for (let i = start; i < sortedPool.length; i += 1) {
      generated.push(sortedPool[i]);
      dfs(i + 1);
      generated.pop();
    }
  };
  dfs(0);
  return combos;
}
