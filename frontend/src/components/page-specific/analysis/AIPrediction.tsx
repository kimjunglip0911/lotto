"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface AIPredictionProps {
    mlpPrediction: number[]; // MLP 모델 확률 배열
    rfPrediction: number[];  // RF 모델 확률 배열
}

export default function AIPrediction({ mlpPrediction, rfPrediction }: AIPredictionProps) {
    // 각각의 모델에서 상위 6개 추천 (공간 효율을 위해 6개로 조정)
    const mlpTop6 = (mlpPrediction || [])
        .map((prob, idx) => ({ num: idx + 1, prob }))
        .sort((a, b) => b.prob - a.prob)
        .slice(0, 6);

    const rfTop6 = (rfPrediction || [])
        .map((prob, idx) => ({ num: idx + 1, prob }))
        .sort((a, b) => b.prob - a.prob)
        .slice(0, 6);

    const getNumberColor = (num: number) => {
        if (num <= 10) return "bg-yellow-500 text-black";
        if (num <= 20) return "bg-blue-500 text-white";
        if (num <= 30) return "bg-red-500 text-white";
        if (num <= 40) return "bg-slate-500 text-white";
        return "bg-green-500 text-white";
    };

    const chartOptions = {
        chart: {
            type: 'bar' as const,
            toolbar: { show: false },
            animations: { enabled: true, easing: 'easeinout' as const, speed: 800 }
        },
        plotOptions: {
            bar: {
                borderRadius: 3,
                columnWidth: '80%',
                dataLabels: { position: 'top' }
            }
        },
        colors: ["#a855f7", "#3b82f6"], // MLP: Purple, RF: Blue
        dataLabels: { enabled: false },
        xaxis: {
            categories: Array.from({ length: 45 }, (_, i) => i + 1),
            labels: { style: { colors: '#64748b', fontSize: '8px' } }
        },
        yaxis: {
            show: true,
            labels: { style: { colors: '#64748b', fontSize: '9px' } },
            title: { text: '추천 강도 (Score)', style: { color: '#64748b', fontSize: '10px' } },
            min: 0,
            max: 1
        },
        grid: { borderColor: '#1e293b', strokeDashArray: 4 },
        legend: {
            show: true,
            position: 'top' as const,
            labels: { colors: '#94a3b8' }
        },
        tooltip: {
            theme: 'dark' as const,
            shared: true,
            intersect: false,
            y: { formatter: (val: number) => `${(val * 100).toFixed(1)}%` }
        }
    };

    const series = [
        {
            name: 'MLP Prediction',
            data: mlpPrediction || []
        },
        {
            name: 'Random Forest',
            data: rfPrediction || []
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-[0_0_15px_rgba(168,85,247,0.6)]"></span>
                    <h2 className="text-xl font-bold text-slate-100">Dual-Model AI 정밀 분석 (MLP vs RF)</h2>
                </div>
                <div className="flex gap-2">
                    <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest border border-purple-500/20 bg-purple-500/5 px-2 py-1 rounded-full">
                        Neural Network
                    </span>
                    <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest border border-blue-500/20 bg-blue-500/5 px-2 py-1 rounded-full">
                        Decision Trees
                    </span>
                </div>
            </div>

            <div className="bg-[#0f172a]/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl shadow-2xl border-t-white/10">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
                    {/* 모델별 추천 번호 */}
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
                        {/* MLP TOP 6 */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-l-2 border-purple-500 pl-3">
                                <h3 className="text-sm font-black text-white">MLP Top 6</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {mlpTop6.map((item) => (
                                    <div key={item.num} className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shadow-lg ${getNumberColor(item.num)}`}>
                                            {item.num}
                                        </div>
                                        <span className="text-[11px] font-bold text-purple-400">{(item.prob * 100).toFixed(0)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RF TOP 6 */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-l-2 border-blue-500 pl-3">
                                <h3 className="text-sm font-black text-white">RF Top 6</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {rfTop6.map((item) => (
                                    <div key={item.num} className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shadow-lg ${getNumberColor(item.num)}`}>
                                            {item.num}
                                        </div>
                                        <span className="text-[11px] font-bold text-blue-400">{(item.prob * 100).toFixed(0)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="sm:col-span-2 p-5 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl">
                            <p className="text-[11px] text-slate-300 font-bold mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-xs">info</span>
                                Dual Engine Intelligence
                            </p>
                            <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                * 신경망(MLP)의 비선형 특징 추출 능력과 랜덤 포레스트(RF)의 데이터 일반화 성능을 동시에 분석하여 상호 보완적인 번호 조합을 제안합니다.
                            </p>
                        </div>
                    </div>

                    {/* 번호별 전체 강도 그래프 */}
                    <div className="lg:col-span-3 h-[380px] w-full bg-black/20 rounded-3xl p-4 border border-white/5">
                        <Chart
                            options={chartOptions}
                            series={series}
                            type="bar"
                            height="100%"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
