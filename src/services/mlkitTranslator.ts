import MlkitTranslate from '../../modules/mlkit-translate';
import { Translator } from './types';

export const mlkitTranslator: Translator = {
  isReady: (lang) => MlkitTranslate.isModelDownloaded(lang),
  download: (lang) => MlkitTranslate.downloadModel(lang),
  translate: (text, from, to) => MlkitTranslate.translate(text, from, to),
};
