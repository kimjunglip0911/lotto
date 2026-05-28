// 사이드바 상단 로고와 닫기 버튼

interface SidebarHeaderProps {
  onClose: () => void;
}

export function SidebarHeader({ onClose }: SidebarHeaderProps) {
  return (
    <div className="p-6 border-b border-card-border/20 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px' }}>
          monetization_on
        </span>
        <span className="text-white font-bold text-lg">LOTTO AI</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}
