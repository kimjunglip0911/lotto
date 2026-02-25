import React from 'react';

export function EliteMembers() {
    return (
        <section className="pb-6">
            <h3 className="text-white text-lg font-bold mb-4">Elite Members</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                <div className="min-w-[280px] bg-card border border-card-border p-5 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-12 rounded-full bg-gradient-to-tr from-slate-600 to-slate-400"></div>
                        <div>
                            <p className="text-white font-bold text-sm">Marcus Chen</p>
                            <div className="flex text-yellow-400 text-[12px]">
                                <span className="material-symbols-outlined text-[14px]">star</span>
                                <span className="material-symbols-outlined text-[14px]">star</span>
                                <span className="material-symbols-outlined text-[14px]">star</span>
                                <span className="material-symbols-outlined text-[14px]">star</span>
                                <span className="material-symbols-outlined text-[14px]">star</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        "The pattern analysis is incredibly detailed. Hit 4 numbers my first week using the premium engine."
                    </p>
                </div>

                <div className="min-w-[280px] bg-card border border-card-border p-5 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-400"></div>
                        <div>
                            <p className="text-white font-bold text-sm">Sarah L.</p>
                            <div className="flex text-yellow-400 text-[12px]">
                                <span className="material-symbols-outlined text-[14px]">star</span>
                                <span className="material-symbols-outlined text-[14px]">star</span>
                                <span className="material-symbols-outlined text-[14px]">star</span>
                                <span className="material-symbols-outlined text-[14px]">star</span>
                                <span className="material-symbols-outlined text-[14px] opacity-30">star</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        "I appreciate the transparency of the algorithm. Takes the pure gamble out of the process."
                    </p>
                </div>
            </div>
        </section>
    );
}
