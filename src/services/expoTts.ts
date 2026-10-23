import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { TextToSpeech } from './types';

export const expoTts: TextToSpeech = {
  speak(text, locale) {
    // Recognition leaves the session in measurement mode, which plays quietly.
    ExpoSpeechRecognitionModule.setCategoryIOS({ category: 'playback', categoryOptions: ['duckOthers'], mode: 'spokenAudio' });
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
