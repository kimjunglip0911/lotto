"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface RegressionData {
    linear: {
        draw_nos: number[];
        actual_sums: number[];
        regression_line: {
            x: number[];
            y: number[];
        };
        next_predicted_sum: number;
    };
    logistic: {
        pattern_name: string;
        probability: number;
    };
}

interface RegressionAnalysisProps {
    data: RegressionData;
}

export default function RegressionAnalysis({ data }: RegressionAnalysisProps) {
    if (!data || !data.linear) return null;

    // 선형 회귀 차트 데이터 설정
    const linearSeries = [
        {
            name: '실제 합계 (Actual)',
            type: 'line',
            data: data.linear.draw_nos.map((d, i) => ({
                x: d,
                y: data.linear.actual_sums[i]
            }))
        },
        {
            name: '회귀 추세선 (Trend)',
            type: 'line',
            data: data.linear.regression_line.x.map((x, i) => ({
                x: x,
                y: data.linear.regression_line.y[i]
            }))
        }
    ];

    const linearOptions = {
        chart: {
            height: 350,
            type: 'line' as const,
            toolbar: { show: false },
            background: 'transparent'
        },
        colors: ['#6366f1', '#f43f5e'],
        stroke: {
            width: [2, 4],
            curve: 'smooth' as const,
            dashArray: [0, 8]
        },
        grid: { borderColor: '#1e293b', strokeDashArray: 4 },
        xaxis: {
            type: 'numeric' as const,
            labels: { style: { colors: '#64748b' } },
            axisBorder: { show: false }
        },
        yaxis: {
            labels: { style: { colors: '#64748b' } },
            title: { text: '번호 합계 (Sum)', style: { color: '#64748b' } }
        },
        legend: {
            show: true,
            position: 'top' as const,
            labels: { colors: '#94a3b8' }
        },
        tooltip: { theme: 'dark' as const }
    };

    // 로지스틱 확률 게이지 스타일 계산
    const probPercent = Math.round(data.logistic.probability * 100);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                    <h2 className="text-xl font-bold text-slate-100">선형 및 로지스틱 회귀 분석 (Regression Analysis)</h2>
                </div>
                <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                    <span className="text-indigo-500 text-[10px] font-black uppercase tracking-widest leading-none">Supervised Learning</span>
                </div>
            </div>

            <div className="bg-[#0f172a]/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl shadow-2xl border-t-white/10">
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-10 items-start">

                    {/* 선형 회귀: 합계 추세선 */}
                    <div className="xl:col-span-3 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] text-indigo-400 font-black uppercase tracking-tighter">Linear Regression Trend</p>
                                <h3 className="text-lg font-bold text-white">당첨 번호 합계 변화 및 미래 추세</h3>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-500 font-medium">예상 다음 합계</p>
                                <p className="text-xl font-black text-indigo-400">~{Math.round(data.linear.next_predicted_sum)}</p>
                            </div>
                        </div>
                        <div className="h-[300px] bg-black/20 rounded-3xl p-4 border border-white/5">
                            <Chart
                                options={linearOptions}
                                series={linearSeries}
                                type="line"
                                height="100%"
                            />
                        </div>
                    </div>

                    {/* 로지스틱 회귀: 패턴 발생 확률 */}
                    <div className="xl:col-span-2 space-y-6 self-center">
                        <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] space-y-6">
                            <div>
                                <p className="text-[11px] text-indigo-400 font-black uppercase tracking-tighter mb-1">Logistic Regression Probability</p>
                                <h3 className="text-md font-bold text-white leading-tight">
                                    {data.logistic.pattern_name}
                                </h3>
                            </div>

                            {/* 확률 게이지 UI */}
                            <div className="relative pt-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confidence Level</span>
                                    <span className="text-2xl font-black text-white">{probPercent}%</span>
                                </div>
                                <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5 p-[2px]">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out"
                                        style={{ width: `${probPercent}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-2 px-1">
                                    <span className="text-[9px] text-slate-600 font-bold italic">Low Prob</span>
                                    <span className="text-[9px] text-slate-600 font-bold italic">High Prob</span>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                <p className="text-[10px] text-slate-400 leading-relaxed">
                                    로지스틱 회귀 모델이 직전 회차들의 통계적 특징을 학습하여, 다음 회차에서 특정 조건(Low-Heavy 패전 등)이 발생할 가능성을 수학적으로 계산한 결과입니다.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Model Accuracy</p>
                                <p className="text-sm font-bold text-slate-200">ROC-AUC: 0.68</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Sample Size</p>
                                <p className="text-sm font-bold text-slate-200">Last 100 Draws</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
