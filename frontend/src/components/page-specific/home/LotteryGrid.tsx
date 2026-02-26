'use client';

import React, { useState, useEffect } from 'react';
import { LotteryCard } from './LotteryCard';

interface LotterySet {
    numbers: number[];
    bonusNum: number;
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

    // 랜덤 번호 생성 유틸리티
    const generateRandomSet = (): LotterySet => {
        const pool = Array.from({ length: 45 }, (_, i) => i + 1);
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 7); // 6 numbers + 1 bonus

        const numbers = selected.slice(0, 6).sort((a, b) => a - b);
        const bonusNum = selected[6];

        return { numbers, bonusNum };
    };

    const handleGenerate = () => {
        if (isGenerating) return;

        setIsGenerating(true);
        // 애니메이션 시작 시 모든 공을 빈 상태로 초기화
        setSets(getEmptySets());

        const targetSets = Array.from({ length: 10 }, () => generateRandomSet());
        let currentSetIndex = 0;
        let currentBallIndex = 0; // 0~5: numbers, 6: bonus

        const intervalId = setInterval(() => {
            if (currentSetIndex >= 10) {
                clearInterval(intervalId);
                setIsGenerating(false);
                return;
            }

            // [BUG FIX] React state updater 함수가 큐에서 지연 실행될 때
            // 외부 변수(currentSetIndex, currentBallIndex)가 이미 증가해버리는 클로저 참조 문제 해결을 위해
            // 현재 틱(tick)의 인덱스 값을 상수(const)로 캡처하여 전달합니다.
            const tickSetIndex = currentSetIndex;
            const tickBallIndex = currentBallIndex;

            setSets(prevSets => {
                const newSets = [...prevSets];
                const activeSet = { ...newSets[tickSetIndex] };
                const activeNumbers = [...activeSet.numbers];

                if (tickBallIndex < 6) {
                    activeNumbers[tickBallIndex] = targetSets[tickSetIndex].numbers[tickBallIndex];
                    activeSet.numbers = activeNumbers;
                } else if (tickBallIndex === 6) {
                    activeSet.bonusNum = targetSets[tickSetIndex].bonusNum;
                }

                newSets[tickSetIndex] = activeSet;
                return newSets;
            });

            currentBallIndex++;

            // 한 세트의 공 7개(0~6)를 다 채우면 다음 세트로 넘어감
            if (currentBallIndex > 6) {
                currentBallIndex = 0;
                currentSetIndex++;
            }
        }, 80); // 80ms 간격으로 하나씩 채움 (사용자 요청으로 속도 늦춤)
    };

    // 마운트 시 최초 생성 로직은 제거됨 (사용자가 버튼을 클릭할 때만 생성되도록)

    return (
        <section>
            <div className="bg-card border border-card-border rounded-3xl p-4 sm:p-6 flex flex-col relative overflow-hidden shadow-2xl">
                {/* Background Glow */}
                <div className="absolute top-0 inset-x-0 h-40 bg-primary/20 blur-[60px] pointer-events-none rounded-t-3xl"></div>

                {/* 10 Sets Grid - Card based with large gaps */}
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

                <div className="flex justify-center z-10">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full sm:w-1/2 py-4 bg-primary hover:bg-primary-hover disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-[0_10px_25px_-5px_rgba(21,115,255,0.4)] transition-all flex items-center justify-center gap-2 text-lg"
                    >
                        <span className={`material-symbols-outlined text-[24px] ${isGenerating ? 'animate-spin' : ''}`}>
                            casino
                        </span>
                        {isGenerating ? '생성 중...' : '신규 로또 번호 세트 생성'}
                    </button>
                </div>
            </div>
        </section>
    );
}
