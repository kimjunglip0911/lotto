"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface CDMData {
    number: number;
    probability: number;
    count: number;
    rank: number;
}

interface CDMAnalysisProps {
    data: CDMData[];
}

export default function CDMAnalysis({ data }: CDMAnalysisProps) {
    if (!data || data.length === 0) return null;

    // 데이터의 일관성을 위해 번호순 정렬 확인
    const sortedData = [...data].sort((a, b) => a.number - b.number);

    // 상위 6개 번호 추출
    const top6 = [...data].sort((a, b) => a.probability - b.probability).slice(-6).reverse();

    const chartSeries = [
        {
            name: 'Bayesian Probability',
            data: sortedData.map(d => parseFloat((d.probability * 100).toFixed(6)))
        }
    ];

    const chartOptions = {
        chart: {
            height: 450,
            type: 'radar' as const,
            toolbar: { show: false },
            background: 'transparent',
            dropShadow: {
                enabled: true,
                blur: 8,
                left: 1,
                top: 1,
                opacity: 0.2
            }
        },
        colors: ['#f59e0b'],
        stroke: { width: 2 },
        fill: {
            opacity: 0.1,
            colors: ['#f59e0b']
        },
        markers: { size: 3, colors: ['#f59e0b'] },
        xaxis: {
            categories: sortedData.map(d => `${d.number}`),
            labels: {
                show: true,
                style: {
                    colors: Array(45).fill('#64748b'),
                    fontSize: '9px',
                    fontWeight: 700
                }
            }
        },
        yaxis: {
            show: false
        },
        grid: {
            show: false
        },
        tooltip: {
            theme: 'dark' as const,
            y: {
                formatter: (val: number) => `${val.toFixed(4)}%`
            }
        },
        legend: { show: false }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></span>
                    <h2 className="text-xl font-bold text-slate-100">CDM 베이지안 확률 분포 (Bayesian CDM Model)</h2>
                </div>
                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                    <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest leading-none">Bayesian Inference</span>
                </div>
            </div>

            <div className="bg-[#0f172a]/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl shadow-2xl border-t-white/10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* 방사형 차트 영역 */}
                    <div className="bg-black/20 rounded-[2rem] p-4 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-6 left-6 z-10">
                            <p className="text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em]">Probability balanced map</p>
                        </div>
                        <Chart
                            options={chartOptions}
                            series={chartSeries}
                            type="radar"
                            height={450}
                        />
                    </div>

                    {/* 정보 및 상위 번호 영역 */}
                    <div className="space-y-8">
                        <section className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-amber-500 material-symbols-outlined text-lg">analytics</span>
                                <h3 className="text-lg font-bold text-white">베이지안 사후 확률 분석</h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Compound-Dirichlet-Multinomial 모델은 로또의 비복원 추출 특성을 수학적으로 고려합니다. 과거의 출현 빈도를 통해 각 번호의 잠재적 출현 확률을 추정하며, 단순 빈도보다 더 정밀한 베이지안 사후 분포를 도출합니다.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Top 6 Recommended by CDM</h4>
                            <div className="grid grid-cols-3 gap-4">
                                {top6.map((item, idx) => (
                                    <div key={idx} className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                        <div className="relative bg-[#0f172a] p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                                            <span className="text-xs font-black text-amber-500 mb-2">#{item.rank}</span>
                                            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2">
                                                <span className="text-lg font-black text-white">{item.number}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-bold">{(item.probability * 100).toFixed(3)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                            <div className="flex gap-3">
                                <span className="material-symbols-outlined text-amber-400 text-sm">info</span>
                                <p className="text-[10px] text-amber-200/70 leading-relaxed italic">
                                    차트가 바깥쪽으로 향할수록 해당 번호의 베이지안 사후 확률이 높음을 의미합니다. 전체적으로 고르게 분포되어 있다면 균형 잡힌 추세임을 나타냅니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
