'use client';

import React, { useState, useEffect } from 'react';
import { LotteryCard } from './LotteryCard';

interface LotterySet {
    numbers: number[];
    method?: string; // 추천 기법 정보 추가
    drawCount: number; // 구매(확정) 횟수 추가
}

export function LotteryGrid() {
    // 빈 공 상태를 초기값으로 설정
    const getEmptySets = (): LotterySet[] => {
        return Array.from({ length: 10 }, () => ({
            numbers: [0, 0, 0, 0, 0, 0],
            drawCount: 0
        }));
    };

    const [sets, setSets] = useState<LotterySet[]>(getEmptySets());
    const [isGenerating, setIsGenerating] = useState(false);

    // 당첨 번호 입력 상태
    const [winningNumbers, setWinningNumbers] = useState<number[]>(Array(6).fill(0));
    const [winningBonus, setWinningBonus] = useState<number>(0);
    const [isApplying, setIsApplying] = useState(false);
    const [availableDraws, setAvailableDraws] = useState<number[]>([]);
    const [selectedDraw, setSelectedDraw] = useState<number | string>('');

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetDrawNo, setTargetDrawNo] = useState<number | string>('');
    const [isDrawNoEditable, setIsDrawNoEditable] = useState(false);

    // 랜덤 번호 생성 유틸리티
    const generateRandomSet = (): LotterySet => {
        const pool = Array.from({ length: 45 }, (_, i) => i + 1);
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 6);

        const numbers = selected.sort((a, b) => a - b);

        return { numbers, method: "Random Generation", drawCount: 0 };
    };

    const fetchAvailableDraws = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await fetch(`${apiUrl}/api/drawings/draw-numbers`);
            if (response.ok) {
                const data = await response.json();
                setAvailableDraws(data);
                if (data.length > 0 && !selectedDraw) {
                    setSelectedDraw(data[0]); // 최신 회차 기본 선택
                }
            }
        } catch (error) {
            console.error('Error fetching draw numbers:', error);
        }
    };

    useEffect(() => {
        fetchAvailableDraws();
    }, []);

    const handleAIRecommend = async () => {
        if (isGenerating) return;

        setIsGenerating(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const url = selectedDraw
                ? `${apiUrl}/api/drawings/recommend?draw_no=${selectedDraw}`
                : `${apiUrl}/api/drawings/recommend`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch recommendations');
            const data = await response.json();

            if (data.length === 0) {
                alert('추첨 풀이 비어있습니다. 분석 페이지에서 100세트를 먼저 생성해 주세요.');
                setIsGenerating(false);
                return;
            }

            // 추천된 데이터를 UI 형식에 맞춰 변환 (기법 정보 및 draw_count 포함)
            const recommendedSets: LotterySet[] = data.map((d: any) => ({
                numbers: [d.num1, d.num2, d.num3, d.num4, d.num5, d.num6],
                method: d.method, // 백엔드에서 온 기법명 그대로 사용
                drawCount: d.draw_count || 0
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
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await fetch(`${apiUrl}/api/drawings`, {
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
                        method: s.method || "Manual Selection" // 넘버링 대신 기법명 또는 기본값 저장
                    }))
                })
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message);

                // 저장 성공 후 현재 세트들의 drawCount를 1씩 증가시켜 UI 반영 (추가 구매 연출)
                setSets(prev => prev.map(s => ({ ...s, drawCount: s.drawCount + 1 })));
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
        if (isApplying) return;

        // 모든 입력값을 정수형 숫자로 강제 변환 (타입 불일치 방지)
        const winNums = winningNumbers.map(n => parseInt(String(n), 10)).filter(n => !isNaN(n));
        const winBonus = parseInt(String(winningBonus), 10);

        if (winNums.length < 6 || winNums.some(num => num === 0) || isNaN(winBonus) || winBonus === 0) {
            alert('모든 당첨 번호와 보너스 번호를 입력해 주세요.');
            return;
        }

        setIsApplying(true);
        try {
            // 1. 검사 대상 회차 결정 (선택된 회차가 있으면 그것을 우선 사용)
            let checkRound: number;
            if (selectedDraw) {
                checkRound = Number(selectedDraw);
            } else {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                const latestResponse = await fetch(`${apiUrl}/api/winners/latest`, { cache: 'no-store' });
                if (!latestResponse.ok) throw new Error('회차 정보를 가져오지 못했습니다.');
                const latestData = await latestResponse.json();
                checkRound = (latestData.latest_draw_no || 0) + 1;
            }

            // 2. 해당 회차의 모든 추천 데이터(70~100개) 백엔드에서 조회
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const allSetsResponse = await fetch(`${apiUrl}/api/drawings/by-no?draw_no=${checkRound}`);
            if (!allSetsResponse.ok) throw new Error('전체 추천 데이터를 가져오지 못했습니다.');
            const allSetsData = await allSetsResponse.json();

            if (allSetsData.length === 0) {
                alert(`${checkRound}회차에 대한 추천 데이터가 없습니다. 먼저 번호를 생성해 주세요.`);
                setIsApplying(false);
                return;
            }

            // 3. 전체 데이터 대상 당첨 등수 판별 로직 (구매 여부 분리)
            type WinCounts = Record<number, number>;
            const purchasedWins: WinCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            const unpurchasedWins: WinCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

            allSetsData.forEach((d: any) => {
                const sNums = [
                    parseInt(String(d.num1), 10),
                    parseInt(String(d.num2), 10),
                    parseInt(String(d.num3), 10),
                    parseInt(String(d.num4), 10),
                    parseInt(String(d.num5), 10),
                    parseInt(String(d.num6), 10)
                ];

                // 일치하는 번호 개수 확인
                const matchCount = sNums.filter(num => winNums.includes(num)).length;
                const isBonusMatched = sNums.includes(winBonus);

                let rank = 0;
                if (matchCount === 6) rank = 1;
                else if (matchCount === 5 && isBonusMatched) rank = 2;
                else if (matchCount === 5) rank = 3;
                else if (matchCount === 4) rank = 4;
                else if (matchCount === 3) rank = 5;

                if (rank > 0) {
                    if (Number(d.draw_count || 0) > 0) {
                        purchasedWins[rank]++;
                    } else {
                        unpurchasedWins[rank]++;
                    }
                }
            });

            // 4. 결과 리포트 생성 및 안내
            const getSummary = (wins: WinCounts) => {
                const s = [];
                if (wins[1] > 0) s.push(`1등: ${wins[1]}개`);
                if (wins[2] > 0) s.push(`2등: ${wins[2]}개`);
                if (wins[3] > 0) s.push(`3등: ${wins[3]}개`);
                if (wins[4] > 0) s.push(`4등: ${wins[4]}개`);
                if (wins[5] > 0) s.push(`5등: ${wins[5]}개`);
                return s.join(', ');
            };

            const totalPurchased = Object.values(purchasedWins).reduce((a, b) => a + b, 0);
            const totalUnpurchased = Object.values(unpurchasedWins).reduce((a, b) => a + b, 0);

            if (totalPurchased === 0 && totalUnpurchased === 0) {
                alert(`${checkRound}회차 전체 추천 ${allSetsData.length}세트 분석 결과:\n\n꽝입니다. 😂\n\n입력하신 번호: ${winNums.join(', ')}`);
            } else {
                let finalMsg = `${checkRound}회차 전체 추천 ${allSetsData.length}세트 분석 결과:\n\n`;
                if (totalPurchased > 0) {
                    finalMsg += `🎊 축하합니다! 구매하신 번호에서 당첨이 나왔습니다!\n내역: ${getSummary(purchasedWins)}\n\n`;
                }
                if (totalUnpurchased > 0) {
                    finalMsg += `아쉽지만 구매하지 않은 번호에서 당첨 되었습니다.\n내역: ${getSummary(unpurchasedWins)}\n\n`;
                }
                alert(`${finalMsg}확인 버튼을 누르면 이 번호를 당첨 번호로 저장합니다.`);
            }

            // 5. 모달 띄우기 (회차 정보는 이미 checkRound임)
            setTargetDrawNo(checkRound);
            setIsDrawNoEditable(false);
            setIsModalOpen(true);

        } catch (error) {
            console.error('Error during winning check:', error);
            alert('당첨 확인 중 오류가 발생했습니다.');
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
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await fetch(`${apiUrl}/api/winners`, {
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

                    {/* Round Selection List Box */}
                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                        <span className="text-white/60 font-medium text-sm whitespace-nowrap">회차 선택</span>
                        <select
                            value={selectedDraw}
                            onChange={(e) => setSelectedDraw(e.target.value)}
                            className="bg-slate-900 border border-white/20 rounded-xl px-4 py-2 text-white font-bold focus:border-primary outline-none transition-all cursor-pointer min-w-[100px]"
                        >
                            <option value="">회차 선택</option>
                            {availableDraws.map(drawNo => (
                                <option key={drawNo} value={drawNo}>{drawNo}회</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 10 Sets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 xl:gap-8 z-10 mb-8">
                    {sets.map((setInfo, index) => (
                        <LotteryCard
                            key={index}
                            setIndex={index}
                            numbers={setInfo.numbers}
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
