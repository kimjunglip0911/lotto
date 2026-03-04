import React, { useState } from 'react';

interface NumberGeneratorProps {
    onGenerate: (data: any[]) => void;
}

export function NumberGenerator({ onGenerate }: NumberGeneratorProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
            const response = await fetch(`${apiUrl}/api/analysis/generate/ai`);
            if (response.ok) {
                const data = await response.json();
                onGenerate(data);
            } else {
                alert('번호 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error generating numbers:', error);
            alert('서버 오류가 발생했습니다.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-card border border-card-border rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 inset-x-0 h-40 bg-primary/20 blur-[60px] pointer-events-none rounded-t-3xl"></div>

            <h2 className="text-3xl font-bold text-white mb-4 z-10 text-center">AI 추천 번호 생성</h2>
            <p className="text-slate-400 mb-8 text-center z-10 max-w-lg">
                순수 난수 기반의 난수 생성 알고리즘을 통해 20세트의 번호를 즉시 생성합니다.
            </p>

            <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full max-w-md py-5 bg-primary hover:bg-primary-hover disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-[0_15px_30px_-10px_rgba(59,130,246,0.5)] transition-all flex items-center justify-center gap-3 text-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] z-10"
            >
                {isGenerating ? (
                    <span className="material-symbols-outlined animate-spin text-[28px]">
                        progress_activity
                    </span>
                ) : (
                    <span className="material-symbols-outlined text-[28px]">
                        casino
                    </span>
                )}
                {isGenerating ? '생성 중...' : '번호 생성하기'}
            </button>
        </div>
    );
}
