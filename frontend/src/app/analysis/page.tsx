'use client';

import React, { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { NumberGenerator } from '@/features/analysis/components/NumberGenerator';
import { DrawGrid } from '@/features/analysis/components/DrawGrid';

export default function AnalysisPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [generatedSets, setGeneratedSets] = useState<any[]>([]);

    return (
        <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
            <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <main className="flex-1 overflow-y-auto pb-12 px-4 pt-6 space-y-6">
                    <div className="flex flex-col gap-2 mb-8">
                        <h2 className="text-3xl font-bold text-white tracking-tight">로또 번호 생성기</h2>
                        <p className="text-slate-400 text-sm">랜덤 난수 결합 알고리즘을 사용한 번호 생성 및 분석 시스템입니다.</p>
                    </div>

                    <NumberGenerator onGenerate={(data) => setGeneratedSets(data)} />

                    <DrawGrid sets={generatedSets} />
                </main>
            </div>
        </div>
    );
}
