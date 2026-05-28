import type { SidebarChildItem, SidebarMenuItem } from '../types/sidebarTypes';

// 현재 URL이 메뉴 항목과 일치하는지 판별하는 순수 함수

export function isGeneratorActive(pathname: string, href?: string): boolean {
  return href === '/' && (pathname === '/' || pathname === '/home');
}

export function isParentActive(
  pathname: string,
  children?: SidebarChildItem[],
): boolean {
  return children?.some((child) => pathname === child.href) ?? false;
}

export function isNavItemActive(pathname: string, item: SidebarMenuItem): boolean {
  if (item.href) {
    return pathname === item.href || isGeneratorActive(pathname, item.href);
  }
  return isParentActive(pathname, item.children);
}

export function isChildActive(pathname: string, childHref: string): boolean {
  return pathname === childHref;
}
