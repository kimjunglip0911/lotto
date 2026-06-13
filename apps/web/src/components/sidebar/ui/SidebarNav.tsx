import { MENU_ITEMS } from '../constants/menuItems';
import { isNavItemActive } from '../logic/navActive';
import type { SidebarMenuItem } from '../types/sidebarTypes';
import { NavGroup } from './NavGroup';
import { NavLink } from './NavLink';

// 메뉴 목록을 순회하며 링크·그룹 항목을 렌더

interface SidebarNavProps {
  pathname: string;
  onClose: () => void;
}

export function SidebarNav({ pathname, onClose }: SidebarNavProps) {
  const renderItem = (item: SidebarMenuItem) => {
    const isActive = isNavItemActive(pathname, item);

    if (item.children) {
      return (
        <NavGroup
          key={item.title}
          item={item}
          pathname={pathname}
          isActive={isActive}
          isExpanded={false}
          onToggle={() => {}}
          onClose={onClose}
        />
      );
    }

    return (
      <NavLink
        key={item.href ?? item.title}
        item={item}
        isActive={isActive}
        onClose={onClose}
      />
    );
  };

  return (
    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
      {MENU_ITEMS.map(renderItem)}
    </nav>
  );
}
