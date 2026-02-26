import React from 'react';

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    return (
        <header className="flex items-center justify-between p-4 sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-card-border/30">
            <button
                onClick={onMenuClick}
                className="text-slate-400 hover:text-white transition-colors"
            >
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>menu</span>
            </button>
            <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px' }}>monetization_on</span>
                <h1 className="text-white text-xl font-bold tracking-tight">로또 번호 생성기</h1>
            </div>
            <button className="relative text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>notifications</span>
                <span className="absolute top-0 right-0 size-2.5 bg-white rounded-full border-2 border-background"></span>
            </button>
        </header>
    );
}
