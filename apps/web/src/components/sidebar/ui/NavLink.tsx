import Link from 'next/link';
import type { SidebarMenuItem } from '../types/sidebarTypes';

// 단일 링크 메뉴 항목(생성기, 추천 등)

interface NavLinkProps {
  item: SidebarMenuItem;
  isActive: boolean;
  onClose: () => void;
}

export function NavLink({ item, isActive, onClose }: NavLinkProps) {
  return (
    <Link
      href={item.href ?? '#'}
      onClick={onClose}
      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group cursor-pointer ${
        isActive
          ? 'bg-primary/20 text-white'
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span
        className={`material-symbols-outlined ${isActive ? 'text-primary' : 'group-hover:text-primary'}`}
      >
        {item.icon}
      </span>
      <span className="font-medium">{item.title}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
      )}
    </Link>
  );
}
