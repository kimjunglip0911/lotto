import React from 'react';

export function BottomNav() {
    return (
        <nav className="absolute md:sticky bottom-0 z-50 w-full border-t border-card-border bg-card/95 backdrop-blur px-4 pb-safe pt-2">
            <div className="flex justify-between items-end pb-3 pt-1">
                <a className="flex flex-1 flex-col items-center gap-1 text-primary" href="#">
                    <span className="material-symbols-outlined text-[24px]">home</span>
                    <p className="text-[10px] sm:text-xs font-bold">Home</p>
                </a>
                <a className="flex flex-1 flex-col items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors" href="#">
                    <span className="material-symbols-outlined text-[24px]">history</span>
                    <p className="text-[10px] sm:text-xs font-medium">History</p>
                </a>
                <a className="flex flex-1 flex-col items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors" href="#">
                    <span className="material-symbols-outlined text-[24px]">bar_chart</span>
                    <p className="text-[10px] sm:text-xs font-medium">Analytics</p>
                </a>
                <a className="flex flex-1 flex-col items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors" href="#">
                    <span className="material-symbols-outlined text-[24px]">person</span>
                    <p className="text-[10px] sm:text-xs font-medium">Profile</p>
                </a>
            </div>
        </nav>
    );
}
