import * as Speech from 'expo-speech';
import { expoTts } from '../services/expoTts';

import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock('expo-speech-recognition', () => ({ ExpoSpeechRecognitionModule: { setCategoryIOS: jest.fn() } }));
const speak = Speech.speak as jest.Mock;
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
});
