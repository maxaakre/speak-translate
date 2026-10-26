import { ExpoSpeechRecognitionErrorCode, ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { OnDeviceSpeech } from '../../modules/mlkit-translate';
import { SpeechToText, SttError, SttErrorCode } from './types';

const TIMEOUT_MS = 15_000;

function toSttCode(error: ExpoSpeechRecognitionErrorCode): SttErrorCode {
  switch (error) {
    case 'no-speech':
    case 'speech-timeout':
    case 'aborted':
      return 'no-speech';
    case 'not-allowed':
      return 'permission';
    default:
      return 'unavailable';
  }
}

// Bumped by stop(), so a listen() still waiting on permission never starts.
let generation = 0;
let sessionOpen = false;
// abort() sends 'aborted' + 'end' late; the next session waits for them before listening.
let previousEnded: Promise<void> = Promise.resolve();

export const expoStt: SpeechToText = {
  async listen(locale) {
    const mine = generation;
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) throw new SttError('permission');
    if (!OnDeviceSpeech.supportsOnDevice(locale)) throw new SttError('unavailable');
    await previousEnded;
    if (mine !== generation) throw new SttError('no-speech');

    let markEnded!: () => void;
    previousEnded = new Promise((r) => (markEnded = r));
    sessionOpen = true;

    return new Promise<string>((resolve, reject) => {
      let transcript = '';
      let failure: SttError | null = null;
      let settled = false;

      const finish = (error: SttError | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        subs.forEach((s) => s.remove());
        sessionOpen = false;
        markEnded();
        if (error) reject(error);
        else if (transcript) resolve(transcript);
        else reject(new SttError('no-speech'));
      };

      const subs = [
        ExpoSpeechRecognitionModule.addListener('result', (e) => {
          if (e.isFinal) transcript = e.results[0]?.transcript ?? '';
        }),
        ExpoSpeechRecognitionModule.addListener('error', (e) => {
          failure = new SttError(toSttCode(e.error), e.message);
        }),
        // 'end' always fires last, after a result or an error.
        ExpoSpeechRecognitionModule.addListener('end', () => finish(failure)),
      ];
      // Safety net: some native failures never send 'end'.
      const timer = setTimeout(() => {
        ExpoSpeechRecognitionModule.abort();
        finish(new SttError('no-speech'));
      }, TIMEOUT_MS);

      ExpoSpeechRecognitionModule.start({
        lang: locale,
        requiresOnDeviceRecognition: true,
        // On-device recognition only ends by itself on silence when partial results are on.
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
      });
    });
  },
  stop() {
    generation += 1;
    if (sessionOpen) ExpoSpeechRecognitionModule.abort();
  },
};
