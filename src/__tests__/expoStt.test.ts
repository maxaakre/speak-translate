import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
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
    abort: jest.fn(),
  },
}));

const mod = ExpoSpeechRecognitionModule as jest.Mocked<typeof ExpoSpeechRecognitionModule>;

beforeEach(() => {
  jest.clearAllMocks();
  mod.requestPermissionsAsync.mockResolvedValue({ granted: true } as any);
});

const flush = () => new Promise((r) => setTimeout(r, 0));

async function codeOf(p: Promise<string>) {
  const e = await p.catch((err) => err);
  return e instanceof SttError ? e.code : `not SttError: ${e}`;
}

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

  it('rejects with permission when the user denies access', async () => {
    mod.requestPermissionsAsync.mockResolvedValue({ granted: false } as any);
    expect(await codeOf(expoStt.listen('sv-SE'))).toBe('permission');
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

  it('stop aborts recognition', () => {
    expoStt.stop();
    expect(mod.abort).toHaveBeenCalled();
  });
});
