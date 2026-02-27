"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ClusteringData {
    draw_no: number;
    x: number;
    y: number;
    cluster: number;
    numbers: number[];
}

interface ClusteringAnalysisProps {
    data: ClusteringData[];
}

export default function ClusteringAnalysis({ data }: ClusteringAnalysisProps) {
    if (!data || data.length === 0) return null;

    // 클러스터별로 데이터 그룹화
    const clusters = [0, 1, 2, 3, 4];
    const clusterColors = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7"];
    const clusterNames = ["Cluster A", "Cluster B", "Cluster C", "Cluster D", "Cluster E"];

    const series = clusters.map((cIdx) => ({
        name: clusterNames[cIdx],
        data: data
            .filter((d) => d.cluster === cIdx)
            .map((d) => ({
                x: d.x,
                y: d.y,
                draw_no: d.draw_no,
                numbers: d.numbers
            }))
    }));

    const chartOptions = {
        chart: {
            type: 'scatter' as const,
            zoom: { enabled: true, type: 'xy' as const },
            toolbar: { show: true, tools: { download: false } },
            background: 'transparent'
        },
        colors: clusterColors,
        xaxis: {
            tickAmount: 10,
            labels: { style: { colors: '#64748b', fontSize: '10px' }, formatter: (val: string) => parseFloat(val).toFixed(1) },
            axisBorder: { show: false },
            title: { text: 'Principal Component 1', style: { color: '#64748b', fontSize: '10px' } }
        },
        yaxis: {
            tickAmount: 7,
            labels: { style: { colors: '#64748b', fontSize: '10px' }, formatter: (val: number) => val.toFixed(1) },
            title: { text: 'Principal Component 2', style: { color: '#64748b', fontSize: '10px' } }
        },
        grid: { borderColor: '#1e293b', strokeDashArray: 4 },
        legend: {
            show: true,
            position: 'top' as const,
            labels: { colors: '#94a3b8' },
            markers: {
                strokeWidth: 0,
                radius: 12
            } as any
        },
        tooltip: {
            theme: 'dark' as const,
            custom: function ({ series, seriesIndex, dataPointIndex, w }: any) {
                const d = w.config.series[seriesIndex].data[dataPointIndex];
                return `
                    <div style="padding: 12px; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; backdrop-filter: blur(8px);">
                        <div style="font-size: 11px; font-weight: 800; color: ${clusterColors[seriesIndex]}; margin-bottom: 6px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 4px;">
                            ${clusterNames[seriesIndex]} - ${d.draw_no}회차
                        </div>
                        <div style="display: flex; gap: 4px; margin-top: 4px;">
                            ${d.numbers.map((n: number) => `
                                <span style="width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; color: #fff; border: 1px solid rgba(255,255,255,0.2);">
                                    ${n}
                                </span>
                            `).join('')}
                        </div>
                        <div style="font-size: 9px; color: #64748b; margin-top: 8px;">
                            Coordinates: (${d.x.toFixed(2)}, ${d.y.toFixed(2)})
                        </div>
                    </div>
                `;
            }
        },
        markers: {
            size: 6,
            strokeWidth: 2,
            hover: { size: 9 }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                    <h2 className="text-xl font-bold text-slate-100">군집화 및 PCA 공간 분석 (Clustering & PCA)</h2>
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest leading-none">Unsupervised Learning</span>
                </div>
            </div>

            <div className="bg-[#0f172a]/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl shadow-2xl border-t-white/10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
                    {/* 분석 가이드 */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-4">
                            <h3 className="text-sm font-black text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-400 text-lg">psychology</span>
                                분석 기법 안내
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[11px] text-emerald-300 font-black mb-1 uppercase tracking-tighter">K-Means Clustering</p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">유사한 숫자 조합의 구조를 5개의 군집으로 자동 분류하여 반복되는 대칭 구조를 감지합니다.</p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-blue-300 font-black mb-1 uppercase tracking-tighter">PCA Dimensionality Reduction</p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">45차원의 고차원 데이터를 2차원 평면에 투영하여 번호 조합 간의 거리를 시각화합니다.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                            <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                * 점들 사이의 거리가 가까울수록 유사한 번호 패턴을 가진 회차임을 의미합니다. 특정 군집에 점이 밀집될 경우 해당 패턴이 최근의 주요 흐름일 가능성이 높습니다.
                            </p>
                        </div>
                    </div>

                    {/* PCA 산점도 차트 */}
                    <div className="lg:col-span-3 h-[450px] w-full bg-black/20 rounded-3xl p-6 border border-white/5 relative">
                        <Chart
                            options={chartOptions}
                            series={series}
                            type="scatter"
                            height="100%"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
