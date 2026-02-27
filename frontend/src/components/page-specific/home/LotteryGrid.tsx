'use client';

import React, { useState, useEffect } from 'react';
import { LotteryCard } from './LotteryCard';

interface LotterySet {
    numbers: number[];
    bonusNum: number;
    method?: string; // 추천 기법 정보 추가
}

export function LotteryGrid() {
    // 빈 공 상태를 초기값으로 설정
    const getEmptySets = (): LotterySet[] => {
        return Array.from({ length: 10 }, () => ({
            numbers: [0, 0, 0, 0, 0, 0],
            bonusNum: 0
        }));
    };

    const [sets, setSets] = useState<LotterySet[]>(getEmptySets());
    const [isGenerating, setIsGenerating] = useState(false);

    // 당첨 번호 입력 상태
    const [winningNumbers, setWinningNumbers] = useState<number[]>(Array(6).fill(0));
    const [winningBonus, setWinningBonus] = useState<number>(0);
    const [isApplying, setIsApplying] = useState(false);

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetDrawNo, setTargetDrawNo] = useState<number | string>('');
    const [isDrawNoEditable, setIsDrawNoEditable] = useState(false);

    // 랜덤 번호 생성 유틸리티
    const generateRandomSet = (): LotterySet => {
        const pool = Array.from({ length: 45 }, (_, i) => i + 1);
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 7); // 6 numbers + 1 bonus

        const numbers = selected.slice(0, 6).sort((a, b) => a - b);
        const bonusNum = selected[6];

        return { numbers, bonusNum, method: "Random Generation" };
    };

    const handleAIRecommend = async () => {
        if (isGenerating) return;

        setIsGenerating(true);
        try {
            const response = await fetch('http://localhost:8000/api/drawings/recommend');
            if (!response.ok) throw new Error('Failed to fetch recommendations');
            const data = await response.json();

            if (data.length === 0) {
                alert('추첨 풀이 비어있습니다. 분석 페이지에서 100세트를 먼저 생성해 주세요.');
                setIsGenerating(false);
                return;
            }

            // 추천된 데이터를 UI 형식에 맞춰 변환 (기법 정보 포함)
            const recommendedSets: LotterySet[] = data.map((d: any) => ({
                numbers: [d.num1, d.num2, d.num3, d.num4, d.num5, d.num6],
                bonusNum: d.bonus_num,
                method: d.method // 백엔드에서 온 기법명 그대로 사용
            }));

            // 애니메이션 효과를 위해 잠시 대기 후 세팅
            setSets(getEmptySets());
            setTimeout(() => {
                setSets(recommendedSets);
                setIsGenerating(false);
            }, 500);

        } catch (error) {
            console.error('Error fetching AI recommendations:', error);
            alert('AI 추천 번호를 가져오는데 실패했습니다.');
            setIsGenerating(false);
        }
    };

    const handleConfirmDrawings = async () => {
        if (isGenerating || sets.some(s => s.numbers[0] === 0)) return;

        try {
            const groupId = `group_${Date.now()}`;
            const response = await fetch('http://localhost:8000/api/drawings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    group_id: groupId,
                    drawings: sets.map((s) => ({
                        num1: s.numbers[0],
                        num2: s.numbers[1],
                        num3: s.numbers[2],
                        num4: s.numbers[3],
                        num5: s.numbers[4],
                        num6: s.numbers[5],
                        bonus_num: s.bonusNum,
                        method: s.method || "Manual Selection" // 넘버링 대신 기법명 또는 기본값 저장
                    }))
                })
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message);
            } else {
                alert('저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error saving drawings:', error);
            alert('서버 연결 오류가 발생했습니다.');
        }
    };

    const handleWinningNumberChange = (index: number, value: string) => {
        const num = parseInt(value) || 0;
        if (num >= 0 && num <= 45) {
            const newWinningNumbers = [...winningNumbers];
            newWinningNumbers[index] = num;
            setWinningNumbers(newWinningNumbers);
        }
    };

    const handleBonusNumberChange = (value: string) => {
        const num = parseInt(value) || 0;
        if (num >= 0 && num <= 45) {
            setWinningBonus(num);
        }
    };

    const handleApplyWinning = async () => {
        console.log('Apply button clicked');
        if (isApplying) return;

        if (winningNumbers.some(num => num === 0) || winningBonus === 0) {
            alert('모든 당첨 번호를 입력해 주세요.');
            return;
        }

        setIsApplying(true);
        try {
            console.log('Fetching latest draw no from backend... (no-cache)');
            const response = await fetch('http://localhost:8000/api/winners/latest', {
                cache: 'no-store'
            });
            console.log('Backend response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Network response was not ok: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            console.log('Backend data received:', data);
            const nextNo = (data.latest_draw_no || 0) + 1;
            console.log('Next draw no calculated:', nextNo);

            setTargetDrawNo(nextNo);
            setIsDrawNoEditable(false);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error fetching latest draw no:', error);
            alert('서버로부터 회차 정보를 가져오는데 실패했습니다. 백엔드 서버가 실행 중인지 확인해 주세요.');
        } finally {
            setIsApplying(false);
        }
    };

    const handleFinalConfirmWinner = async () => {
        const drawNo = typeof targetDrawNo === 'string' ? parseInt(targetDrawNo) : targetDrawNo;
        if (!drawNo || drawNo <= 0) {
            alert('올바른 회차 번호를 입력해 주세요.');
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/api/winners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    draw_no: drawNo,
                    num1: winningNumbers[0],
                    num2: winningNumbers[1],
                    num3: winningNumbers[2],
                    num4: winningNumbers[3],
                    num5: winningNumbers[4],
                    num6: winningNumbers[5],
                    bonus_num: winningBonus
                })
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                setIsModalOpen(false);
            } else {
                alert('당첨 번호 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error saving winner:', error);
            alert('서버 연결 오류가 발생했습니다.');
        }
    };

    return (
        <section>
            <div className="bg-card border border-card-border rounded-3xl p-4 sm:p-6 flex flex-col relative overflow-hidden shadow-2xl">
                {/* Background Glow */}
                <div className="absolute top-0 inset-x-0 h-40 bg-primary/20 blur-[60px] pointer-events-none rounded-t-3xl"></div>

                {/* Top: Winning Number Input */}
                <div className="flex flex-col lg:flex-row lg:justify-center items-center gap-4 lg:gap-8 mb-10 z-10 w-full">
                    <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                        <div className="flex gap-2">
                            {winningNumbers.map((num, i) => (
                                <input
                                    key={i}
                                    type="number"
                                    min="1"
                                    max="45"
                                    value={num || ''}
                                    onChange={(e) => handleWinningNumberChange(i, e.target.value)}
                                    placeholder=""
                                    className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 border border-white/20 rounded-full text-center text-white font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-white/40 font-bold">+</span>
                            <input
                                type="number"
                                min="1"
                                max="45"
                                value={winningBonus || ''}
                                onChange={(e) => handleBonusNumberChange(e.target.value)}
                                placeholder=""
                                className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 border border-emerald-500/50 rounded-full text-center text-emerald-400 font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleApplyWinning}
                            disabled={isApplying}
                            className="ml-2 px-6 py-2.5 bg-primary/20 hover:bg-primary/30 disabled:bg-primary/10 disabled:cursor-not-allowed text-white rounded-xl transition-all font-medium border border-primary/30 cursor-pointer z-20 flex items-center gap-2"
                        >
                            {isApplying ? (
                                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                            ) : null}
                            적용
                        </button>
                    </div>
                </div>

                {/* 10 Sets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 xl:gap-8 z-10 mb-8">
                    {sets.map((setInfo, index) => (
                        <LotteryCard
                            key={index}
                            setIndex={index}
                            numbers={setInfo.numbers}
                            bonusNum={setInfo.bonusNum}
                        />
                    ))}
                </div>

                {/* Bottom Buttons */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-6 z-10 w-full px-4 sm:px-0 mt-4">
                    <button
                        onClick={handleAIRecommend}
                        disabled={isGenerating}
                        className="w-full sm:w-1/2 max-w-[400px] py-5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-[0_15px_30px_-10px_rgba(147,51,234,0.4)] transition-all flex items-center justify-center gap-3 text-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <span className="material-symbols-outlined text-[28px]">
                            psychology
                        </span>
                        AI 추천 번호 (10세트)
                    </button>

                    <button
                        onClick={handleConfirmDrawings}
                        disabled={isGenerating || sets[0].numbers[0] === 0}
                        className="w-full sm:w-1/2 max-w-[400px] py-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-[0_15px_30px_-10px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-3 text-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <span className="material-symbols-outlined text-[28px]">
                            check_circle
                        </span>
                        번호 확정 및 저장
                    </button>
                </div>
            </div>

            {/* Modal for Winning Confirmation */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full z-10 shadow-3xl text-center">
                        <span className="material-symbols-outlined text-6xl text-primary mb-4">celebration</span>
                        <h2 className="text-2xl font-bold text-white mb-2">당첨 번호 등록</h2>
                        <div className="mb-6 flex flex-col items-center">
                            <p className="text-white/60 mb-4">입력하신 당첨 번호를 다음 회차로 등록하시겠습니까?</p>
                            <div className="flex items-center gap-3 bg-white/5 px-6 py-4 rounded-2xl border border-white/10">
                                {isDrawNoEditable ? (
                                    <input
                                        type="number"
                                        value={targetDrawNo}
                                        onChange={(e) => setTargetDrawNo(e.target.value)}
                                        className="w-24 bg-slate-800 border border-primary/50 rounded-lg py-2 text-center text-white font-bold text-2xl"
                                        autoFocus
                                    />
                                ) : (
                                    <span className="text-3xl font-black text-primary">{targetDrawNo}</span>
                                )}
                                <span className="text-xl font-bold text-white/80">회차</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-8">
                            <button
                                onClick={() => setIsDrawNoEditable(true)}
                                className="py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10"
                            >
                                회차 수정
                            </button>
                            <button
                                onClick={handleFinalConfirmWinner}
                                className="py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-lg"
                            >
                                확정
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
