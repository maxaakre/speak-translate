import { Lang } from './lang';

export type Side = 'top' | 'bottom';
export type Phase = 'idle' | 'listening' | 'translating' | 'speaking';

export interface Half {
  lang: Lang;
  text: string;
  kind: 'heard' | 'translation' | 'message' | null;
}

export interface ConversationState {
  top: Half;
  bottom: Half;
  active: Side | null;
  phase: Phase;
  turnId: number;
}

export type Action =
  | { type: 'start'; side: Side; turnId: number }
  | { type: 'heard'; turnId: number; text: string }
  | { type: 'translated'; turnId: number; text: string }
  | { type: 'speaking'; turnId: number }
  | { type: 'done'; turnId: number }
  | { type: 'message'; turnId: number; text: string }
  | { type: 'setLang'; side: Side; lang: Lang }
  | { type: 'swap' }
  | { type: 'clear' };

export const other = (side: Side): Side => (side === 'top' ? 'bottom' : 'top');

const empty = (half: Half): Half => ({ ...half, text: '', kind: null });

export function initialState(top: Lang, bottom: Lang): ConversationState {
  return {
    top: { lang: top, text: '', kind: null },
    bottom: { lang: bottom, text: '', kind: null },
    active: null,
    phase: 'idle',
    turnId: 0,
  };
}

export function reducer(s: ConversationState, a: Action): ConversationState {
  // Results from a cancelled turn arrive late; drop them.
  if (a.type !== 'start' && 'turnId' in a && a.turnId !== s.turnId) return s;

  switch (a.type) {
    case 'start':
      return { ...s, top: empty(s.top), bottom: empty(s.bottom), active: a.side, phase: 'listening', turnId: a.turnId };
    case 'heard':
      if (!s.active) return s;
      return { ...s, [s.active]: { ...s[s.active], text: a.text, kind: 'heard' }, phase: 'translating' };
    case 'translated': {
      if (!s.active) return s;
      const to = other(s.active);
      return { ...s, [to]: { ...s[to], text: a.text, kind: 'translation' } };
    }
    case 'speaking':
      return { ...s, phase: 'speaking' };
    case 'done':
      return { ...s, phase: 'idle', active: null };
    case 'message':
      if (!s.active) return s;
      return { ...s, [s.active]: { ...s[s.active], text: a.text, kind: 'message' }, phase: 'idle', active: null };
    case 'setLang':
      return { ...s, [a.side]: { ...s[a.side], lang: a.lang } };
    case 'swap':
      return { ...s, top: { ...s.top, lang: s.bottom.lang }, bottom: { ...s.bottom, lang: s.top.lang } };
    case 'clear':
      return { ...s, top: empty(s.top), bottom: empty(s.bottom) };
  }
}
