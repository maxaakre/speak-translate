import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { OnDeviceSpeech } from '../../modules/mlkit-translate';
import { expoStt } from '../services/expoStt';
import { SttError } from '../services/types';

type Listener = (e: any) => void;
const listeners: Record<string, Listener> = {};

jest.mock('expo-speech-recognition', () => ({
  ExpoSpeechRecognitionModule: {
    requestPermissionsAsync: jest.fn(),
    addListener: jest.fn((name: string, fn: Listener) => {
      listeners[name] = fn;
      return { remove: jest.fn() };
    }),
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
  },
}));

jest.mock('../../modules/mlkit-translate', () => ({
  __esModule: true,
  default: {},
  OnDeviceSpeech: { supportsOnDevice: jest.fn() },
}));

const mod = ExpoSpeechRecognitionModule as jest.Mocked<typeof ExpoSpeechRecognitionModule>;
const supportsOnDevice = OnDeviceSpeech.supportsOnDevice as jest.Mock;

const flush = () => new Promise((r) => setTimeout(r, 0));

async function codeOf(p: Promise<string>) {
  const e = await p.catch((err) => err);
  return e instanceof SttError ? e.code : `not SttError: ${e}`;
}

// Ends whatever session the previous test left open, so tests stay independent.
afterEach(async () => {
  listeners.end?.({});
  await flush();
});

beforeEach(() => {
  jest.clearAllMocks();
  mod.requestPermissionsAsync.mockResolvedValue({ granted: true } as any);
  supportsOnDevice.mockReturnValue(true);
});

describe('expoStt', () => {
  it('starts on-device recognition in the given locale and resolves the final transcript', async () => {
    const p = expoStt.listen('sv-SE');
    await flush();
    expect(mod.start).toHaveBeenCalledWith(
      expect.objectContaining({ lang: 'sv-SE', requiresOnDeviceRecognition: true, continuous: false }),
    );
    listeners.result({ isFinal: true, results: [{ transcript: 'Hej', confidence: 1, segments: [] }] });
    listeners.end({});
    await expect(p).resolves.toBe('Hej');
  });

  it('asks for partial results so on-device recognition ends on silence', async () => {
    expoStt.listen('sv-SE').catch(() => {});
    await flush();
    expect(mod.start).toHaveBeenCalledWith(expect.objectContaining({ interimResults: true }));
  });

  it('resolves only the final transcript, not partial ones', async () => {
    const p = expoStt.listen('sv-SE');
    await flush();
    listeners.result({ isFinal: false, results: [{ transcript: 'Hej h', confidence: 0, segments: [] }] });
    listeners.result({ isFinal: true, results: [{ transcript: 'Hej hej', confidence: 1, segments: [] }] });
    listeners.end({});
    await expect(p).resolves.toBe('Hej hej');
  });

  it('rejects with permission when the user denies access', async () => {
    mod.requestPermissionsAsync.mockResolvedValue({ granted: false } as any);
    expect(await codeOf(expoStt.listen('sv-SE'))).toBe('permission');
    expect(mod.start).not.toHaveBeenCalled();
  });

  it('rejects with unavailable instead of using the network when the locale has no on-device recognition', async () => {
    supportsOnDevice.mockReturnValue(false);
    expect(await codeOf(expoStt.listen('sv-SE'))).toBe('unavailable');
    expect(supportsOnDevice).toHaveBeenCalledWith('sv-SE');
    expect(mod.start).not.toHaveBeenCalled();
  });

  it.each([
    ['no-speech', 'no-speech'],
    ['speech-timeout', 'no-speech'],
    ['not-allowed', 'permission'],
    ['language-not-supported', 'unavailable'],
    ['service-not-allowed', 'unavailable'],
    ['network', 'unavailable'],
  ])('maps the %s error to %s', async (native, expected) => {
    const p = expoStt.listen('pl-PL');
    await flush();
    listeners.error({ error: native, message: '' });
    listeners.end({});
    expect(await codeOf(p)).toBe(expected);
  });

  it('rejects with no-speech when recognition ends without a result', async () => {
    const p = expoStt.listen('es-ES');
    await flush();
    listeners.end({});
    expect(await codeOf(p)).toBe('no-speech');
  });

  it('stop aborts an open session', async () => {
    const p = expoStt.listen('sv-SE');
    await flush();
    expoStt.stop();
    expect(mod.abort).toHaveBeenCalledTimes(1);
    listeners.end({});
    await p.catch(() => {});
  });

  it('finish stops listening and keeps the transcript', async () => {
    const p = expoStt.listen('sv-SE');
    await flush();
    expoStt.finish();
    expect(mod.stop).toHaveBeenCalledTimes(1);
    expect(mod.abort).not.toHaveBeenCalled();
    listeners.result({ isFinal: true, results: [{ transcript: 'Hej', confidence: 1, segments: [] }] });
    listeners.end({});
    await expect(p).resolves.toBe('Hej');
  });

  it('finish does nothing when no session is open', () => {
    expoStt.finish();
    expect(mod.stop).not.toHaveBeenCalled();
  });

  it('stop does nothing when no session is open', () => {
    expoStt.stop();
    expect(mod.abort).not.toHaveBeenCalled();
  });

  it("a new listen waits for the aborted session's end before starting, so old events can't end it", async () => {
    const first = expoStt.listen('sv-SE');
    await flush();
    expoStt.stop();
    const second = expoStt.listen('pl-PL');
    await flush();
    expect(mod.start).toHaveBeenCalledTimes(1);

    listeners.error({ error: 'aborted', message: '' });
    listeners.end({});
    expect(await codeOf(first)).toBe('no-speech');
    await flush();
    expect(mod.start).toHaveBeenCalledTimes(2);
    expect(mod.start).toHaveBeenLastCalledWith(expect.objectContaining({ lang: 'pl-PL' }));

    listeners.result({ isFinal: true, results: [{ transcript: 'Tak', confidence: 1, segments: [] }] });
    listeners.end({});
    await expect(second).resolves.toBe('Tak');
  });

  it('stop during the permission prompt prevents the session from starting', async () => {
    let grant!: (v: any) => void;
    mod.requestPermissionsAsync.mockReturnValue(new Promise((r) => (grant = r)));
    const p = expoStt.listen('sv-SE');
    expoStt.stop();
    grant({ granted: true });
    expect(await codeOf(p)).toBe('no-speech');
    expect(mod.start).not.toHaveBeenCalled();
  });

  it('gives up with no-speech after 15 seconds if recognition never ends', async () => {
    jest.useFakeTimers();
    try {
      const p = expoStt.listen('sv-SE');
      const code = codeOf(p);
      await jest.advanceTimersByTimeAsync(15_000);
      expect(await code).toBe('no-speech');
      expect(mod.abort).toHaveBeenCalled();

      // The next turn is not blocked by the stuck session.
      expoStt.listen('pl-PL').catch(() => {});
      await jest.advanceTimersByTimeAsync(0);
      expect(mod.start).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });
});
