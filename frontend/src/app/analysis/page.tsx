'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';

// ApexCharts dynamic import (SSR: false)
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
import AIPrediction from '@/components/page-specific/analysis/AIPrediction';
import ClusteringAnalysis from '@/components/page-specific/analysis/ClusteringAnalysis';
import RegressionAnalysis from '@/components/page-specific/analysis/RegressionAnalysis';
import CDMAnalysis from '@/components/page-specific/analysis/CDMAnalysis';
import FeatureAnalysis from '@/components/page-specific/analysis/FeatureAnalysis';

interface TrendData {
    num: number;
    data: number[];
}

interface TimeframeData {
    categories: string[];
    trends: TrendData[];
}

interface AnalysisData {
    [key: string]: TimeframeData;
}

interface DescriptiveStats {
    sum_stats: { [key: string]: number };
    number_stats: { [key: string]: { [key: string]: number } };
}

interface GapAnalysis {
    latest_draw_no: number;
    gaps: { [key: number]: number };
}

export default function AnalysisPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
    const [aiPrediction, setAiPrediction] = useState<number[] | null>(null);
    const [rfPrediction, setRfPrediction] = useState<number[] | null>(null);
    const [clusteringData, setClusteringData] = useState<any[] | null>(null);
    const [regressionData, setRegressionData] = useState<any | null>(null);
    const [cdmData, setCdmData] = useState<any[] | null>(null);
    const [featureData, setFeatureData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAllData() {
            try {
                const [tfRes, gapRes, aiRes, rfRes, clusterRes, regressionRes, cdmRes, featureRes] = await Promise.all([
                    fetch('http://localhost:8000/api/analysis/timeframes'),
                    fetch('http://localhost:8000/api/analysis/gaps'),
                    fetch('http://localhost:8000/api/analysis/predict/ai'),
                    fetch('http://localhost:8000/api/analysis/predict/rf'),
                    fetch('http://localhost:8000/api/analysis/clustering'),
                    fetch('http://localhost:8000/api/analysis/regression'),
                    fetch('http://localhost:8000/api/analysis/cdm'),
                    fetch('http://localhost:8000/api/analysis/features')
                ]);

                if (!tfRes.ok || !gapRes.ok) throw new Error('Failed to fetch analysis data');

                const tfData = await tfRes.json();
                const gapData = await gapRes.json();
                const aiData = aiRes.ok ? await aiRes.json() : null;
                const rfData = rfRes.ok ? await rfRes.json() : null;
                const clusterData = clusterRes.ok ? await clusterRes.json() : null;
                const regrData = regressionRes.ok ? await regressionRes.json() : null;
                const bayesData = cdmRes.ok ? await cdmRes.json() : null;
                const featData = featureRes.ok ? await featureRes.json() : null;

                setAnalysisData(tfData);
                setGapAnalysis(gapData);
                if (aiData) setAiPrediction(aiData.prediction);
                if (rfData) setRfPrediction(rfData.prediction);
                if (clusterData) setClusteringData(clusterData);
                if (regrData) setRegressionData(regrData);
                if (bayesData) setCdmData(bayesData);
                if (featData) setFeatureData(featData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAllData();
    }, []);

    const getNumberColor = (num: number) => {
        if (num <= 10) return 'bg-amber-400 text-slate-900';
        if (num <= 20) return 'bg-blue-500 text-white';
        if (num <= 30) return 'bg-rose-500 text-white';
        if (num <= 40) return 'bg-slate-500 text-white';
        return 'bg-emerald-500 text-white';
    };

    if (isLoading) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary border-r-2"></div>
                    <p className="text-slate-400 animate-pulse font-bold tracking-widest text-sm uppercase">Analyzing Multi-Timeframes...</p>
                </div>
            </div>
        );
    }

    const generate20Colors = () => {
        const colors = [];
        for (let i = 0; i < 20; i++) {
            const hue = (i * (360 / 20)) % 360;
            colors.push(`hsl(${hue}, 75%, 60%)`);
        }
        return colors;
    };

    const timeframeLabels: { [key: string]: string } = {
        "1M": "최근 1개월 (4주) 추세",
        "3M": "최근 3개월 (13주) 추세",
        "6M": "최근 6개월 (26주) 추세",
        "1Y": "최근 1년 (52주) 추세",
        "3Y": "최근 3년 (156주) 추세"
    };

    const colors = generate20Colors();

    const getBaseChartOptions = (categories: string[]): any => ({
        chart: {
            toolbar: { show: false },
            zoom: { enabled: false },
            background: 'transparent',
            animations: { enabled: true, easing: 'easeinout', speed: 800 }
        },
        stroke: { curve: 'smooth', width: 2 },
        colors: colors,
        xaxis: {
            categories: categories,
            labels: {
                style: { colors: '#64748b', fontSize: '8px' },
                rotate: -45,
                hideOverlappingLabels: true
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        legend: {
            show: true,
            position: 'top' as const,
            fontSize: '10px',
            labels: { colors: '#94a3b8' },
            markers: { width: 8, height: 8 }
        },
        yaxis: {
            labels: { style: { colors: '#64748b', fontSize: '9px' } },
            title: {
                text: '지수 이동 평균 (EMA) 점수',
                style: { color: '#3b82f6', fontSize: '10px', fontWeight: 900 }
            },
            min: 0,
            max: 1
        },
        tooltip: {
            theme: 'dark',
            shared: true,
            intersect: false,
            followCursor: true,
            custom: function ({ series, seriesIndex, dataPointIndex, w }: any) {
                const category = categories[dataPointIndex];

                const seriesData = w.config.series.map((s: any, idx: number) => ({
                    name: s.name,
                    value: s.data[dataPointIndex] || 0,
                    color: w.config.colors[idx],
                    num: parseInt(s.name.replace(/\D/g, '')) || 0
                }));

                seriesData.sort((a: any, b: any) => {
                    if (b.value !== a.value) return b.value - a.value;
                    return a.num - b.num;
                });
                const top10 = seriesData.slice(0, 10);

                let tooltipContent = `
                    <style>
                        .apexcharts-tooltip { 
                            background: transparent !important; 
                            border: none !important; 
                            box-shadow: none !important;
                            pointer-events: none !important;
                        }
                    </style>
                    <div style="padding: 10px; background: rgba(15, 23, 42, 0.98); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; backdrop-filter: blur(12px); box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.7); min-width: 140px; display: flex; flex-direction: column; margin-left: 15px; margin-top: 15px;">
                        <div style="font-size: 10px; font-weight: 900; color: #f8fafc; margin-bottom: 6px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
                            <span>${category} 분석</span>
                            <span style="font-size: 8px; color: #3b82f6; font-weight: 700;">EMA SCORE</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 3px;">
                `;

                top10.forEach((s: any) => {
                    if (s.value > 0) {
                        tooltipContent += `
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 1px 0;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <div style="width: 7px; height: 7px; border-radius: 2px; background: ${s.color};"></div>
                                    <span style="font-size: 10px; font-weight: 700; color: #e2e8f0;">${s.name}</span>
                                </div>
                                <div style="display: flex; align-items: baseline; gap: 1px;">
                                    <span style="font-size: 11px; font-weight: 900; color: #3b82f6;">${s.value.toFixed(3)}</span>
                                </div>
                            </div>
                        `;
                    }
                });

                tooltipContent += `</div></div>`;
                return tooltipContent;
            }
        },
        markers: { size: 0, hover: { size: 4 } }
    });

    return (
        <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
            <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[98%] xl:w-[98%] max-w-[2400px] border-x border-card-border/30 relative shadow-2xl">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <main className="flex-1 overflow-y-auto pb-12 px-6 pt-8 space-y-12">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-4xl">timeline</span>
                            기간별 정밀 추세 분석 대시보드
                        </h1>
                        <p className="text-slate-400 font-medium">최근 1개월부터 3년까지, 주요 번호들의 주기적인 흐름을 추적합니다.</p>
                    </div>

                    {/* AI 예측 엔진 (MLP + RF) */}
                    <div className="pt-4">
                        {(aiPrediction || rfPrediction) && (
                            <AIPrediction
                                mlpPrediction={aiPrediction || []}
                                rfPrediction={rfPrediction || []}
                            />
                        )}
                    </div>

                    {/* 군집화 및 PCA 공간 분석 */}
                    <div className="pt-8 border-t border-white/5">
                        {clusteringData && <ClusteringAnalysis data={clusteringData} />}
                    </div>

                    {/* 선형 및 로지스틱 회귀 분석 */}
                    <div className="pt-8 border-t border-white/5">
                        {regressionData && <RegressionAnalysis data={regressionData} />}
                    </div>

                    {/* CDM 베이지안 확률 분석 */}
                    <div className="pt-8 border-t border-white/5">
                        {cdmData && <CDMAnalysis data={cdmData} />}
                    </div>

                    {/* 특성 공학 및 조합 분석 */}
                    <div className="pt-8 border-t border-white/5">
                        {featureData && <FeatureAnalysis data={featureData} />}
                    </div>

                    <div className="space-y-8 pt-8 border-t border-white/5">
                        {analysisData && analysisData["6M"] && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                                        <h2 className="text-xl font-bold text-slate-100">{timeframeLabels["6M"]}</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border border-white/5 px-2 py-1 rounded-full">
                                            26-Week Span
                                        </span>
                                        <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest border border-blue-500/20 bg-blue-500/5 px-2 py-1 rounded-full">
                                            EMA Applied
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-[#0f172a]/40 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-xl shadow-2xl border-t-white/10">
                                    <div className="h-[400px] w-full">
                                        <Chart
                                            options={getBaseChartOptions(analysisData["6M"]?.categories || [])}
                                            series={analysisData["6M"]?.trends.map(t => ({ name: `N.${t.num}`, data: t.data })) || []}
                                            type="line"
                                            height="100%"
                                        />
                                    </div>
                                    <p className="mt-4 text-center text-slate-500 text-xs font-medium italic">
                                        * 지수 이동 평균(EMA)은 최근 회차의 출현 데이터에 더 높은 가중치를 부여하여 현재의 추세를 민감하게 반영합니다.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 번호별 간격 분석 (Gap Analysis) */}
                    <div className="pt-8 border-t border-white/5">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">data_usage</span>
                                <h2 className="text-2xl font-black text-white tracking-tight">번호별 미출현 간격 분석 (Gap Analysis)</h2>
                            </div>
                            <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                                <span className="text-primary text-xs font-black uppercase tracking-widest">Calculated by Pandas</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-5 md:grid-cols-9 lg:grid-cols-9 xl:grid-cols-15 gap-3">
                            {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
                                const gap = gapAnalysis?.gaps[num] ?? -1;
                                let gapColor = 'text-slate-400';
                                let borderColor = 'border-white/5';
                                if (gap >= 10) { gapColor = 'text-rose-500'; borderColor = 'border-rose-500/30'; }
                                else if (gap >= 5) { gapColor = 'text-amber-500'; borderColor = 'border-amber-500/30'; }
                                else if (gap === 0) { gapColor = 'text-emerald-500'; borderColor = 'border-emerald-500/30'; }

                                return (
                                    <div key={num} className={`bg-[#0f172a]/40 border ${borderColor} rounded-2xl p-3 backdrop-blur-md flex flex-col items-center gap-1 transition-all hover:scale-105`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-sm ${getNumberColor(num)}`}>
                                            {num}
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className={`text-lg font-black leading-none ${gapColor}`}>
                                                {gap === -1 ? '?' : gap}
                                            </span>
                                            <span className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">Gaps</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="mt-6 text-slate-500 text-xs font-medium text-center italic">
                            * Gaps: 해당 번호가 마지막으로 당첨된 이후 경과된 회차 수입니다. (0은 최근 회차 당첨)
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}
