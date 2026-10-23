import { ConversationState, initialState, reducer, Action } from '../conversation';
import { Services, SttError } from '../services/types';
import { createTurnRunner } from '../turn';
import { Lang } from '../lang';

// A tiny store using the real reducer, so tests assert on what the screen would show.
function makeStore(top: Lang, bottom: Lang) {
  let state = initialState(top, bottom);
  const dispatch = (a: Action) => {
    state = reducer(state, a);
  };
  return { dispatch, getState: (): ConversationState => state };
}

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function fakeServices(overrides: Partial<{ heard: string; translated: string }> = {}) {
  const services = {
    stt: { listen: jest.fn().mockResolvedValue(overrides.heard ?? 'Hej'), stop: jest.fn() },
    translator: {
      isReady: jest.fn().mockResolvedValue(true),
      download: jest.fn().mockResolvedValue(undefined),
      translate: jest.fn().mockResolvedValue(overrides.translated ?? 'Cześć'),
    },
    tts: { speak: jest.fn().mockResolvedValue(undefined), stop: jest.fn() },
  };
  return services satisfies Services;
}

// Like a React component: getState only sees dispatched actions after a "render".
function makeLaggingStore(top: Lang, bottom: Lang) {
  let rendered = initialState(top, bottom);
  let latest = rendered;
  return {
    dispatch: (a: Action) => {
      latest = reducer(latest, a);
    },
    getState: () => rendered,
    render: () => {
      rendered = latest;
    },
    latest: () => latest,
  };
}

describe('turn runner', () => {
  it('listens, translates and speaks the translation on the other half', async () => {
    const store = makeStore('pl', 'sv');
    const services = fakeServices();
    const runner = createTurnRunner(services, store.dispatch, store.getState);

    await runner.startTurn('bottom');

    expect(services.stt.listen).toHaveBeenCalledWith('sv-SE');
    expect(services.translator.translate).toHaveBeenCalledWith('Hej', 'sv', 'pl');
    expect(services.tts.speak).toHaveBeenCalledWith('Cześć', 'pl-PL');
    const s = store.getState();
    expect(s.bottom).toEqual({ lang: 'sv', text: 'Hej', kind: 'heard' });
    expect(s.top).toEqual({ lang: 'pl', text: 'Cześć', kind: 'translation' });
    expect(s.phase).toBe('idle');
  });

  it("shows \"Didn't catch that\" when nothing is heard", async () => {
    const store = makeStore('pl', 'sv');
    const services = fakeServices();
    services.stt.listen.mockRejectedValue(new SttError('no-speech'));

    await createTurnRunner(services, store.dispatch, store.getState).startTurn('bottom');

    expect(store.getState().bottom).toEqual({ lang: 'sv', text: "Didn't catch that", kind: 'message' });
    expect(services.translator.translate).not.toHaveBeenCalled();
    expect(services.tts.speak).not.toHaveBeenCalled();
  });

  it("treats a blank transcript as \"Didn't catch that\"", async () => {
    const store = makeStore('pl', 'sv');
    const services = fakeServices({ heard: '   ' });

    await createTurnRunner(services, store.dispatch, store.getState).startTurn('bottom');

    expect(store.getState().bottom.text).toBe("Didn't catch that");
    expect(services.translator.translate).not.toHaveBeenCalled();
  });

  it('asks to allow the microphone when permission is denied', async () => {
    const store = makeStore('pl', 'sv');
    const services = fakeServices();
    services.stt.listen.mockRejectedValue(new SttError('permission'));

    await createTurnRunner(services, store.dispatch, store.getState).startTurn('top');

    expect(store.getState().top).toEqual({ lang: 'pl', text: 'Allow microphone in Settings', kind: 'message' });
  });

  it('says speech is not available offline when recognition is unavailable', async () => {
    const store = makeStore('pl', 'sv');
    const services = fakeServices();
    services.stt.listen.mockRejectedValue(new SttError('unavailable'));

    await createTurnRunner(services, store.dispatch, store.getState).startTurn('bottom');

    expect(store.getState().bottom.text).toBe('Speech not available offline');
  });

  it('names the missing language pack instead of translating', async () => {
    const store = makeStore('pl', 'sv');
    const services = fakeServices();
    services.translator.isReady.mockImplementation(async (lang: Lang) => lang !== 'pl');

    await createTurnRunner(services, store.dispatch, store.getState).startTurn('bottom');

    expect(store.getState().bottom).toEqual({ lang: 'sv', text: 'Polski not downloaded', kind: 'message' });
    expect(services.translator.translate).not.toHaveBeenCalled();
    expect(services.tts.speak).not.toHaveBeenCalled();
  });

  it('shows "Translation failed" when the translator throws', async () => {
    const store = makeStore('pl', 'sv');
    const services = fakeServices();
    services.translator.translate.mockRejectedValue(new Error('boom'));

    await createTurnRunner(services, store.dispatch, store.getState).startTurn('bottom');

    expect(store.getState().bottom).toEqual({ lang: 'sv', text: 'Translation failed', kind: 'message' });
    expect(services.tts.speak).not.toHaveBeenCalled();
  });

  it('skips translation when both halves use the same language', async () => {
    const store = makeStore('sv', 'sv');
    const services = fakeServices();

    await createTurnRunner(services, store.dispatch, store.getState).startTurn('bottom');

    expect(services.translator.translate).not.toHaveBeenCalled();
    expect(store.getState().top).toEqual({ lang: 'sv', text: 'Hej', kind: 'translation' });
    expect(services.tts.speak).toHaveBeenCalledWith('Hej', 'sv-SE');
  });

  it('a new turn stops the old one and its late result never reaches the screen', async () => {
    const store = makeStore('pl', 'sv');
    const services = fakeServices();
    const firstListen = deferred<string>();
    services.stt.listen.mockReturnValueOnce(firstListen.promise).mockResolvedValueOnce('Tak');
    services.translator.translate.mockImplementation(async (text: string) => (text === 'Tak' ? 'Ja' : 'Cześć'));
    const runner = createTurnRunner(services, store.dispatch, store.getState);

    const first = runner.startTurn('bottom');
    await runner.startTurn('top');
    firstListen.resolve('Hej');
    await first;

    expect(services.stt.stop).toHaveBeenCalled();
    expect(services.tts.stop).toHaveBeenCalled();
    const s = store.getState();
    expect(s.top).toEqual({ lang: 'pl', text: 'Tak', kind: 'heard' });
    expect(s.bottom).toEqual({ lang: 'sv', text: 'Ja', kind: 'translation' });
    expect(services.tts.speak).toHaveBeenCalledTimes(1);
  });

  it('tapping a mic while audio plays stops the playback', async () => {
    const store = makeStore('pl', 'sv');
    const services = fakeServices();
    const speaking = deferred<void>();
    services.tts.speak.mockReturnValueOnce(speaking.promise);
    const runner = createTurnRunner(services, store.dispatch, store.getState);

    const first = runner.startTurn('bottom');
    await new Promise((r) => setTimeout(r, 0));
    expect(store.getState().phase).toBe('speaking');

    await runner.startTurn('top');
    speaking.resolve();
    await first;

    expect(services.tts.stop).toHaveBeenCalled();
    expect(store.getState().phase).toBe('idle');
    expect(store.getState().active).toBeNull();
  });

  it('a second tap before React re-renders still shows its results', async () => {
    const store = makeLaggingStore('pl', 'sv');
    const services = fakeServices();
    const firstListen = deferred<string>();
    services.stt.listen.mockReturnValueOnce(firstListen.promise).mockResolvedValueOnce('Tak');
    services.translator.translate.mockResolvedValue('Ja');
    const runner = createTurnRunner(services, store.dispatch, store.getState);

    const first = runner.startTurn('bottom');
    const second = runner.startTurn('top');
    store.render();
    await second;
    firstListen.resolve('Hej');
    await first;

    expect(store.latest().top).toEqual({ lang: 'pl', text: 'Tak', kind: 'heard' });
    expect(store.latest().bottom).toEqual({ lang: 'sv', text: 'Ja', kind: 'translation' });
    expect(store.latest().phase).toBe('idle');
  });

  it('shows "Translation failed" when checking the language pack throws', async () => {
    const store = makeStore('pl', 'sv');
    const services = fakeServices();
    services.translator.isReady.mockRejectedValue(new Error('native boom'));

    await expect(createTurnRunner(services, store.dispatch, store.getState).startTurn('bottom')).resolves.toBeUndefined();

    expect(store.getState().bottom).toEqual({ lang: 'sv', text: 'Translation failed', kind: 'message' });
    expect(store.getState().phase).toBe('idle');
  });
});
