# Armadio Digitale 👔

App mobile per gestire il proprio guardaroba digitale con analisi AI tramite Gemini.

## ✨ Funzionalità

- 📸 **Scansione AI Avanzata**: Analisi ibrida on-device + cloud
  - **On-Device (ExecuTorch)**: Classificazione categoria in locale con MobileNetV3 INT8 (~3-6MB)
  - **Cloud (Gemini 2.0 Flash Exp)**: Metadati dettagliati quando confidenza locale < 70%
  - **Nome**: Modello specifico + colorway (es: "Air Jordan 4 Retro Bred Reimagined")
  - **Brand**: Marca + sotto-marca (es: "Nike Jordan", "Adidas Originals")
  - **Colore**: Sfumature precise (es: "Nero Lucido/Rosso" invece di solo "Nero")
  - **Categoria**: Sottocategorie specifiche (es: "Scarpe Sportive/Sneakers")
- 🔍 **Filtri Avanzati**: Ricerca per testo, categoria, colore, brand con debouncing
- 🗂️ **Ordinamento**: Ordina per data, nome o brand
- 💾 **Persistenza**: Filtri e sort salvati automaticamente tra sessioni
- ✨ **Micro-interazioni**: Animazioni fluide con Reanimated 3
- 🔥 **Backend Firebase**: Firestore + Storage + Auth ready
- 📊 **Analytics**: Statistiche dettagliate del guardaroba

## 🏗️ Architettura

- **Framework**: React Native 0.81.5 + Expo SDK 54 (dev client)
- **Navigation**: React Navigation v6 (nested tabs + stacks)
- **Backend**: Firebase (Firestore, Storage, Auth)
- **AI Ibrida**: 
  - **On-Device**: ExecuTorch + MobileNetV3 INT8 per categoria locale (bassa latenza, privacy, offline)
  - **Cloud**: Gemini 2.0 Flash Exp via Cloud Functions con prompt fashion-expert (nomi/brand precisi)
  - **Strategia**: Local-first con fallback intelligente basato su confidence threshold (70%)
- **State**: React Hooks + AsyncStorage per persistenza
- **Animations**: Reanimated 3 + PressableScale component
- **Design System**: Design tokens + ThemeContext per dark/light mode
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

Crea un file `.env` nella root del progetto (minimo necessario per il client):

```env
# Firebase Web API Key (client)
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key_here

# APP_ID (opzionale, default: armadio-digitale)
APP_ID=armadio-digitale
```

Nota: la chiave Gemini NON è più necessaria sul client. È gestita lato server tramite Secret Manager.

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
npm run purge           # Deep clean (git clean -fdx) + reinstall deps
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
│   ├── ml/                         # 🆕 ExecuTorch on-device ML (POC)
│   │   ├── executorchClient.js     # Client con dynamic import + fallback
│   │   ├── config.js               # Threshold, normalizzazione, model path
│   │   └── labels.js               # 15 classi abbigliamento
│   ├── lib/
│   │   └── ai.js                   # 🆕 AI utilities (Gemini 3 funzioni)
│   ├── contexts/                   # 🆕 React Context providers
│   │   ├── AuthContext.js          # Firebase Auth state
│   │   └── ThemeContext.js         # Dark/light mode switching
│   ├── theme/
│   │   └── colors.js               # Palette COLORS (legacy, retrocompat)
│   ├── design/
│   │   └── tokens.js               # 🆕 Design tokens + COLORS adapter
│   └── config/
│       └── appConfig.js            # APP_ID single source of truth
├── assets/                         # Immagini, icone, splash screen
│   └── models/                     # 🆕 Modelli ML (.pte files)
│       └── README.txt              # Istruzioni posizionamento modello
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

- **Mai committare** `.env`, `google-services.json`, `GoogleService-Info.plist`.
- Usa i file `.example` per documentare le chiavi necessarie.
- Client: richiede solo `EXPO_PUBLIC_FIREBASE_API_KEY` (e opzionalmente `APP_ID`).
- Gemini: gestita lato server con **Google Secret Manager** (nessuna chiave nel bundle).

Aggiornare la chiave Gemini su Secret Manager (CLI):

```pwsh
$env:CLOUDSDK_CORE_PROJECT="armadiodigitale"
$TMP = New-TemporaryFile
Set-Content -Path $TMP -NoNewline -Value "<nuova_chiave_gemini>"
gcloud secrets versions add gemini-api-key --data-file=$TMP
Remove-Item $TMP
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
La chiave è lato server. Verifica che il secret `gemini-api-key` esista e che le Cloud Functions siano state deployate correttamente.
```pwsh
gcloud secrets describe gemini-api-key --project armadiodigitale
gcloud functions describe generateOutfit --region europe-west1 --project armadiodigitale
```

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

## 🧪 Testing

Il progetto include test automatizzati con Jest e React Native Testing Library.

### Eseguire i test

```bash
# Esegui tutti i test
npm test

# Esegui i test in modalità watch (ricompila automaticamente)
npm run test:watch

# Esegui i test con report di coverage
npm run test:coverage
```

### Test Coverage

Il progetto include test per:
- **AI Integration** (`src/lib/__tests__/ai.test.js`): 18 test per analisi immagini, retry logic, shopping recommendations, outfit suggestions
- **Components** (`src/components/__tests__/`): Test per PressableScale, ItemCard (rendering, props, onPress, styling)

Target coverage:
- Statements: 70%
- Branches: 60%
- Functions: 70%
- Lines: 70%

**Note**: I test dei componenti React Native richiedono mock complessi. Attualmente funzionano 16/18 test (88% success rate).

## 📝 Note Tecniche

- **React Native Firebase**: Richiede build nativi (non compatibile con Expo Go)
- **ExecuTorch ML (POC)**: 
  - Inference on-device con MobileNetV3 INT8 quantizzato (~3-6MB)
  - 15 classi base: tshirt, shirt, sweatshirt, jacket, coat, pants, jeans, shorts, skirt, dress, shoes, sneakers, bag, hat, accessory
  - Soglia confidenza: 70% (configurabile in `src/ml/config.js`)
  - Fallback a Gemini quando confidenza < threshold
  - Richiede Dev Client build (non funziona su Expo Go)
  - **Setup**: Posiziona il modello `.pte` in `assets/models/mobilenet_v3_clothes_int8.pte` e rebuild
- **Upload immagini**: Usa `putFile(uri)` con React Native Firebase Storage
- **Gemini AI Cloud Function**: 
  - Modello: **Gemini 2.0 Flash Exp** con prompt ottimizzato per moda/fashion
  - Prompt specializzato per estrarre modelli specifici (es: "Air Jordan 4 Retro Bred Reimagined")
  - Identifica sotto-marche (es: "Nike Jordan" invece di solo "Nike")
  - Riconosce colorway e sfumature precise (es: "Nero Lucido/Rosso")
  - Caching Firestore (7 giorni) + rate limiting (10 req/min per IP)
  - Endpoints:
    - `europe-west1-armadiodigitale.cloudfunctions.net/analyzeImage`
    - `europe-west1-armadiodigitale.cloudfunctions.net/generateOutfit` (richiede ID token Firebase)

### Sicurezza endpoint AI

- `generateOutfit` richiede autenticazione: invia `Authorization: Bearer <ID_TOKEN>` (Firebase Auth).
- Il client la include automaticamente da `src/lib/ai.js` se l’utente è loggato.
- **Duplicati**: Sistema automatico di rilevamento capi simili in `AddItemScreen`
- **Debounced Search**: Ricerca con delay 300ms per ridurre re-render (lodash.debounce)
- **Filter Persistence**: Filtri e sorting salvati in AsyncStorage (`@armadio_filters`, `@armadio_sort`)
- **Micro-interactions**: `PressableScale` component con Reanimated `withSpring` per feedback tattile
- **Navigation**: Nested structure (MainTabNavigator → HomeStack/OutfitStack/ProfileStack)
- **Theme Switching**: ThemeContext con dark/light/auto mode, tokens dinamici applicati globalmente

## 📚 Risorse

- [Documentazione Architettura](docs/ARCHITECTURE.md) - Guida completa struttura progetto
- [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/)
- [React Navigation v6](https://reactnavigation.org/)
- [React Native Firebase](https://rnfirebase.io/)
- [Reanimated v3](https://docs.swmansion.com/react-native-reanimated/)
- [Lucide Icons](https://lucide.dev/)
- [ExecuTorch](https://pytorch.org/executorch/) - PyTorch on-device runtime
- [React Native ExecuTorch](https://github.com/pytorch/executorch/tree/main/examples/demo-apps/react-native) - RN bindings

## 🤖 ML Setup (ExecuTorch POC)

### Prerequisiti
1. **Modello PyTorch**: MobileNetV3-Small fine-tuned su 10-15 classi di abbigliamento
2. **Quantizzazione**: INT8 post-training quantization per ridurre dimensioni (~3-6MB)
3. **Export**: Convertire il modello in formato `.pte` con ExecuTorch

### Passaggi Setup

**1. Posiziona il modello**
```bash
# Copia il modello .pte nella cartella assets
cp mobilenet_v3_clothes_int8.pte assets/models/
```

**2. Rebuild Dev Client** (necessario per react-native-executorch)
```bash
# Android
npx expo prebuild
npx expo run:android

# iOS (solo Mac)
npx expo prebuild  
npx expo run:ios
```

**3. Verifica funzionamento**
- Apri app → "Aggiungi Nuovo Capo"
- Scatta/scegli una foto
- Dovresti vedere "Analisi on-device in corso..."
- Se confidenza >= 70%: categoria settata localmente
- Se confidenza < 70%: fallback automatico a Gemini

### Configurazione

Modifica soglia e parametri in `src/ml/config.js`:
```javascript
export const ML_CONFIG = {
  confidenceThreshold: 0.7,  // Soglia per accettare predizione locale
  inputSize: 224,            // Input size modello
  normalization: {           // Normalizzazione ImageNet
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225],
  },
};
```

### Export Modello (PyTorch → ExecuTorch)

Se hai bisogno di creare il modello `.pte`, ecco uno script base:

```python
import torch
from torchvision.models import mobilenet_v3_small
from torch.ao.quantization import quantize_dynamic
from executorch.exir import to_edge

# 1. Carica modello pre-trained
model = mobilenet_v3_small(pretrained=True)
model.eval()

# 2. Fine-tune su tue 15 classi (training custom)
# ... (tuo codice di training)

# 3. Quantizzazione INT8
model_int8 = quantize_dynamic(model, {torch.nn.Linear}, dtype=torch.qint8)

# 4. Export ExecuTorch
example_input = (torch.randn(1, 3, 224, 224),)
edge_program = to_edge(torch.export.export(model_int8, example_input))
executorch_program = edge_program.to_executorch()

# 5. Salva .pte
with open("mobilenet_v3_clothes_int8.pte", "wb") as f:
    f.write(executorch_program.buffer)
```

Vedi [ExecuTorch Tutorials](https://pytorch.org/executorch/stable/tutorials.html) per dettagli.

## 📄 Licenza

MIT

