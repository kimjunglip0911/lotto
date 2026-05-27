export type CardTone = 'exclude' | 'adoptAccumulated' | 'adoptChiSquare';

export const TONE_CLASSES: Record<
  CardTone,
  { card: string; title: string; chip: string; emptyChip: string; description: string }
> = {
  exclude: {
    card: 'border-rose-400/30 bg-rose-500/5',
    title: 'text-rose-200',
    chip: 'bg-rose-400/20 text-rose-100',
    emptyChip: 'border-rose-300/30 text-rose-200/40',
    description: 'text-rose-100/80',
  },
  adoptAccumulated: {
    card: 'border-emerald-400/30 bg-emerald-500/5',
    title: 'text-emerald-200',
    chip: 'bg-emerald-400/25 text-emerald-100',
    emptyChip: 'border-emerald-300/30 text-emerald-200/40',
    description: 'text-emerald-100/80',
  },
  adoptChiSquare: {
    card: 'border-sky-400/30 bg-sky-500/5',
    title: 'text-sky-200',
    chip: 'bg-sky-400/25 text-sky-100',
    emptyChip: 'border-sky-300/30 text-sky-200/40',
    description: 'text-sky-100/80',
  },
};
