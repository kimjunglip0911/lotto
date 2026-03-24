'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';

interface LottoWinner {
  draw_no: number;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  winner_count?: number;
  winner_amount?: number;
}

export default function WinnersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [winners, setWinners] = useState<LottoWinner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDrawNo, setEditingDrawNo] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ count: string; amount: string }>({ count: '', amount: '' });

  const fetchWinners = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/winners`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setWinners(data);
    } catch (error) {
      console.error('Error fetching winners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWinners();
  }, []);

  const handleDeleteWinner = async (drawNo: number) => {
    if (!confirm(`${drawNo}회차 당첨 정보를 삭제하시겠습니까?`)) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/winners/${drawNo}`, { method: 'DELETE' });
      if (response.ok) {
        alert('삭제되었습니다.');
        fetchWinners();
      }
    } catch (error) {
      console.error('Error deleting winner:', error);
    }
  };

  const startEditing = (winner: LottoWinner) => {
    setEditingDrawNo(winner.draw_no);
    setEditValues({
      count: winner.winner_count?.toString() || '',
      amount: winner.winner_amount?.toString() || '',
    });
  };

  const cancelEditing = () => setEditingDrawNo(null);

  const saveStats = async (drawNo: number) => {
    try {
      const count = editValues.count.trim() === '' ? null : parseInt(editValues.count, 10);
      const amount = editValues.amount.trim() === '' ? null : parseInt(editValues.amount, 10);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/winners/${drawNo}/stats`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner_count: count, winner_amount: amount }),
      });
      if (response.ok) {
        setEditingDrawNo(null);
        fetchWinners();
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  const getBallColor = (num: number) => {
    if (num <= 10) return 'bg-[#fbc400] shadow-[0_0_10px_rgba(251,196,0,0.4)]';
    if (num <= 20) return 'bg-[#69c8f2] shadow-[0_0_10px_rgba(105,200,242,0.4)]';
    if (num <= 30) return 'bg-[#ff7272] shadow-[0_0_10px_rgba(255,114,114,0.4)]';
    if (num <= 40) return 'bg-[#aaaaaa] shadow-[0_0_10px_rgba(170,170,170,0.4)]';
    return 'bg-[#b0d840] shadow-[0_0_10px_rgba(176,216,64,0.4)]';
  };

  return (
    <div className="bg-background min-h-screen flex justify-center w-full overflow-x-hidden">
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col w-full lg:w-[95%] xl:w-[95%] 2xl:w-[90%] max-w-[1920px] border-x border-card-border/30 relative shadow-2xl">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto pb-12 px-4 pt-6 space-y-6">
          <div className="flex flex-col gap-2 mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight">역대 당첨 리스트</h2>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="bg-card-bg/40 border border-card-border/20 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-card-border/20">
                    {winners.map((winner) => (
                      <tr key={winner.draw_no} className="hover:bg-white/5 transition-colors group">
                        <td className="p-5">{winner.draw_no}회</td>
                        <td className="p-5">
                          <div className="flex gap-2">
                            {[winner.num1, winner.num2, winner.num3, winner.num4, winner.num5, winner.num6].map((num, idx) => (
                              <div key={idx} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${getBallColor(num)}`}>
                                {num}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-5 text-right">{editingDrawNo === winner.draw_no ? <input value={editValues.count} onChange={(e) => setEditValues({ ...editValues, count: e.target.value })} /> : winner.winner_count?.toLocaleString() || '-'}</td>
                        <td className="p-5 text-right">{editingDrawNo === winner.draw_no ? <input value={editValues.amount} onChange={(e) => setEditValues({ ...editValues, amount: e.target.value })} /> : winner.winner_amount?.toLocaleString() || '-'}</td>
                        <td className="p-5 text-center">
                          {editingDrawNo === winner.draw_no ? (
                            <>
                              <button onClick={() => saveStats(winner.draw_no)}>저장</button>
                              <button onClick={cancelEditing}>취소</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEditing(winner)}>수정</button>
                              <button onClick={() => handleDeleteWinner(winner.draw_no)}>삭제</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

