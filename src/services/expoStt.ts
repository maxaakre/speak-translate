import { ExpoSpeechRecognitionErrorCode, ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { SpeechToText, SttError, SttErrorCode } from './types';

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

export const expoStt: SpeechToText = {
  async listen(locale) {
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) throw new SttError('permission');

    return new Promise<string>((resolve, reject) => {
      let transcript = '';
      let failure: SttError | null = null;
      const subs = [
        ExpoSpeechRecognitionModule.addListener('result', (e) => {
          if (e.isFinal) transcript = e.results[0]?.transcript ?? '';
        }),
        ExpoSpeechRecognitionModule.addListener('error', (e) => {
          failure = new SttError(toSttCode(e.error), e.message);
        }),
        // 'end' always fires last, after a result or an error.
        ExpoSpeechRecognitionModule.addListener('end', () => {
          subs.forEach((s) => s.remove());
          if (failure) reject(failure);
          else if (transcript) resolve(transcript);
          else reject(new SttError('no-speech'));
        }),
      ];
      ExpoSpeechRecognitionModule.start({
        lang: locale,
        requiresOnDeviceRecognition: true,
        interimResults: false,
        continuous: false,
        addsPunctuation: true,
      });
    });
  },
  stop() {
    ExpoSpeechRecognitionModule.abort();
  },
};
