import React from 'react';

export function AlgorithmInfo() {
    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-bold">Algorithm Transparency</h3>
                <button className="text-xs text-primary font-bold tracking-wider hover:text-primary-hover uppercase">Details</button>
            </div>

            <div className="space-y-3">
                <div className="bg-card border border-card-border p-4 rounded-2xl flex gap-4 items-center">
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[24px]">share</span>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1">Quantum RNG</h4>
                        <p className="text-slate-400 text-xs leading-relaxed">Leveraging atmospheric noise for true randomness via quantum entropy sources.</p>
                    </div>
                </div>

                <div className="bg-card border border-card-border p-4 rounded-2xl flex gap-4 items-center">
                    <div className="size-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-green-500 text-[24px]">monitoring</span>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1">Pattern Analysis</h4>
                        <p className="text-slate-400 text-xs leading-relaxed">Deep learning models identifying historical frequency trends and anomalies.</p>
                    </div>
                </div>

                <div className="bg-card border border-card-border p-4 rounded-2xl flex gap-4 items-center">
                    <div className="size-12 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-yellow-500 text-[24px]">device_thermostat</span>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-1">Hot/Cold Tracking</h4>
                        <p className="text-slate-400 text-xs leading-relaxed">Real-time tracking of number temperature based on last 500 draws.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
