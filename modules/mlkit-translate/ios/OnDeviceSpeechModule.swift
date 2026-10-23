import ExpoModulesCore
import Speech

// expo-speech-recognition silently falls back to Apple's servers when a locale
// can't run on-device, so we check each locale ourselves.
public class OnDeviceSpeechModule: Module {
  public func definition() -> ModuleDefinition {
    Name("OnDeviceSpeech")

    Function("supportsOnDevice") { (locale: String) -> Bool in
      return SFSpeechRecognizer(locale: Locale(identifier: locale))?.supportsOnDeviceRecognition ?? false
    }
  }
}
