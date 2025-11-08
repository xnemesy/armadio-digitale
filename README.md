# Armadio Digitale 👔

App mobile per gestire il proprio guardaroba digitale con analisi AI tramite Gemini.

## ✨ Funzionalità

- 📸 **Scansione AI**: Analizza foto dei capi con Gemini 2.5-flash (categoria, brand, colore, taglia)
- 🔍 **Filtri Avanzati**: Ricerca per testo, categoria, colore, brand con debouncing
- 🗂️ **Ordinamento**: Ordina per data, nome o brand
- 💾 **Persistenza**: Filtri e sort salvati automaticamente tra sessioni
- � **Micro-interazioni**: Animazioni fluide con Reanimated 3
- 🔥 **Backend Firebase**: Firestore + Storage + Auth ready
- 📊 **Analytics**: Statistiche dettagliate del guardaroba

## �🏗️ Architettura

- **Framework**: React Native 0.81.5 + Expo SDK 54 (dev client)
- **Navigation**: React Navigation v6 (nested tabs + stacks)
- **Backend**: Firebase (Firestore, Storage, Auth)
- **AI**: Google Gemini 2.5-flash via Cloud Functions
- **State**: React Hooks + AsyncStorage per persistenza
- **Animations**: Reanimated 3 + PressableScale component
- **Design System**: Design tokens + COLORS palette (dark "The Athletic" style)
- **Code Quality**: ESLint + Prettier + community config

📖 **Documentazione completa**: Vedi [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) per dettagli su folder structure, navigation flow, data flow, e design system.

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
# Gemini API Key (per analisi AI immagini)
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Web API Key
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key_here

# APP_ID (opzionale, default: armadio-digitale)
APP_ID=armadio-digitale
```

**APP_ID**: Usato per namespace Firestore/Storage paths (`artifacts/${APP_ID}/users/${uid}/items`). Permette multi-tenancy o ambienti separati (dev/staging/prod).

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
npm run ios:community
```

Nota: il comando iOS usa `EXPO_USE_COMMUNITY_AUTOLINKING=1` per allineare l'autolinking al percorso che ha già funzionato durante il pod install. Se preferisci il comando nativo, usa `npx expo run:ios`, ma in caso di errore in `use_native_modules!` riprova con `npm run ios:community`.

### Con Expo Go (limitato, non supporta moduli nativi Firebase)
```bash
npx expo start
```

### Script Disponibili

```bash
npm run start           # Avvia Expo dev server
npm run start:clear     # Avvia con cache cleared
npm run lint            # Check codice con ESLint
npm run lint:fix        # Auto-fix issues ESLint
npm run format          # Format con Prettier
npm run format:check    # Verifica formatting
npm run relocate        # Sposta progetto (gestisce path con spazi)
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
./
├── App.js                          # Entry point (80 righe, bootstrap pulito)
├── app.config.js                   # Config Expo + APP_ID in extra field
├── eas.json                        # Profili EAS Build
├── package.json                    # Dipendenze + scripts lint/format
├── .env                            # Variabili d'ambiente (gitignored)
├── .eslintrc.js                    # Config ESLint + React Native community
├── .prettierrc                     # Config Prettier (2 spaces, single quotes)
├── google-services.json            # Config Firebase Android (gitignored)
├── GoogleService-Info.plist        # Config Firebase iOS (gitignored)
├── docs/
│   └── ARCHITECTURE.md             # 📖 Documentazione architettura completa
├── src/
│   ├── navigation/                 # Navigatori modulari (CustomTabBar, stacks)
│   │   ├── CustomTabBar.js         # Tab bar con floating camera button
│   │   ├── MainTabNavigator.js    # Root tab navigator (5 tabs)
│   │   ├── HomeStackNavigator.js  # Stack Home + Detail
│   │   ├── OutfitAIStackNavigator.js
│   │   ├── ProfileStackNavigator.js
│   │   └── index.js                # Barrel export
│   ├── screens/                    # Schermate app (7 screen estratti)
│   │   ├── HomeScreen.js           # Lista + filtri + sorting + debounce
│   │   ├── DetailScreen.js         # View/edit/delete item
│   │   ├── AddItemScreen.js        # Camera + AI analysis + upload
│   │   ├── OutfitBuilderScreen.js  # AI outfit suggestions
│   │   ├── ProfileScreen.js        # User profile + settings
│   │   ├── StatsScreen.js          # Analytics wardrobe
│   │   ├── AuthScreen.js           # Login/register (mock)
│   │   └── index.js                # Barrel export
│   ├── components/                 # UI components riutilizzabili
│   │   ├── Header.js
│   │   ├── ItemCard.js             # Card item con PressableScale
│   │   ├── ItemForm.js
│   │   ├── LoadingOverlay.js
│   │   ├── PressableScale.js       # 🆕 Animated pressable (Reanimated)
│   │   └── index.js                # Barrel export
│   ├── lib/
│   │   └── ai.js                   # 🆕 AI utilities (Gemini 3 funzioni)
│   ├── theme/
│   │   └── colors.js               # Palette COLORS (legacy, retrocompat)
│   ├── design/
│   │   └── tokens.js               # 🆕 Design tokens + COLORS adapter
│   └── config/
│       └── appConfig.js            # APP_ID single source of truth
├── assets/                         # Immagini, icone, splash screen
└── scripts/                        # Script utilità (relocate, firebase restore)
```

**Nota architetturale**: `App.js` ridotto da **3295 a 80 righe** (~97% meno codice) estraendo navigatori e screen in file dedicati. Vedi `docs/ARCHITECTURE.md` per dettagli.

## 🎨 Design System

### COLORS Palette (Dark "The Athletic" Style)

```javascript
import { COLORS } from './src/theme/colors';
// o import { COLORS } from './src/design/tokens'; (stesso export)
```

### Design Tokens (Moderno)

```javascript
import { useThemeTokens } from './src/design/tokens';

const MyComponent = () => {
  const t = useThemeTokens(); // Auto light/dark mode
  return (
    <View style={{ 
      backgroundColor: t.colors.surface,
      padding: t.spacing.md,
      borderRadius: t.radii.lg 
    }} />
  );
};
```

**Tokens disponibili**: `colors`, `spacing`, `radii`, `typography`, `durations`, `elevation`, `shadow(level)`

Vedi [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) → Design System per strategia migrazione.

## 🔑 Gestione API Keys

Le chiavi API sono gestite tramite variabili d'ambiente per sicurezza:

1. **Mai committare** `.env`, `google-services.json`, `GoogleService-Info.plist`
2. Usa i file `.example` per documentare le chiavi necessarie
3. Per production, usa EAS Secrets:

```bash
eas secret:create --name EXPO_PUBLIC_GEMINI_API_KEY --value your_key
eas secret:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value your_key
eas secret:create --name APP_ID --value armadio-digitale
```

**APP_ID** viene letto da:
1. Variabile env `APP_ID` (`.env` o EAS Secrets)
2. `app.config.js` → `extra.APP_ID`
3. `src/config/appConfig.js` → `Constants.expoConfig.extra.APP_ID`
4. Fallback: `'armadio-digitale'`

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

### Percorso con spazi ("Android app") causa errori di build
Su macOS alcuni step (CocoaPods/Xcode/shell) possono fallire se il progetto è in un percorso con spazi. Puoi spostare in modo sicuro il progetto con lo script di relocate:

```bash
# Esempio: sposta in ~/Projects/ArmadioDigitale
npm run relocate -- --dest "$HOME/Projects/ArmadioDigitale"

# oppure: usa la destinazione di default ($HOME/Projects/<nome-cartella>)
npm run relocate

# Opzionale: rimuove la cartella originale dopo la copia
npm run relocate -- --dest "$HOME/Projects/ArmadioDigitale" --remove-old
```

Note:
- Lo script copia anche la cartella `.git` per preservare la history e i remoti.
- Esclude cache/transient (Pods, build, .expo) che incorporano path assoluti.
- Dopo lo spostamento, esegui:
	- `npm install --legacy-peer-deps`
	- `npx pod-install` (o `cd ios && pod install`)
	- `npx expo run:ios` / `npx expo run:android`

### ESLint/Prettier Errors

Se vedi errori di linting dopo il setup:
```bash
npm run lint:fix    # Auto-fix la maggior parte degli errori
npm run format      # Format tutto il codice
```

## 📝 Note Tecniche

- **React Native Firebase**: Richiede build nativi (non compatibile con Expo Go)
- **Upload immagini**: Usa `putFile(uri)` con React Native Firebase Storage
- **Gemini AI**: Analizza immagini per estrarre metadata via Cloud Functions (`analyzeImageWithGemini`)
- **Duplicati**: Sistema automatico di rilevamento capi simili in `AddItemScreen`
- **Debounced Search**: Ricerca con delay 300ms per ridurre re-render (lodash.debounce)
- **Filter Persistence**: Filtri e sorting salvati in AsyncStorage (`@armadio_filters`, `@armadio_sort`)
- **Micro-interactions**: `PressableScale` component con Reanimated `withSpring` per feedback tattile
- **Navigation**: Nested structure (MainTabNavigator → HomeStack/OutfitStack/ProfileStack)

## 📚 Risorse

- [Documentazione Architettura](docs/ARCHITECTURE.md) - Guida completa struttura progetto
- [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/)
- [React Navigation v6](https://reactnavigation.org/)
- [React Native Firebase](https://rnfirebase.io/)
- [Reanimated v3](https://docs.swmansion.com/react-native-reanimated/)
- [Lucide Icons](https://lucide.dev/)

## 📄 Licenza

MIT

