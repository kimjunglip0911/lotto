'use client';

import React from 'react';
import { LotteryCard } from './LotteryCard';

export function LotteryGrid() {
    // Temporary mock data generator for 10 sets
    const generateMockSets = () => {
        return Array.from({ length: 10 }, () => ({
            numbers: [4, 12, 25, 31, 38, 43],
            bonusNum: 7
        }));
    };

    const sets = generateMockSets();

    return (
        <section>
            <div className="bg-card border border-card-border rounded-3xl p-4 sm:p-6 flex flex-col relative overflow-hidden shadow-2xl">
                {/* Background Glow */}
                <div className="absolute top-0 inset-x-0 h-40 bg-primary/20 blur-[60px] pointer-events-none rounded-t-3xl"></div>

                {/* 10 Sets Grid - Card based with large gaps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6 xl:gap-8 z-10 mb-8">
                    {sets.map((setInfo, index) => (
                        <LotteryCard
                            key={index}
                            setIndex={index}
                            numbers={setInfo.numbers}
                            bonusNum={setInfo.bonusNum}
                        />
                    ))}
                </div>

                <div className="flex justify-center z-10">
                    <button className="w-full sm:w-1/2 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-[0_10px_25px_-5px_rgba(21,115,255,0.4)] transition-all flex items-center justify-center gap-2 text-lg">
                        <span className="material-symbols-outlined text-[24px]">autorenew</span>
                        Generate New Sets
                    </button>
                </div>
            </div>
        </section>
    );
}
