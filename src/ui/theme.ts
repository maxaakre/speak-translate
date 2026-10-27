import { Side } from '../conversation';

export const INK = '#15172A';
export const MUTED = '#6B6F86';
export const WARN = '#A04500';

// Each person at the table has their own colour.
export const SIDE_THEME: Record<Side, { accent: string; surface: string }> = {
  bottom: { accent: '#2747D9', surface: '#F3F5FF' },
  top: { accent: '#B4235A', surface: '#FFF3F7' },
};
