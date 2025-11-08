# Architettura Armadio Digitale

## 📁 Struttura Cartelle

```
ArmadioDigitale/
├── App.js                      # Entry point (80 righe): splash, auth mock, NavigationContainer
├── app.config.js               # Expo config: bundle IDs, Firebase, APP_ID in extra field
├── src/
│   ├── config/
│   │   └── appConfig.js        # APP_ID single source of truth (da Constants.expoConfig.extra)
│   ├── navigation/             # ✨ Navigatori modulari (5 file)
│   │   ├── index.js            # Barrel export
│   │   ├── CustomTabBar.js     # Tab bar con floating camera button (276 righe)
│   │   ├── MainTabNavigator.js # Root tab navigator (5 tabs)
│   │   ├── HomeStackNavigator.js      # Stack: HomeMain + Detail
│   │   ├── OutfitAIStackNavigator.js  # Stack: OutfitBuilderMain
│   │   └── ProfileStackNavigator.js   # Stack: ProfileMain
│   ├── screens/                # 7 screen estratti da App.js
│   │   ├── index.js            # Barrel export
│   │   ├── HomeScreen.js       # Lista wardrobe + filtri (testo, categoria, colore, brand)
│   │   ├── DetailScreen.js     # View/edit/delete singolo item
│   │   ├── AddItemScreen.js    # Camera + AI analysis + Firebase upload
│   │   ├── OutfitBuilderScreen.js  # AI outfit suggestions
│   │   ├── ProfileScreen.js    # User profile + stats + settings
│   │   ├── StatsScreen.js      # Analytics dettagliate (categoria, colore, brand, size)
│   │   └── AuthScreen.js       # Login/register (attualmente mock)
│   ├── components/             # UI components riusabili
│   │   ├── index.js            # Barrel export
│   │   ├── Header.js           # Header con back button
│   │   ├── ItemCard.js         # Card item wardrobe (usato in HomeScreen)
│   │   ├── ItemForm.js         # Form per item (usato in AddItemScreen, DetailScreen)
│   │   └── LoadingOverlay.js   # Skeleton shimmer loader
│   ├── lib/
│   │   └── ai.js               # Centralizzazione AI utilities (3 funzioni Gemini)
│   ├── theme/
│   │   └── colors.js           # Palette COLORS (dark "The Athletic" style)
│   └── design/
│       └── tokens.js           # Design tokens completi (spacing, typography, elevation)
│                               # + COLORS adapter per retrocompatibilità
├── firebase/
│   └── config.js               # Firebase config (autogenerato da script restore)
└── scripts/
    ├── check_firebase.js       # Verifica configurazione Firebase
    └── relocate-project.js     # Script per spostare progetto (gestione spazi path)
```

---

## 🧭 Navigation Flow

### Struttura Navigazione

```
NavigationContainer
└── MainTabNavigator (5 tabs con CustomTabBar)
    ├── HomeTab → HomeStackNavigator
    │   ├── HomeMain (lista items)
    │   └── Detail (view/edit/delete)
    ├── OutfitAITab → OutfitAIStackNavigator
    │   └── OutfitBuilderMain (AI suggestions)
    ├── AddItem (direct screen, floating button)
    ├── StatsTab (direct screen)
    └── ProfileTab → ProfileStackNavigator
        └── ProfileMain (user + settings)
```

### CustomTabBar Caratteristiche

- **Floating Camera Button**: Pulsante centrale rialzato (72x72px) per AddItem
- **Design "The Athletic"**: Dark minimal, bordi sottili, shadow/elevation
- **Haptic Feedback**: Vibrazione tattile su press (expo-haptics)
- **Lucide Icons**: Home, Zap, Camera, BarChart3, User
- **Layout**: 2 tab left + spacer 80px + 2 tab right

### Screen Navigation

- **Home → Detail**: `navigation.navigate('Detail', { itemId })`
- **Any → AddItem**: Tab press su floating button
- **Profile → Auth**: Logout navigation (quando auth sarà attivo)

---

## 🔥 Data Flow (Firebase)

### APP_ID Configuration

```javascript
// app.config.js
export default {
  extra: {
    APP_ID: process.env.APP_ID || 'armadio-digitale'
  }
}

// src/config/appConfig.js (single source of truth)
import Constants from 'expo-constants';
export const APP_ID = Constants.expoConfig?.extra?.APP_ID || 'armadio-digitale';

// Usage in screens
import { APP_ID } from '../config/appConfig';
```

### Firestore Paths

```
artifacts/${APP_ID}/users/${uid}/items/${itemId}
  - name: string
  - category: string
  - brand: string
  - color: string
  - size: string
  - imageUrl: string (Storage URL)
  - createdAt: timestamp
  - metadata: object (AI analysis)
```

### Firebase Storage Paths

```
artifacts/${APP_ID}/users/${uid}/items/${itemId}.jpg
```

### AI Services (Gemini 2.5-flash via Cloud Functions)

**File**: `src/lib/ai.js`

1. **analyzeImageWithGemini(base64Image)**
   - Endpoint: `europe-west1-armadiodigitale.cloudfunctions.net/analyzeImage`
   - Retry: 5 tentativi con exponential backoff (429 handling)
   - Output: `{ name, category, brand, color, size, description }`

2. **getShoppingRecommendations(itemId, metadata)**
   - Endpoint: `.../getShoppingRecommendations`
   - Retry: 3 tentativi
   - Output: `[{ title, price, url, image }]` o `[]` fallback

3. **getOutfitSuggestion(wardrobeItems)**
   - Endpoint: `.../getOutfitSuggestion`
   - Retry: 5 tentativi
   - Prompt: Fashion stylist con wardrobe user
   - Output: `{ suggestion: string, items: [itemIds] }`

---

## 🎨 Design System

### Approccio Dual (Migrazione in Corso)

**1. Legacy: `src/theme/colors.js`**
```javascript
import { COLORS } from '../theme/colors';
// Uso: backgroundColor: COLORS.background
```

**2. Moderno: `src/design/tokens.js`**
```javascript
import { useThemeTokens } from '../design/tokens';
const t = useThemeTokens();
// Uso: backgroundColor: t.colors.background, padding: t.spacing.md
```

### COLORS Adapter (Retrocompatibilità)

`src/design/tokens.js` ora esporta anche `COLORS` mappato su `darkColors`:

```javascript
export const COLORS = {
  background: darkColors.background,
  surface: darkColors.surface,
  primary: darkColors.accent,
  // ... resto mappatura
};
```

**Migrazione consigliata** (graduale):
- Nuovo codice → usa `useThemeTokens()` per accesso a spacing, typography, elevation
- Codice esistente → continua con `COLORS` finché non migrato
- Target finale: tutto su tokens, rimuovere `src/theme/colors.js`

### Token Categories

- **colors**: background, surface, accent, text (primary/secondary/muted), border, status
- **spacing**: xs(4), sm(8), md(12), lg(16), xl(24), xxl(32)
- **radii**: sm(6), md(8), lg(12), xl(16), pill(999)
- **typography.sizes**: xs(12), sm(14), md(16), lg(18), xl(22), xxl(28)
- **typography.weights**: regular(400), medium(600), bold(700)
- **durations**: fast(120), normal(200), slow(320)
- **elevation**: none(0), xs(1), sm(2), md(4), lg(8)
- **shadow(level)**: Helper iOS shadow con opacity/radius/offset

### Theme Switching

Default: **dark mode** ("The Athletic" aesthetic)
```javascript
const t = useThemeTokens(); // Legge useColorScheme(), default 'dark'
```

---

## 🔧 Development Tools

### ESLint + Prettier

**Config**:
- `.eslintrc.js`: React Native Community + React Hooks + Prettier integration
- `.prettierrc`: 2 spaces, single quotes, 120 line width, semicolons

**Scripts**:
```bash
npm run lint          # Check codice
npm run lint:fix      # Auto-fix issues
npm run format        # Format con Prettier
npm run format:check  # Verifica formatting
```

### Build Commands

```bash
npm run start              # Expo dev server
npm run start:clear        # Con cache clear
npm run ios:community      # iOS build con community autolinking
npm run relocate           # Sposta progetto (gestione spazi path)
npm run restore:firebase   # Ripristina firebase/config.js
```

---

## 🚀 Roadmap Features

### ✅ Completato (Fase Architettura + Cleanup)

1. ✅ Navigazione modulare (5 file in src/navigation/)
2. ✅ Screen extraction (7 screen in src/screens/)
3. ✅ APP_ID centralizzato (app.config.js → appConfig.js)
4. ✅ App.js ridotto da 3295 a 80 righe
5. ✅ Design tokens con COLORS adapter
6. ✅ ESLint + Prettier setup
7. ✅ Rimozione variabili legacy
8. ✅ Filtri HomeScreen (testo, categoria, colore, brand)

### 🔄 Prossimi Step (Fase UX + Docs)

1. 🔄 Debounce su filtro testo (lodash.debounce, 300ms)
2. 🔄 Persistenza filtri (AsyncStorage)
3. 🔄 Sorting dropdown (Data, Nome, Brand)
4. 🔄 Micro-interazioni (PressableScale con Reanimated)
5. 🔄 Documentazione completa (README update con APP_ID env var)

---

## 📝 Note Tecniche

### Autolinking iOS

Expo SDK 54 richiede `EXPO_USE_COMMUNITY_AUTOLINKING=1` per moduli nativi:
```bash
EXPO_USE_COMMUNITY_AUTOLINKING=1 npx expo run:ios
```

### Firebase Config Restore

`scripts/restore-firebase-config.js` autogenera `firebase/config.js` da env vars:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- etc.

Eseguito automaticamente in EAS build hook `eas-build-post-install`.

### Auth Mock

Auth Firebase attualmente **disabilitato** in `App.js`:
```javascript
setUser({ uid: 'test-user' }); // Mock user
```

Per abilitare auth reale: commentare mock, implementare `@react-native-firebase/auth`.

---

## 📚 Collegamenti Utili

- [Expo SDK 54 Docs](https://docs.expo.dev/versions/v54.0.0/)
- [React Navigation v6](https://reactnavigation.org/docs/getting-started)
- [React Native Firebase](https://rnfirebase.io/)
- [Lucide Icons](https://lucide.dev/)
- [Reanimated v3](https://docs.swmansion.com/react-native-reanimated/)
