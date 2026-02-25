import React from 'react';

export default function Home() {
  return (
    <div className="bg-background text-foreground font-display min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 sticky top-0 z-50 bg-background/95 backdrop-blur-md">
        <button className="text-slate-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>menu</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px' }}>pentagon</span>
          <h1 className="text-white text-xl font-bold tracking-tight">Lotto Elite</h1>
        </div>
        <button className="relative text-slate-400 hover:text-white transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>notifications</span>
          <span className="absolute top-0 right-0 size-2.5 bg-white rounded-full border-2 border-background"></span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4 space-y-8">

        {/* Next Power Draw Card */}
        <section>
          <div className="bg-card border border-card-border rounded-3xl p-6 flex flex-col items-center relative overflow-hidden shadow-2xl">
            {/* Background Glow */}
            <div className="absolute top-0 inset-x-0 h-40 bg-primary/20 blur-[60px] pointer-events-none rounded-t-3xl"></div>

            <div className="bg-[#1a2218]/80 text-[#f3c223] border border-[#f3c223]/30 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 mb-4 z-10">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              SECURE ALGORITHM
            </div>

            <h2 className="text-white text-3xl font-bold mb-2 z-10">Next Power Draw</h2>
            <p className="text-slate-400 text-sm mb-6 z-10">Draw closes in <span className="text-primary font-bold">04:23:12</span></p>

            {/* Numbers */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 w-full z-10">
              {['07', '14', '23', '42', '59'].map((num, i) => (
                <div key={i} className="size-12 sm:size-14 flex items-center justify-center rounded-full bg-background border border-slate-700 shadow-inner">
                  <span className="text-white font-bold text-xl">{num}</span>
                </div>
              ))}
              <div className="size-12 sm:size-14 flex items-center justify-center rounded-full bg-highlight border border-yellow-400 shadow-[0_0_15px_rgba(243,194,35,0.4)]">
                <span className="text-black font-bold text-xl">11</span>
              </div>
            </div>

            <p className="text-slate-300 text-sm mb-4 z-10">
              Estimated Jackpot: <span className="text-green-400 font-bold tracking-wide">$125,000,000</span>
            </p>

            <button className="w-full sm:w-4/5 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-[0_10px_25px_-5px_rgba(21,115,255,0.4)] transition-all flex items-center justify-center gap-2 z-10 text-lg">
              <span className="material-symbols-outlined text-[24px]">autorenew</span>
              Generate Numbers
            </button>
          </div>
        </section>

        {/* Algorithm Transparency */}
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

        {/* Winning Statistics */}
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

            {/* Fake Bar Chart */}
            <div className="flex items-end justify-between h-24 gap-2 px-2 border-b border-card-border pb-1">
              {[40, 60, 50, 100, 50, 80, 45, 65].map((h, i) => (
                <div key={i} className={`w-8 rounded-t-md ${i === 3 ? 'bg-primary' : 'bg-slate-700/50'}`} style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
        </section>

        {/* Elite Members */}
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
      </main>

      {/* Bottom Nav */}
      <nav className="sticky bottom-0 z-50 w-full border-t border-card-border bg-card/95 backdrop-blur px-4 pb-safe pt-2">
        <div className="flex justify-between items-end pb-3 pt-1">
          <a className="flex flex-1 flex-col items-center gap-1 text-primary" href="#">
            <span className="material-symbols-outlined text-[24px]">home</span>
            <p className="text-[10px] sm:text-xs font-bold">Home</p>
          </a>
          <a className="flex flex-1 flex-col items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors" href="#">
            <span className="material-symbols-outlined text-[24px]">history</span>
            <p className="text-[10px] sm:text-xs font-medium">History</p>
          </a>
          <a className="flex flex-1 flex-col items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors" href="#">
            <span className="material-symbols-outlined text-[24px]">bar_chart</span>
            <p className="text-[10px] sm:text-xs font-medium">Analytics</p>
          </a>
          <a className="flex flex-1 flex-col items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors" href="#">
            <span className="material-symbols-outlined text-[24px]">person</span>
            <p className="text-[10px] sm:text-xs font-medium">Profile</p>
          </a>
        </div>
      </nav>
    </div>
  );
}
