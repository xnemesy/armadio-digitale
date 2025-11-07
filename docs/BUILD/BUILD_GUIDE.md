# Armadio Digitale – Build & Deployment Guide

## Obiettivo
Questa guida ti permette di:
1. Fare build locali (Android e iOS simulator) per debug rapido.
2. Eseguire build EAS (Android APK/AAB e iOS Ad Hoc / Production).
3. Gestire Firebase e variabili d'ambiente senza includere segreti nel repo.
4. Risolvere errori comuni (Pods, gRPC, GoogleService-Info.plist, dimensione archivio).

---
## Struttura Rilevante
- `app.config.js`: Config Expo (bundleIdentifier, googleServicesFile, extra vars)
- `android/` & `ios/`: Codice native (generati / mantenuti, necessari per build iOS bare)
- `google-services.json` / `GoogleService-Info.plist`: Config Firebase (non rimuovere finché non migrati su secrets)
- `.easignore`: Riduce dimensione upload EAS
- `.gitignore`: Evita di tracciare file sensibili / superflui

---
## 1. Variabili d'Ambiente
Il progetto usa `dotenv` + `app.config.js`.

### File `.env` (esempio)
```
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_key
GOOGLE_SERVICE_INFO_PLIST=./GoogleService-Info.plist
```

### Impostare secrets su EAS (consigliato)
Per spostare i file Firebase fuori dal repo:
1. Base64 dei file:
   ```bash
   base64 GoogleService-Info.plist > ios_plist.b64
   base64 google-services.json > android_google.b64
   ```
2. Crea secrets:
   ```bash
   eas secret:create --name IOS_PLIST_B64 --value "$(cat ios_plist.b64)" --type build
   eas secret:create --name ANDROID_GOOGLE_JSON_B64 --value "$(cat android_google.b64)" --type build
   ```
3. Aggiungi script di pre-build (facoltativo) per rigenerarli:
   ```bash
   echo $IOS_PLIST_B64 | base64 --decode > GoogleService-Info.plist
   echo $ANDROID_GOOGLE_JSON_B64 | base64 --decode > google-services.json
   ```
4. Verifica che `app.config.js` punti ai percorsi corretti.

---
## 2. Build Locale Android
Prerequisiti: JDK + Android SDK + dispositivo / emulatore.

### Debug APK
```bash
cd android
./gradlew :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Metro + App in sviluppo
```bash
npx expo start --clear
# Apri Expo Go oppure usa dev client se buildato
```

---
## 3. Build Locale iOS (Simulator)
Prerequisiti: Xcode installato.

Se usi Expo prebuild (già presente `ios/`):
```bash
npx expo start
# Apri iOS simulator dall'interfaccia Expo (press i)
```

Per buildare il workspace nativo:
```bash
cd ios
xed .
# In Xcode seleziona target + run (⌘R)
```

Se dipendenze Pods mancanti:
```bash
cd ios
pod install --repo-update
```

---
## 4. EAS Build (Android & iOS)
Assicurati di essere loggato:
```bash
eas login
```

### Profili (eas.json)
- `development`: iOS Ad Hoc + Android debug
- `preview`: Android APK interno
- `production`: Release (AAB / IPA – quando configurata)

### iOS Development (Ad Hoc)
```bash
eas build --platform ios --profile development --non-interactive --clear-cache
```
Output: link con `.ipa` installabile su dispositivi registrati (Provisioning Profile).

### Android APK Internal
```bash
eas build --platform android --profile preview --non-interactive --clear-cache
```

### Suggerimenti archivio EAS
Se l'upload supera ~200MB:
- Controlla `.easignore` (node_modules NON incluso; va bene così)
- Escludi frontend docs (`docs/`), build nativi (`ios/build`, `android/app/build`), Pods.

---
## 5. Aggiornamento Versioni
Automatico per `production` (autoIncrement). Manuale per dev:
```bash
# iOS (info.plist) e Android (versionCode) tramite expo-version plugin (opzionale)
```

Per ora: modificare `version` in `app.config.js` se necessario.

---
## 6. Troubleshooting

### Errore: `GoogleService-Info.plist is missing`
Cause: file ignorato da .gitignore o path errato.
Soluzione: assicurati di averlo nel root o usa `ios.googleServicesFile` in `app.config.js`.

### Errore: gRPC / `gRPC-Core.modulemap not found`
Cause: Pods corrotti / cache sporca.
Soluzioni:
```bash
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
```
Oppure aggiungi pulizia nel CI prima della build.

### Build iOS si interrompe su credenziali
Usa `--non-interactive` se le credenziali già configurate. Se no:
```bash
eas credentials
```

### Upload EAS enorme (>1GB)
- Verifica che `ios/Pods/` sia escluso.
- Evita di includere APK/AAB precedenti.
- Sposta documentazione in `docs/`.

### Metro bundler blocca su errori di modulo
Pulizia cache:
```bash
rm -rf node_modules .expo .expo-shared
npm install
npx expo start --clear
```

### Firebase non si inizializza
Controlla `firebase/config.js` e le chiavi in `.env` / secrets EAS.

---
## 7. Script Utili
Aggiungi eventualmente in `package.json`:
```json
"scripts": {
  "dev": "expo start",
  "android:debug": "cd android && ./gradlew :app:assembleDebug",
  "ios:pods": "cd ios && pod install --repo-update",
  "eas:ios:dev": "eas build --platform ios --profile development --non-interactive --clear-cache",
  "eas:android:preview": "eas build --platform android --profile preview --non-interactive --clear-cache"
}
```

---
## 8. Check Finale Prima di Una Release
Checklist rapida:
- [ ] Versione aggiornata in `app.config.js`
- [ ] Nessun file di segreti tracciato (solo `.example` ok)
- [ ] Build EAS dev OK su iOS/Android
- [ ] Crash-free avvio (test rapido su device reale)
- [ ] Dimensione upload < 150MB (iOS) / < 200MB (Android)

---
## 9. Prossimi Miglioramenti (Suggeriti)
- Migrare Firebase config su EAS secrets
- Aggiungere test CI (lint + typecheck + build dry-run)
- Integrare Sentry/Crashlytics (già predisposto con Firebase)
- Plugin versionamento automatico (expo-version)

---
## 10. Contatti / Ownership
Team: Rocco (Apple Team ID: ZLART575Y4)
Project ID EAS: e5ea0f61-c4df-4132-af5b-afe5993d7b33

---
Fine guida. Mantieni questa cartella fuori dalla build (già esclusa in `.easignore`).
