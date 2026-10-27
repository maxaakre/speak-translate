import * as Speech from 'expo-speech';
import { expoTts } from '../services/expoTts';

import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  getAvailableVoicesAsync: jest.fn(),
  VoiceQuality: { Default: 'Default', Enhanced: 'Enhanced' },
}));
jest.mock('expo-speech-recognition', () => ({ ExpoSpeechRecognitionModule: { setCategoryIOS: jest.fn() } }));
const speak = Speech.speak as jest.Mock;
const getVoices = Speech.getAvailableVoicesAsync as jest.Mock;
const setCategoryIOS = ExpoSpeechRecognitionModule.setCategoryIOS as jest.Mock;

describe('expoTts', () => {
  it('speaks in the given locale and resolves when done', async () => {
    speak.mockImplementation((_t, opts) => opts.onDone());
    await expect(expoTts.speak('Cześć', 'pl-PL')).resolves.toBeUndefined();
    expect(speak).toHaveBeenCalledWith('Cześć', expect.objectContaining({ language: 'pl-PL' }));
  });

  it('resolves when speech is stopped early', async () => {
    speak.mockImplementation((_t, opts) => opts.onStopped());
    await expect(expoTts.speak('Hej', 'sv-SE')).resolves.toBeUndefined();
  });

  it('rejects when the voice fails', async () => {
    speak.mockImplementation((_t, opts) => opts.onError(new Error('no voice')));
    await expect(expoTts.speak('Hej', 'sv-SE')).rejects.toThrow('no voice');
  });

  it('switches the audio session to loud playback before speaking', async () => {
    const order: string[] = [];
    setCategoryIOS.mockImplementation(() => order.push('category'));
    speak.mockImplementation((_t, opts) => {
      order.push('speak');
      opts.onDone();
    });
    await expoTts.speak('Hej', 'sv-SE');
    expect(setCategoryIOS).toHaveBeenCalledWith(expect.objectContaining({ category: 'playback', mode: 'spokenAudio' }));
    expect(order).toEqual(['category', 'speak']);
  });

  it('speaks with the chosen voice', async () => {
    speak.mockImplementation((_t, opts) => opts.onDone());
    await expoTts.speak('Hej', 'sv-SE', 'com.apple.voice.enhanced.sv-SE.Alva');
    expect(speak).toHaveBeenCalledWith('Hej', expect.objectContaining({ voice: 'com.apple.voice.enhanced.sv-SE.Alva' }));
  });

  it('lists real voices, better quality first, without the novelty ones', async () => {
    getVoices.mockResolvedValue([
      { identifier: 'com.apple.voice.compact.sv-SE.Alva', name: 'Alva', quality: 'Default', language: 'sv-SE' },
      { identifier: 'com.apple.speech.synthesis.voice.Bells', name: 'Bells', quality: 'Default', language: 'en-US' },
      { identifier: 'com.apple.eloquence.en-US.Eddy', name: 'Eddy', quality: 'Default', language: 'en-US' },
      { identifier: 'com.apple.voice.enhanced.sv-SE.Oskar', name: 'Oskar', quality: 'Enhanced', language: 'sv-SE' },
    ]);
    expect(await expoTts.voices()).toEqual([
      { id: 'com.apple.voice.enhanced.sv-SE.Oskar', name: 'Oskar', locale: 'sv-SE', enhanced: true },
      { id: 'com.apple.voice.compact.sv-SE.Alva', name: 'Alva', locale: 'sv-SE', enhanced: false },
    ]);
  });
});
