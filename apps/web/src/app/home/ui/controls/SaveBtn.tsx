/** 당첨번호 저장 버튼 */

import { Check, Loader2, Save } from 'lucide-react';

import type { SaveStatus } from '../../types/home';

interface SaveBtnProps {
  canSave: boolean;
  isSaving: boolean;
  saveStatus: SaveStatus;
  saveWinning: () => void;
}

export function SaveBtn({ canSave, isSaving, saveStatus, saveWinning }: SaveBtnProps) {
  const label = isSaving ? '저장 중...' : saveStatus === 'success' ? '저장 완료' : '저장';

  return (
    <button
      type="button"
      disabled={!canSave}
      onClick={saveWinning}
      className={`ml-1 flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
        saveStatus === 'success'
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
          : canSave
            ? 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:border-primary/60 cursor-pointer'
            : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
      }`}
    >
      {isSaving ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : saveStatus === 'success' ? (
        <Check className="w-4 h-4" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}
