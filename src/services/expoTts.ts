import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { TextToSpeech } from './types';

// iOS novelty voices (Bells, Bad News…) and the robotic Eloquence ones.
const isNovelty = (id: string) => id.includes('speech.synthesis') || id.includes('eloquence');

export const expoTts: TextToSpeech = {
  speak(text, locale, { voice, rate } = {}) {
    // Recognition leaves the session in measurement mode, which plays quietly.
    ExpoSpeechRecognitionModule.setCategoryIOS({ category: 'playback', categoryOptions: ['duckOthers'], mode: 'spokenAudio' });
    return new Promise((resolve, reject) => {
      Speech.speak(text, {
        language: locale,
        voice,
        rate,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: (e) => reject(e),
      });
    });
  },
  stop() {
    Speech.stop();
  },
  async voices() {
    const all = await Speech.getAvailableVoicesAsync();
    return all
      .filter((v) => !isNovelty(v.identifier))
      .map((v) => ({ id: v.identifier, name: v.name, locale: v.language, enhanced: v.quality === Speech.VoiceQuality.Enhanced }))
      .sort((a, b) => Number(b.enhanced) - Number(a.enhanced));
  },
};
