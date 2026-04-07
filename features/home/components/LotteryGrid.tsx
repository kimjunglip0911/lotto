'use client';

import React, { useState, useEffect } from 'react';
import { LotteryCard } from '@/components/ui/LotteryCard';
import { SimulationStats } from '@features/home/components/SimulationStats';

interface LotterySet {
    id?: number;
    draw_no?: number;
    method?: string;
    num1: number;
    num2: number;
    num3: number;
    num4: number;
    num5: number;
    num6: number;
}

export function LotteryGrid() {
    const [sets, setSets] = useState<LotterySet[]>([]);
    const [winningNumbers, setWinningNumbers] = useState<(number | '')[]>(Array(6).fill(''));
    const [winningBonus, setWinningBonus] = useState<number | ''>('');
    const [availableDraws, setAvailableDraws] = useState<number[]>([]);
    const [selectedDraw, setSelectedDraw] = useState<number | string>('');

    const fetchAvailableDraws = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
            const response = await fetch(`${apiUrl}/api/drawings/draw-numbers`);
            if (response.ok) {
                const data = await response.json();
                setAvailableDraws(data);
                if (data.length > 0 && !selectedDraw) {
                    setSelectedDraw(data[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching draw numbers:', error);
        }
    };

    useEffect(() => {
        fetchAvailableDraws();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedDraw) return;

        let isMounted = true;
        const loadData = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
                const setsRes = await fetch(`${apiUrl}/api/drawings/by-no?draw_no=${selectedDraw}`);

                if (!isMounted) return;

                // winners API 제거로 회차 변경 시 입력값은 항상 수동 입력 상태로 초기화
                setWinningNumbers(Array(6).fill(''));
                setWinningBonus('');

                if (setsRes.ok) {
                    const setsData = await setsRes.json();
                    setSets(setsData);
                } else {
                    setSets([]);
                }
            } catch (error) {
                console.error('Error loading draw data:', error);
            }
        };

        loadData();
        return () => { isMounted = false; };
    }, [selectedDraw]);

    const handleWinningNumberChange = (index: number, value: string) => {
        const num = value === '' ? '' : parseInt(value, 10) || 0;
        const newWinningNumbers = [...winningNumbers];
        newWinningNumbers[index] = num;
        setWinningNumbers(newWinningNumbers);
    };

    const handleBonusNumberChange = (value: string) => {
        const num = value === '' ? '' : parseInt(value, 10) || 0;
        setWinningBonus(num);
    };


    const mappedSets = sets.map(s => ({
        numbers: [s.num1, s.num2, s.num3, s.num4, s.num5, s.num6],
        method: s.method,
        drawNo: s.draw_no || Number(selectedDraw)
    }));

    return (
        <section>
            <div className="bg-card border border-card-border rounded-3xl p-4 sm:p-6 flex flex-col relative shadow-2xl overflow-visible">
                <div className="absolute top-0 inset-x-0 h-40 bg-primary/20 blur-[60px] pointer-events-none rounded-t-3xl"></div>
                <div className="flex flex-col xl:flex-row xl:justify-between items-center gap-4 xl:gap-8 mb-8 z-10 w-full bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-3 w-full xl:w-auto justify-center xl:justify-start">
                        <span className="text-white/60 font-medium whitespace-nowrap">회차 검색</span>
                        <select value={selectedDraw} onChange={(e) => setSelectedDraw(e.target.value)} className="bg-slate-900 border border-white/20 rounded-xl px-4 py-2.5 text-white font-bold focus:border-primary outline-none transition-all cursor-pointer min-w-[120px] shadow-inner">
                            {availableDraws.length === 0 && <option value="">데이터 없음</option>}
                            {availableDraws.map(drawNo => (
                                <option key={drawNo} value={drawNo}>{drawNo}회</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 w-full xl:w-auto">
                        <div className="flex gap-1.5 sm:gap-2">
                            {winningNumbers.map((num, i) => (
                                <input key={i} type="number" min="1" max="45" value={num} onChange={(e) => handleWinningNumberChange(i, e.target.value)} className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-900/80 border border-white/20 rounded-full text-center text-white font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-white/40 font-bold ml-1 mr-1">+</span>
                            <input type="number" min="1" max="45" value={winningBonus} onChange={(e) => handleBonusNumberChange(e.target.value)} className="w-10 h-10 sm:w-11 sm:h-11 bg-slate-900/80 border border-emerald-500/50 rounded-full text-center text-emerald-400 font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                        </div>
                    </div>
                </div>
                <div className="z-10 w-full mb-2">
                    <h3 className="text-lg font-bold text-white mb-4 ml-1">현재 회차 분석 번호 ({sets.length}세트)</h3>
                    {sets.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                            <span className="material-symbols-outlined text-5xl opacity-50 mb-2">hourglass_empty</span>
                            <p className="text-lg">해당 회차에 분석된 데이터가 아직 없습니다.</p>
                            <p className="text-sm opacity-60">분석/추출 기능 메뉴를 이용해 미리 세트를 생성해 보세요.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                            {mappedSets.map((setInfo, index) => (
                                <LotteryCard key={index} setIndex={index} drawNo={setInfo.drawNo} numbers={setInfo.numbers} method={setInfo.method} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <SimulationStats sets={mappedSets} winningNumbers={winningNumbers as number[]} bonusNumber={winningBonus as number} />
        </section>
    );
}

