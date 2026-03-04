import React from 'react';

export function WinningStats() {
    return (
        <section>
            <h3 className="text-white text-lg font-bold mb-4">Winning Statistics</h3>
            <div className="bg-card border border-card-border rounded-2xl p-5">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Success Rate</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-white text-3xl font-bold">14.8%</span>
                            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">+2.4%</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Wins</p>
                        <div className="text-white text-3xl font-bold">8,249</div>
                    </div>
                </div>

                {/* Fake Bar Chart - Todo: Replace with ApexCharts as per rules */}
                <div className="flex items-end justify-between h-24 gap-2 px-2 border-b border-card-border pb-1">
                    {[40, 60, 50, 100, 50, 80, 45, 65].map((h, i) => (
                        <div key={i} className={`w-8 rounded-t-md ${i === 3 ? 'bg-primary' : 'bg-slate-700/50'}`} style={{ height: `${h}%` }}></div>
                    ))}
                </div>
            </div>
        </section>
    );
}
