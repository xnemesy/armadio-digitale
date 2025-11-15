# Copilot Instructions: Armadio Digitale

React Native wardrobe management app with **hybrid AI** (on-device ExecuTorch + cloud Gemini 2.0 Flash) and Firebase backend.

## Architecture Overview

**Framework**: React Native 0.75.5 + Expo SDK 54 (dev client required for native modules)
**Backend**: Firebase (Firestore, Storage, Auth, Analytics)
**AI Strategy**: Local-first with confidence-based cloud fallback
- **On-device**: ExecuTorch + MobileNetV3 INT8 for fast category classification (confidence ≥70%)
- **Cloud**: Gemini 2.0 Flash Exp for detailed metadata (specific model names, brands, colorways)

### Critical Path: APP_ID Configuration

The `APP_ID` constant namespaces all Firebase paths. Single source of truth:
```javascript
// app.config.js → extra.APP_ID (from env or default 'armadio-digitale')
// src/config/appConfig.js reads Constants.expoConfig.extra.APP_ID
import { APP_ID } from '../config/appConfig';

// Firestore: artifacts/${APP_ID}/users/${uid}/items/${itemId}
// Storage: artifacts/${APP_ID}/users/${uid}/items/${itemId}.jpg
```

### Navigation Structure

Nested navigators in `src/navigation/`:
- `MainTabNavigator` → 5 tabs with `CustomTabBar` (floating camera button)
- `HomeStackNavigator` → HomeMain + Detail
- `OutfitAIStackNavigator` → OutfitBuilderMain
- `ProfileStackNavigator` → ProfileMain

Screen navigation: `navigation.navigate('Detail', { itemId })`

## Key Development Patterns

### 1. Hybrid AI Analysis Pipeline

**File**: `src/screens/AddItemScreen.js` (~line 75-130)

```javascript
async analyzeAndCheck(base64) {
  setScanning(true);
  setStatus('Analisi on-device in corso...');
  
  // Step 1: Try on-device classification
  const localResult = await classifyClothingFromUri(imageLocalUri);
  if (localResult?.confidence >= ML_CONFIG.confidenceThreshold) {
    setMetadata({ ...metadata, category: localResult.label });
    setStatus('Classificato localmente ✓');
  } else {
    // Step 2: Fallback to Gemini cloud
    setStatus('Analisi cloud in corso...');
    const geminiData = await analyzeImageWithGemini(base64);
    setMetadata(geminiData);
  }
  
  // Step 3: Check for duplicates and get recommendations
  await checkDuplicates(metadata.name);
  await fetchRecommendations(metadata);
}
```

**Key files**:
- `src/ml/executorchClient.js` - On-device inference with graceful fallback if module missing
- `src/lib/ai.js` - Gemini API wrapper with exponential backoff (5 retries for 429 errors)
- `src/ml/config.js` - Confidence threshold (default 0.7)

### 2. Design System: Dual Token Strategy

**Migration in progress**: Legacy `COLORS` (dark mode only) → modern `tokens` (light/dark)

```javascript
// Legacy (still used in existing screens)
import { COLORS } from '../theme/colors';
backgroundColor: COLORS.surface

// Modern (use for new code)
import { useThemeTokens } from '../design/tokens';
const t = useThemeTokens(); // Auto light/dark via useColorScheme
backgroundColor: t.colors.surface, padding: t.spacing.md
```

**Available tokens**: `colors`, `spacing` (xs/sm/md/lg/xl/xxl), `radii`, `typography`, `durations`, `elevation`, `shadow(level)`

### 3. Firebase Operations

Always use `APP_ID` for paths:
```javascript
import { APP_ID } from '../config/appConfig';
const itemsPath = `artifacts/${APP_ID}/users/${uid}/items`;
const itemRef = firestore().collection(itemsPath).doc(itemId);

// Storage uploads (src/screens/AddItemScreen.js ~line 180)
const storageRef = storage().ref(`${itemsPath}/${itemId}.jpg`);
await storageRef.putFile(localUri);
const downloadURL = await storageRef.getDownloadURL();
```

### 4. Authentication Context

**File**: `src/contexts/AuthContext.js`

Provides: `signIn`, `signUp`, `signOut`, `signInWithGoogle`, `signInWithApple`, `deleteAccount` (GDPR-compliant, deletes all user data)

```javascript
import { useAuth } from '../contexts/AuthContext';
const { user, isAuthenticated, signOut } = useAuth();
```

### 5. Reanimated Micro-interactions

**Component**: `src/components/PressableScale.js`

Scale animation on press with Reanimated 3:
```javascript
<PressableScale onPress={handlePress} activeScale={0.95}>
  <View>{/* your content */}</View>
</PressableScale>
```

Uses `withSpring` for smooth tactile feedback. Test-friendly (mocked in `__mocks__/react-native-reanimated.js`).

## Build & Development Workflow

### Setup Commands
```bash
npm install --legacy-peer-deps  # Required for peer dep conflicts
npx expo run:android             # Android dev client build
npm run ios:community            # iOS with community autolinking (EXPO_USE_COMMUNITY_AUTOLINKING=1)
```

### Dev Scripts
- `npm start` - Expo dev server
- `npm run start:clear` - Clear cache
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Prettier all files
- `npm test` - Run Jest tests
- `npm run relocate` - Move project safely (handles spaces in paths)

### EAS Build
```bash
eas build --profile production --platform android  # APK/AAB
eas build --profile preview --platform android     # Internal APK
```

**Important**: Dev client required (no Expo Go) due to native modules (`@react-native-firebase/*`, `react-native-executorch`)

## Testing

**Config**: `jest.config.cjs` with React Native Testing Library

```bash
npm test               # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
```

**Coverage targets**: 70% statements/functions/lines, 60% branches

**Key mocks**: `__mocks__/react-native.js`, `__mocks__/react-native-reanimated.js`, `__tests__/setup.js`

Test files: `src/lib/__tests__/ai.test.js` (18 tests), `src/components/__tests__/*.test.js`

## Common Pitfalls & Solutions

### 1. Path with Spaces
macOS build issues if project in path like "Android app". Use: `npm run relocate -- --dest ~/Projects/ArmadioDigitale`

### 2. Firebase Config Missing
Run `npm run restore:firebase` to regenerate `firebase/config.js` from env vars. Automatically runs in EAS build hook `eas-build-post-install`.

### 3. ExecuTorch Model Missing
Place `mobilenet_v3_clothes_int8.pte` in `assets/models/`. The client gracefully falls back to cloud if model/module unavailable.

### 4. Google Sign-In Not Working
Ensure `GOOGLE_WEB_CLIENT_ID` in `.env` and `app.config.js` → `extra.googleWebClientId`. Run `configureGoogleSignIn(webClientId)` on mount (see `AuthContext.js`).

### 5. ESLint Ignores Screens
`eslint.config.js` ignores `src/screens/**` during migration. Re-enable after cleanup.

## Code Organization Principles

1. **Barrel exports**: All folders have `index.js` for clean imports (`import { Header } from '../components'`)
2. **Modular navigation**: Each stack in separate file, composed in `MainTabNavigator`
3. **Screen extraction**: `App.js` reduced from 3295 → 80 lines by moving screens to `src/screens/`
4. **Context over props**: Auth and theme via React Context, not prop drilling
5. **Async graceful fallback**: ExecuTorch client uses dynamic imports with try/catch for optional native modules

## Environment Variables

**Required**: `EXPO_PUBLIC_FIREBASE_API_KEY` (web API key for client)

**Optional**: 
- `APP_ID` (default: 'armadio-digitale')
- `GOOGLE_WEB_CLIENT_ID` (for Google Sign-In)
- `SENTRY_DSN` (error tracking)

**Never in client**: Gemini API key (managed via Google Secret Manager, accessed only by Cloud Functions)

## Cloud Functions

**Endpoints** (europe-west1-armadiodigitale.cloudfunctions.net):
- `/analyzeImage` - Fashion-expert prompt for detailed metadata (public)
- `/generateOutfit` - AI stylist suggestions (requires Firebase Auth token)
- `/getShoppingRecommendations` - Similar item search (public)

**Authentication**: `generateOutfit` requires `Authorization: Bearer <ID_TOKEN>`. Client auto-includes from `auth().currentUser.getIdToken()`.

**Retry logic**: 5 attempts with exponential backoff for 429 errors (see `src/lib/ai.js`)

---

**Documentation**: See `docs/ARCHITECTURE.md` for full folder structure, `GEMINI.md` for AI context, `README.md` for setup guide.
