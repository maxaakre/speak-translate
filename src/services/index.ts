import { expoStt } from './expoStt';
import { expoTts } from './expoTts';
import { mlkitTranslator } from './mlkitTranslator';
import { Services } from './types';

export const realServices: Services = {
  stt: expoStt,
  translator: mlkitTranslator,
  tts: expoTts,
};
