/**
 * 당첨 통계를 아직 계산할 수 없는 상황에서 보여주는 안내 블록이다.
 * 사용자가 어떤 입력을 마저 채워야 하는지 쉽게 이해하도록 짧은 문구를 제공한다.
 * 이 파일은 안내 문구 표시만 담당하며, 계산 여부 판단은 `RankStats`에서 처리한다.
 */
export function RankGuide() {
  return (
    <div className="text-center py-8 text-slate-400">
      <span className="material-symbols-outlined text-4xl mb-2 opacity-50">info</span>
      <p>정확한 당첨 번호 6개와 보너스 번호가 입력되면 당첨 통계가 표시됩니다.</p>
    </div>
  );
}
