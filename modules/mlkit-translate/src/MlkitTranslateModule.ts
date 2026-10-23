import { NativeModule, requireNativeModule } from 'expo';

declare class MlkitTranslateModule extends NativeModule<{}> {
  isModelDownloaded(code: string): Promise<boolean>;
  downloadModel(code: string): Promise<void>;
  translate(text: string, from: string, to: string): Promise<string>;
}

export default requireNativeModule<MlkitTranslateModule>('MlkitTranslate');
