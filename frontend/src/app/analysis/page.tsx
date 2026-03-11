'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { AnalysisController } from '@/features/analysis/components/AnalysisController';
import { AnalysisResultList } from '@/features/analysis/components/AnalysisResultList';

interface LotterySet {
    id?: number;
    draw_no?: number;
    method?: string;
    num1: number;
    num2: number;
    num3: number;
    num4: number;
    num5: number;
    num6: number;
}

export default function AnalysisPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [availableDraws, setAvailableDraws] = useState<number[]>([]);
    const [selectedDraw, setSelectedDraw] = useState<number | 'new'>('new');

    const [generatedSets, setGeneratedSets] = useState<LotterySet[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 초기 마운트 시 회차 목록 불러오기
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

                const drawsRes = await fetch(`${baseUrl}/api/drawings/draw-numbers`);
                if (!drawsRes.ok) throw new Error('회차 목록을 불러오는데 실패했습니다.');

                const draws: number[] = await drawsRes.json();
                setAvailableDraws(draws.slice(0, 50));
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // 회차 선택이 바뀔 때마다 DB 내역 GET
    useEffect(() => {
        let isMounted = true;
        const fetchSavedSets = async () => {
            if (selectedDraw === 'new') {
                setGeneratedSets([]);
                return;
            }

            try {
                setLoading(true);
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${baseUrl}/api/drawings/by-no?draw_no=${selectedDraw}`);
                if (!res.ok) throw new Error('조회에 실패했습니다.');
                const data = await res.json();
                if (isMounted) setGeneratedSets(data);
            } catch (err: any) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchSavedSets();
        return () => { isMounted = false; };
    }, [selectedDraw]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            const targetDraw = selectedDraw === 'new'
                ? (availableDraws.length > 0 ? availableDraws[0] + 1 : 1)
                : selectedDraw;

            // 저장 POST API 호출
            const response = await fetch(`${baseUrl}/api/analysis/generate-and-save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ draw_no: targetDraw })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || '번호 생성 및 저장에 실패했습니다.');
            }

            // 성공하면 전체 리스트 재조회하여 화면 싱크
            const refreshedRes = await fetch(`${baseUrl}/api/drawings/by-no?draw_no=${targetDraw}`);
            if (refreshedRes.ok) {
                const refreshedData = await refreshedRes.json();
                setGeneratedSets(refreshedData);

                // 만약 'new' 상태에서 실행했다면, 화면도 새로 고정된 회차로 포커스 변경
                if (selectedDraw === 'new') {
                    setAvailableDraws(prev => [targetDraw as number, ...prev]);
                    setSelectedDraw(targetDraw as number);
                }
            }

        } catch (err: any) {
            console.error('Error generating numbers:', err);
            setError(err.message);
            alert(`오류: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // 사용 가능한 분석 기법 목록 (새로운 기법 추가 시 여기에 추가하면 자동 활성화됨)
    const availableMethods = ['순서 통계량', 'CDM 바이시안', 'LSTM', 'Bi-LSTM', 'CNN', '마르코프 체인', '유전 알고리즘', '입자 군집 최적화', '조합론적 템플릿 분석', '행동 경제학 분석'];
    const generatedMethods = new Set(generatedSets.map(set => set.method));
    const isMaxReached = availableMethods.every(m => generatedMethods.has(m));

    return (
        <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
            <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <main className="flex-1 overflow-y-auto pb-12 px-4 pt-6 space-y-6">
                    <div className="flex flex-col gap-2 mb-4">
                        <h2 className="text-3xl font-bold text-white tracking-tight">로또 분석 및 번호 추천</h2>
                        <p className="text-slate-400 text-sm">다양한 분석 기법을 통해 회차별 유력 후보 번호 세트를 추천합니다.</p>
                    </div>

                    <AnalysisController
                        availableDraws={availableDraws}
                        selectedDraw={selectedDraw}
                        onDrawSelect={setSelectedDraw}
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating}
                        isMaxReached={isMaxReached}
                        totalSets={generatedSets.length}
                    />

                    {/* 에러 */}
                    {error && (
                        <div className="text-red-400 py-4 text-center border border-red-900/50 rounded-lg bg-red-950/20 mt-4">
                            데이터 통신 오류: {error}
                        </div>
                    )}

                    {/* 카드 리스트 렌더링 영역 */}
                    <AnalysisResultList sets={generatedSets} loading={loading} error={error} />

                </main>
            </div>
        </div>
    );
}
