import { NativeModule, requireNativeModule } from 'expo';

declare class OnDeviceSpeechModule extends NativeModule<{}> {
  supportsOnDevice(locale: string): boolean;
}

export default requireNativeModule<OnDeviceSpeechModule>('OnDeviceSpeech');
