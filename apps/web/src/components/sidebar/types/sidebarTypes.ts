// 사이드바 컴포넌트와 메뉴 항목에 쓰는 타입 정의

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SidebarChildItem {
  title: string;
  href: string;
}

export interface SidebarMenuItem {
  title: string;
  icon: string;
  href?: string;
  children?: SidebarChildItem[];
}
