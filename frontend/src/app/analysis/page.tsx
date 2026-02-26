'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';
import { BottomNav } from '@/components/common/BottomNav';

// ApexCharts dynamic import (SSR: false)
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface AnalysisStats {
    frequencies: { num: number; count: number }[];
    odd_even: { odd: number; even: number };
    high_low: { high: number; low: number };
}

export default function AnalysisPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [stats, setStats] = useState<AnalysisStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch('http://localhost:8000/api/analysis/stats');
                if (!response.ok) throw new Error('Failed to fetch stats');
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchStats();
    }, []);

    const handleGeneratePool = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('http://localhost:8000/api/analysis/generate', { method: 'POST' });
            if (response.ok) {
                alert('통계 기반 100세트 번호 풀이 성공적으로 생성되었습니다!');
            } else {
                alert('생성 실패');
            }
        } catch (error) {
            console.error('Error generating pool:', error);
            alert('오류가 발생했습니다.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (isLoading || !stats) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
        );
    }

    // Chart Options
    const freqChartOptions: any = {
        chart: { id: 'freq-chart', toolbar: { show: false }, background: 'transparent' },
        xaxis: {
            categories: stats.frequencies.map(f => f.num),
            labels: { style: { colors: '#94a3b8', fontSize: '10px' } }
        },
        yaxis: { labels: { style: { colors: '#94a3b8' } } },
        colors: ['#3b82f6'],
        theme: { mode: 'dark' },
        grid: { borderColor: '#1e293b' },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
        dataLabels: { enabled: false }
    };

    const freqSeries = [{ name: '출현 횟수', data: stats.frequencies.map(f => f.count) }];

    const pieOptions: any = {
        chart: { type: 'donut', background: 'transparent' },
        labels: ['홀수', '짝수'],
        colors: ['#3b82f6', '#10b981'],
        theme: { mode: 'dark' },
        stroke: { show: false },
        legend: { position: 'bottom', labels: { colors: '#94a3b8' } },
        dataLabels: { enabled: true }
    };

    const highLowOptions: any = {
        ...pieOptions,
        labels: ['저수 (1~22)', '고수 (23~45)'],
        colors: ['#f59e0b', '#ef4444']
    };

    return (
        <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
            <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <main className="flex-1 overflow-y-auto pb-24 px-4 pt-6 space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">데이터 분석</h2>
                            <p className="text-slate-400 text-sm">역대 당첨 통계를 기반으로 최적의 번호를 추론합니다.</p>
                        </div>
                        <button
                            onClick={handleGeneratePool}
                            disabled={isGenerating}
                            className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${isGenerating ? 'bg-slate-700 text-slate-400' : 'bg-primary text-white hover:bg-primary-hover hover:scale-105 active:scale-95 shadow-lg shadow-primary/25'
                                }`}
                        >
                            <span className="material-symbols-outlined">{isGenerating ? 'refresh' : 'Auto_Fix'}</span>
                            {isGenerating ? '생성 중...' : '분석 기반 100세트 생성'}
                        </button>
                    </div>

                    {/* Chart Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Frequency Chart */}
                        <div className="bg-card-bg/40 border border-card-border/20 rounded-3xl p-6 backdrop-blur-sm col-span-1 lg:col-span-2">
                            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">bar_chart</span>
                                번호별 출현 빈도 (1~45)
                            </h3>
                            <div className="h-[300px] w-full">
                                <Chart options={freqChartOptions} series={freqSeries} type="bar" height="100%" />
                            </div>
                        </div>

                        {/* Pie Charts */}
                        <div className="bg-card-bg/40 border border-card-border/20 rounded-3xl p-6 backdrop-blur-sm">
                            <h3 className="text-lg font-semibold text-white mb-6">홀짝 비율</h3>
                            <div className="h-[250px]">
                                <Chart options={pieOptions} series={[stats.odd_even.odd, stats.odd_even.even]} type="donut" height="100%" />
                            </div>
                        </div>

                        <div className="bg-card-bg/40 border border-card-border/20 rounded-3xl p-6 backdrop-blur-sm">
                            <h3 className="text-lg font-semibold text-white mb-6">고저 비율</h3>
                            <div className="h-[250px]">
                                <Chart options={highLowOptions} series={[stats.high_low.low, stats.high_low.high]} type="donut" height="100%" />
                            </div>
                        </div>
                    </div>
                </main>

                <BottomNav />
            </div>
        </div>
    );
}
