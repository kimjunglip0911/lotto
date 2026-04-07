'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { title: '로또 번호 생성기', icon: 'casino', href: '/' },
    { title: '번호 분석', icon: 'analytics', href: '/analysis' },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-card-bg border-r border-card-border/30 z-[70] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-card-border/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px' }}>monetization_on</span>
              <span className="text-white font-bold text-lg">LOTTO AI</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group cursor-pointer ${isActive
                    ? 'bg-primary/20 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <span className={`material-symbols-outlined ${isActive ? 'text-primary' : 'group-hover:text-primary'}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.title}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer Info */}
          <div className="p-6 border-t border-card-border/20">
            <p className="text-xs text-slate-500 text-center italic">© 2026 Hobby & Life. Lotto AI Analytics.</p>
          </div>
        </div>
      </aside>
    </>
  );
}
