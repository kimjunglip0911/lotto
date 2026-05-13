/** 조회 버튼에 쓰는 활성·비활성 Tailwind 묶음입니다. */

export const searchRunBtnCls = (enabled: boolean) =>
  `h-[44px] px-5 rounded-xl font-semibold text-sm transition-all ${
    enabled
      ? 'bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 hover:border-primary/60 cursor-pointer'
      : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
  }`;

/** 스냅샷 저장 버튼에 쓰는 활성·비활성 Tailwind 묶음입니다. */

export const snapSaveBtnCls = (enabled: boolean) =>
  `h-[44px] px-5 rounded-xl font-semibold text-sm transition-all ${
    enabled
      ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/40 hover:bg-emerald-500/25 cursor-pointer'
      : 'bg-white/5 text-white/30 border border-white/10 cursor-not-allowed'
  }`;
