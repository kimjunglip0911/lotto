// 사이드바가 열렸을 때 배경을 어둡게 하고 탭하면 닫힘

interface SidebarBackdropProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SidebarBackdrop({ isOpen, onClose }: SidebarBackdropProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
      onClick={onClose}
    />
  );
}
