/**
 * 이 파일은 당첨 번호 저장 버튼의 모양과 문구를 정리해서 보여준다.
 * 화면에서 저장 가능 여부, 저장 진행 여부, 저장 성공 여부를 받아
 * 버튼 아이콘/문구/색상을 맞춰 사용자에게 현재 상태를 바로 알린다.
 * 저장할 수 없는 상태에서는 버튼 클릭이 막혀 오입력을 줄이고,
 * 저장 실패가 나더라도 버튼은 기본 상태로 남아 다시 시도할 수 있다.
 */

import { Check, Loader2, Save } from 'lucide-react';

import type { SaveStatus } from '../../types/home';

interface SaveBtnProps {
  canSave: boolean;
  isSaving: boolean;
  saveStatus: SaveStatus;
  saveWinning: () => void;
}

const baseBtnCls =
  'ml-1 flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-sm transition-all whitespace-nowrap';
const successCls = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
const enabledCls =
  'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:border-primary/60 cursor-pointer';
const disabledCls = 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed';

const getLabel = (isSaving: boolean, saveStatus: SaveStatus) => {
  if (isSaving) return '저장 중...';
  if (saveStatus === 'success') return '저장 완료';
  return '저장';
};

const getIcon = (isSaving: boolean, saveStatus: SaveStatus) => {
  if (isSaving) return <Loader2 className="w-4 h-4 animate-spin" />;
  if (saveStatus === 'success') return <Check className="w-4 h-4" />;
  return <Save className="w-4 h-4" />;
};

const getBtnCls = (canSave: boolean, saveStatus: SaveStatus) => {
  if (saveStatus === 'success') return `${baseBtnCls} ${successCls}`;
  if (canSave) return `${baseBtnCls} ${enabledCls}`;
  return `${baseBtnCls} ${disabledCls}`;
};

export function SaveBtn({ canSave, isSaving, saveStatus, saveWinning }: SaveBtnProps) {
  const label = getLabel(isSaving, saveStatus);
  const icon = getIcon(isSaving, saveStatus);
  const btnCls = getBtnCls(canSave, saveStatus);

  return (
    <button
      type="button"
      disabled={!canSave}
      onClick={saveWinning}
      className={btnCls}
    >
      {icon}
      {label}
    </button>
  );
}
