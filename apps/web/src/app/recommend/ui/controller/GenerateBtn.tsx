'use client';

/** 생성·저장 실행 버튼 */

type Props = {
  onGenerateAndSave: () => void;
  isGenerating: boolean;
  disabled: boolean;
};

export const GenerateBtn = ({ onGenerateAndSave, isGenerating, disabled }: Props) => (
  <button
    type="button"
    onClick={onGenerateAndSave}
    disabled={disabled}
    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-[0_10px_20px_-10px_rgba(59,130,246,0.6)] transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
  >
    {isGenerating ? (
      <span className="material-symbols-outlined animate-spin text-[22px]">progress_activity</span>
    ) : (
      <span className="material-symbols-outlined text-[22px] text-yellow-300">auto_awesome</span>
    )}
    {isGenerating ? '생성 및 저장 처리 중...' : '생성 및 저장 실행'}
  </button>
);
