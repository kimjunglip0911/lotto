import Link from 'next/link';
import { isChildActive } from '../logic/navActive';

// 분석 등 하위 메뉴 단일 링크

interface NavChildLinkProps {
  title: string;
  href: string;
  pathname: string;
  onClose: () => void;
}

export function NavChildLink({ title, href, pathname, onClose }: NavChildLinkProps) {
  const childActive = isChildActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClose}
      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-sm ${
        childActive
          ? 'bg-primary/15 text-white'
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${childActive ? 'bg-primary' : 'bg-slate-500'}`}
      />
      <span>{title}</span>
    </Link>
  );
}
