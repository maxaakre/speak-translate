import * as Speech from 'expo-speech';
import { TextToSpeech } from './types';

export const expoTts: TextToSpeech = {
  speak(text, locale) {
    return new Promise((resolve, reject) => {
      Speech.speak(text, {
        language: locale,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: (e) => reject(e),
      });
    });
  },
  stop() {
    Speech.stop();
  },
};
