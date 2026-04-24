'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const pathname = usePathname();
    const titleMap: Record<string, string> = {
        '/': '로또 번호 생성기',
        '/home': '로또 번호 생성기',
        '/recommend': '로또 번호 추천',
        '/analysis/accumulated-numbers': '누적 번호 분석',
        '/analysis/chi-square': '카이제곱 검정 분석',
    };
    const pageTitle = titleMap[pathname] ?? '로또 번호 생성기';

    return (
        <header className="flex items-center justify-between p-4 sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-card-border/30">
            <button
                onClick={onMenuClick}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>menu</span>
            </button>
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px' }}>monetization_on</span>
                <h1 className="text-white text-xl font-bold tracking-tight">{pageTitle}</h1>
            </div>
            <button className="relative text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>notifications</span>
                <span className="absolute top-0 right-0 size-2.5 bg-white rounded-full border-2 border-background"></span>
            </button>
        </header>
    );
}
