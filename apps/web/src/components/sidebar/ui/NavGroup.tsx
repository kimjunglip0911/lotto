import type { SidebarMenuItem } from '../types/sidebarTypes';
import { NavChildLink } from './NavChildLink';

// 펼침 가능한 하위 메뉴(분석 등)

interface NavGroupProps {
  item: SidebarMenuItem;
  isActive: boolean;
  isExpanded: boolean;
  pathname: string;
  onToggle: () => void;
  onClose: () => void;
}

export function NavGroup({
  item,
  pathname,
  isActive,
  isExpanded,
  onToggle,
  onClose,
}: NavGroupProps) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group cursor-pointer ${
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
        <span
          className={`material-symbols-outlined ml-auto transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        >
          expand_more
        </span>
      </button>

      {isExpanded && item.children && (
        <div className="ml-6 pl-4 border-l border-card-border/40 space-y-1">
          {item.children.map((child) => (
            <NavChildLink
              key={child.href}
              title={child.title}
              href={child.href}
              pathname={pathname}
              onClose={onClose}
            />
          ))}
        </div>
      )}
    </div>
  );
}
