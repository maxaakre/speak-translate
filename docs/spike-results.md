# Device spike results

Device: iPhone 16, iOS 26.x. Run `App.tsx` → spike screen. Download all four models, then turn on **airplane mode**.

| Lang | On-device STT works | Transcript quality | Translate offline | Voice speaks | Pause → spoken (s) |
|------|---------------------|--------------------|-------------------|--------------|--------------------|
| sv   | pending | pending | pending | pending | pending |
| pl   | pending | pending | pending | pending | pending |
| es   | pending | pending | pending | pending | pending |
| en   | pending | pending | pending | pending | pending |

**Verdict:** pending. Write "built-in STT OK for all → skip Task 7" or "Task 7 needed for: <langs>".

## Notes

- Expo SDK 58 needs **Xcode 26** (Swift tools 6.2). Xcode 16.3 fails at package resolution.
- `react-native-mlkit-translate-text` was dropped: last published 2023, pins ML Kit 2.5.0, legacy bridge. Replaced with the local Expo module `modules/mlkit-translate` (pod `OfflineTranslate`, depends on `GoogleMLKit/Translate`). `pod install` resolves MLKitTranslate 8.0.0.
- Pod was renamed from `MlkitTranslate` to `OfflineTranslate`: on a case-insensitive disk it collided with Google's `MLKitTranslate` pod.
