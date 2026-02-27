"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface FeatureTimeseries {
    draw_no: number;
    odd_even: string;
    sum: number;
    range: number;
    odd_ratio: number;
}

interface PositionalStat {
    position: string;
    avg: number;
    min: number;
    max: number;
    std: number;
}

interface FeatureData {
    timeseries: FeatureTimeseries[];
    positional: PositionalStat[];
    summary: {
        avg_sum: number;
        avg_range: number;
        common_parity: string;
    };
}

interface FeatureAnalysisProps {
    data: FeatureData;
}

export default function FeatureAnalysis({ data }: FeatureAnalysisProps) {
    if (!data || !data.timeseries) return null;

    // 1. 홀짝 비율 & 합계 추이 차트 설정
    const comboChartSeries = [
        {
            name: 'Total Sum',
            type: 'line',
            data: data.timeseries.map(d => d.sum)
        },
        {
            name: 'Odd Ratio',
            type: 'column',
            data: data.timeseries.map(d => parseFloat((d.odd_ratio * 100).toFixed(1)))
        }
    ];

    const comboChartOptions = {
        chart: {
            height: 350,
            type: 'line' as const,
            stacked: false,
            toolbar: { show: false },
            background: 'transparent'
        },
        stroke: {
            width: [3, 0],
            curve: 'smooth' as const
        },
        plotOptions: {
            bar: { columnWidth: '50%' }
        },
        colors: ['#8b5cf6', '#3b82f6'],
        fill: {
            opacity: [1, 0.5],
            gradient: {
                inverseColors: false,
                shade: 'light',
                type: "vertical",
                opacityFrom: 0.85,
                opacityTo: 0.55,
                stops: [0, 100, 100, 100]
            }
        },
        labels: data.timeseries.map(d => `${d.draw_no}회`),
        markers: { size: 0 },
        xaxis: { type: 'category' as const },
        yaxis: [
            {
                title: { text: 'Total Sum', style: { color: '#8b5cf6' } },
                labels: { style: { colors: '#8b5cf6' } }
            },
            {
                opposite: true,
                title: { text: 'Odd Ratio (%)', style: { color: '#3b82f6' } },
                labels: { style: { colors: '#3b82f6' } },
                max: 100
            }
        ],
        tooltip: {
            theme: 'dark' as const,
            shared: true,
            intersect: false
        },
        grid: {
            borderColor: 'rgba(255, 255, 255, 0.05)',
            strokeDashArray: 4
        },
        legend: {
            position: 'top' as const,
            horizontalAlign: 'right' as const,
            labels: { colors: '#94a3b8' }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"></span>
                    <h2 className="text-xl font-bold text-slate-100">특성 공학 및 조합 분석 (Feature Engineering)</h2>
                </div>
                <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full">
                    <span className="text-violet-400 text-[10px] font-black uppercase tracking-widest leading-none">Advanced Metrics</span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* 메인 차트: 총합 및 홀짝 추세 */}
                <div className="xl:col-span-2 bg-[#0f172a]/40 border border-white/5 rounded-[2rem] p-6 backdrop-blur-xl shadow-2xl border-t-white/10">
                    <div className="mb-6">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-violet-400 text-sm">trending_up</span>
                            총합 및 홀짝 비율 추세 (최근 50회차)
                        </h3>
                    </div>
                    <Chart
                        options={comboChartOptions}
                        series={comboChartSeries}
                        height={350}
                    />
                </div>

                {/* 우측 요약 카드 레이아웃 */}
                <div className="space-y-6">
                    {/* 일반 통계 카드 */}
                    <div className="bg-[#0f172a]/40 border border-white/5 rounded-[2rem] p-6 backdrop-blur-xl shadow-xl border-t-white/10">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Key Statistics</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="text-xs text-slate-400">평균 총합 (Avg Sum)</span>
                                <span className="text-sm font-black text-violet-400">{data.summary.avg_sum.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="text-xs text-slate-400">평균 범위 (Avg Range)</span>
                                <span className="text-sm font-black text-blue-400">{data.summary.avg_range.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="text-xs text-slate-400">최빈 홀짝비 (Most Common)</span>
                                <span className="text-sm font-black text-amber-500">{data.summary.common_parity}</span>
                            </div>
                        </div>
                    </div>

                    {/* 자리별 평균 정보 */}
                    <div className="bg-[#0f172a]/40 border border-white/5 rounded-[2rem] p-6 backdrop-blur-xl shadow-xl border-t-white/10">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Positional Centers</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {data.positional.map((pos, idx) => (
                                <div key={idx} className="p-3 bg-black/20 rounded-xl border border-white/5 text-center">
                                    <p className="text-[9px] text-slate-500 font-bold mb-1">Pos {idx + 1}</p>
                                    <p className="text-xs font-black text-white">{pos.avg.toFixed(1)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 자리별 세부 분포 카드 리스트 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {data.positional.map((pos, idx) => (
                    <div key={idx} className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-br from-violet-500/20 to-blue-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
                        <div className="relative bg-[#0f172a]/60 border border-white/5 p-4 rounded-2xl">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-black text-slate-500 uppercase">{idx + 1}st Ball</span>
                                <span className="text-[10px] text-violet-400 font-bold">±{pos.std.toFixed(1)}</span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-slate-500">Min/Max</span>
                                    <span className="text-slate-300 font-bold">{pos.min}-{pos.max}</span>
                                </div>
                                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-violet-500"
                                        style={{ width: `${(pos.avg / 45) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
