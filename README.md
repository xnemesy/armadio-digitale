# Armadio Digitale 👔

App mobile per gestire il proprio guardaroba digitale con analisi AI tramite Gemini.

## 🏗️ Architettura

- **Framework**: React Native 0.81.5 + Expo 54.0.0 (managed workflow con expo-dev-client)
- **Backend**: Firebase (Firestore, Storage, Auth)
- **AI**: Google Gemini 2.5-flash per analisi immagini
- **Build**: EAS Build per APK/AAB firmati

## 🔧 Setup Iniziale

### 1. Clona il repository
```bash
git clone https://github.com/xnemesy/armadio-digitale.git
cd armadio-digitale
```

### 2. Installa dipendenze
```bash
npm install --legacy-peer-deps
```

### 3. Configura variabili d'ambiente

Crea un file `.env` nella root del progetto:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key_here
```

Puoi usare `.env.example` come template.

### 4. Configura Firebase

Scarica i file di configurazione dalla Firebase Console:

**Android:**
- Vai su Firebase Console > Impostazioni Progetto > Le tue app
- Seleziona l'app Android
- Scarica `google-services.json`
- Posizionalo nella root del progetto

**iOS:**
- Vai su Firebase Console > Impostazioni Progetto > Le tue app
- Seleziona l'app iOS
- Scarica `GoogleService-Info.plist`
- Posizionalo nella root del progetto

Puoi usare i file `.example` come riferimento.

⚠️ **IMPORTANTE**: Assicurati che il `package_name` in `google-services.json` e il `bundleIdentifier` in `GoogleService-Info.plist` corrispondano a quelli in `app.config.js`:
- Android: `com.armadiodigitale.app`
- iOS: `com.armadiodigitale.app`

## 🚀 Avvio Development

### Con Expo Dev Client (consigliato con React Native Firebase)

```bash
# Android
npx expo run:android

# iOS (solo su Mac)
npx expo run:ios
```

### Con Expo Go (limitato, non supporta moduli nativi Firebase)
```bash
npx expo start
```

## 📦 Build Production

### Con EAS Build

```bash
# Build Android APK
eas build --profile production --platform android

# Build iOS (solo su Mac con account Apple Developer)
eas build --profile production --platform ios
```

## 📁 Struttura Progetto

```
armadio-digitale/
├── App.js                          # Componente principale
├── app.config.js                   # Configurazione Expo
├── .env                            # Variabili d'ambiente (gitignored)
├── google-services.json            # Config Firebase Android (gitignored)
├── GoogleService-Info.plist        # Config Firebase iOS (gitignored)
├── src/
│   ├── components/                 # Componenti UI riutilizzabili
│   ├── screens/                    # Schermate dell'app
│   └── config/                     # File di configurazione
├── assets/                         # Immagini, icone, splash screen
└── scripts/                        # Script di utilità
```

## 🔑 Gestione API Keys

Le chiavi API sono gestite tramite variabili d'ambiente per sicurezza:

1. **Mai committare** `.env`, `google-services.json`, `GoogleService-Info.plist`
2. Usa i file `.example` per documentare le chiavi necessarie
3. Per production, usa EAS Secrets:

```bash
eas secret:create --name EXPO_PUBLIC_GEMINI_API_KEY --value your_key
eas secret:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value your_key
```

## 🐛 Troubleshooting

### Errore: "Firebase not initialized"
Verifica che `google-services.json` (Android) e `GoogleService-Info.plist` (iOS) siano nella root del progetto.

### Errore: "Gemini API key missing"
Verifica che `.env` contenga `EXPO_PUBLIC_GEMINI_API_KEY` e che `expo-constants` lo carichi correttamente.

### Build fallisce con React Native Firebase
Assicurati di usare `expo-dev-client`:
```bash
npx expo install expo-dev-client
npx expo run:android
```

## 📝 Note Tecniche

- **React Native Firebase**: Richiede build nativi (non compatibile con Expo Go)
- **Upload immagini**: Usa `putFile(uri)` con React Native Firebase Storage
- **Gemini AI**: Analizza immagini per estrarre metadata (nome, categoria, colore, marca, taglia)
- **Duplicati**: Sistema automatico di rilevamento capi simili

## 📄 Licenza

MIT

