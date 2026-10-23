import { initialState, other, reducer } from '../conversation';

const base = initialState('pl', 'sv');

describe('conversation reducer', () => {
  it('start sets the active side, listening phase, a new turnId and clears both texts', () => {
    const withText = {
      ...base,
      top: { ...base.top, text: 'old', kind: 'translation' as const },
      bottom: { ...base.bottom, text: 'old', kind: 'heard' as const },
    };
    const s = reducer(withText, { type: 'start', side: 'bottom' });
    expect(s.active).toBe('bottom');
    expect(s.phase).toBe('listening');
    expect(s.turnId).toBe(base.turnId + 1);
    expect(s.top).toEqual({ lang: 'pl', text: '', kind: null });
    expect(s.bottom).toEqual({ lang: 'sv', text: '', kind: null });
  });

  it('heard puts text on the active half and moves to translating', () => {
    const started = reducer(base, { type: 'start', side: 'bottom' });
    const s = reducer(started, { type: 'heard', turnId: started.turnId, text: 'Hej' });
    expect(s.bottom).toEqual({ lang: 'sv', text: 'Hej', kind: 'heard' });
    expect(s.top.text).toBe('');
    expect(s.phase).toBe('translating');
  });

  it('translated puts text on the other half', () => {
    const started = reducer(base, { type: 'start', side: 'top' });
    const s = reducer(started, { type: 'translated', turnId: started.turnId, text: 'Hej' });
    expect(s.bottom).toEqual({ lang: 'sv', text: 'Hej', kind: 'translation' });
    expect(s.top.text).toBe('');
  });

  it('ignores turn actions with a stale turnId', () => {
    const started = reducer(base, { type: 'start', side: 'bottom' });
    const stale = started.turnId - 1;
    expect(reducer(started, { type: 'heard', turnId: stale, text: 'x' })).toBe(started);
    expect(reducer(started, { type: 'translated', turnId: stale, text: 'x' })).toBe(started);
    expect(reducer(started, { type: 'speaking', turnId: stale })).toBe(started);
    expect(reducer(started, { type: 'done', turnId: stale })).toBe(started);
    expect(reducer(started, { type: 'message', turnId: stale, text: 'x' })).toBe(started);
  });

  it('speaking then done returns to idle with no active side', () => {
    const started = reducer(base, { type: 'start', side: 'bottom' });
    const speaking = reducer(started, { type: 'speaking', turnId: started.turnId });
    expect(speaking.phase).toBe('speaking');
    const done = reducer(speaking, { type: 'done', turnId: started.turnId });
    expect(done.phase).toBe('idle');
    expect(done.active).toBeNull();
  });

  it('message shows on the active half and goes idle', () => {
    const started = reducer(base, { type: 'start', side: 'top' });
    const s = reducer(started, { type: 'message', turnId: started.turnId, text: "Didn't catch that" });
    expect(s.top).toEqual({ lang: 'pl', text: "Didn't catch that", kind: 'message' });
    expect(s.phase).toBe('idle');
    expect(s.active).toBeNull();
  });

  it('swap exchanges only the languages', () => {
    const withText = { ...base, top: { ...base.top, text: 'Cześć', kind: 'translation' as const } };
    const s = reducer(withText, { type: 'swap' });
    expect(s.top).toEqual({ lang: 'sv', text: 'Cześć', kind: 'translation' });
    expect(s.bottom.lang).toBe('pl');
  });

  it('setLang changes one half', () => {
    const s = reducer(base, { type: 'setLang', side: 'top', lang: 'es' });
    expect(s.top.lang).toBe('es');
    expect(s.bottom.lang).toBe('sv');
  });

  it('clear empties both texts', () => {
    const started = reducer(base, { type: 'start', side: 'bottom' });
    const heard = reducer(started, { type: 'heard', turnId: started.turnId, text: 'Hej' });
    const s = reducer(heard, { type: 'clear' });
    expect(s.top).toEqual({ lang: 'pl', text: '', kind: null });
    expect(s.bottom).toEqual({ lang: 'sv', text: '', kind: null });
  });

  it('other returns the opposite side', () => {
    expect(other('top')).toBe('bottom');
    expect(other('bottom')).toBe('top');
  });
});
