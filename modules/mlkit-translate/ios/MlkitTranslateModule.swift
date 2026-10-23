import ExpoModulesCore
import MLKitTranslate

public class MlkitTranslateModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MlkitTranslate")

    AsyncFunction("isModelDownloaded") { (code: String) -> Bool in
      let model = TranslateRemoteModel.translateRemoteModel(language: TranslateLanguage(rawValue: code))
      return ModelManager.modelManager().isModelDownloaded(model)
    }

    // Downloading an English <-> lang translator pulls both models (English is the pivot).
    AsyncFunction("downloadModel") { (code: String, promise: Promise) in
      let target = code == "en" ? TranslateLanguage.spanish : TranslateLanguage(rawValue: code)
      let translator = Translator.translator(
        options: TranslatorOptions(sourceLanguage: .english, targetLanguage: target))
      let conditions = ModelDownloadConditions(allowsCellularAccess: true, allowsBackgroundDownloading: true)
      translator.downloadModelIfNeeded(with: conditions) { error in
        _ = translator  // Keep the translator alive until ML Kit calls back.
        if let error = error {
          promise.reject("ERR_DOWNLOAD", error.localizedDescription)
        } else {
          promise.resolve(nil)
        }
      }
    }

    AsyncFunction("translate") { (text: String, from: String, to: String, promise: Promise) in
      let translator = Translator.translator(
        options: TranslatorOptions(
          sourceLanguage: TranslateLanguage(rawValue: from),
          targetLanguage: TranslateLanguage(rawValue: to)))
      translator.translate(text) { result, error in
        _ = translator  // Keep the translator alive until ML Kit calls back.
        if let result = result {
          promise.resolve(result)
        } else {
          promise.reject("ERR_TRANSLATE", error?.localizedDescription ?? "Translation failed")
        }
      }
    }
  }
}
