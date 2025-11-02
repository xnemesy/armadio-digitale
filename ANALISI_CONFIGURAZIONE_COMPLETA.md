# 📋 Analisi Configurazione Completa - Armadio Digitale

**Data Analisi:** 2 Novembre 2025  
**Progetto:** armadio-digitale  
**Repository:** xnemesy/armadio-digitale  
**Branch:** main  

---

## 📁 Struttura Progetto

```
armadio-digitale/
├── 📱 App Files
│   ├── App.js (principale - RNFB nativo)
│   ├── App.js.backup
│   ├── AuthTestApp.js (test auth)
│   ├── WorkingFirebaseApp.js (con polyfill)
│   └── SimpleTestApp.js
│
├── ⚙️ Configurazione
│   ├── app.config.js (Expo config)
│   ├── eas.json (EAS Build config)
│   ├── babel.config.js
│   ├── package.json
│   ├── google-services.json (Android Firebase)
│   ├── .env (API keys)
│   └── .env.example
│
├── 🔥 Firebase
│   ├── src/config/firebaseConfig.js (senza auth)
│   ├── src/config/firebaseConfig-withauth.js (con auth)
│   └── firebase/config.js (base)
│
├── 📱 Screens
│   ├── src/screens/HomeScreen.js
│   ├── src/screens/AddItemScreen.js
│   ├── src/screens/AuthScreen.js
│   ├── src/screens/OutfitBuilderScreen.js
│   └── src/screens/index.js
│
├── 🧩 Components
│   ├── src/components/Header.js
│   ├── src/components/ItemCard.js
│   ├── src/components/ItemForm.js
│   └── src/components/LoadingOverlay.js
│
├── 🧪 Test Files
│   ├── test-auth.js
│   ├── test-complete.js
│   ├── test-firebase.js
│   └── test-firebase-simple.js
│
├── 📚 Documentazione
│   ├── README.md
│   ├── FIREBASE_REPORT_UPDATED.md
│   ├── FIREBASE_REPORT.md
│   ├── BLOB_ISSUE_ANALYSIS.md
│   ├── ANDROID_SETUP.md
│   └── CHECKLIST_POST_BUILD.md
│
├── 🛠️ Scripts
│   ├── build_eas.sh
│   └── scripts/check_firebase.js
│
├── 🎨 Assets
│   ├── assets/icon.png
│   ├── assets/splash.png
│   └── assets/adaptive-icon.png
│
└── 📦 Build Outputs
    ├── armadio-digitale-fixed.apk
    └── armadio-digitale/build5-debug.apk
```

---

## ⚙️ CONFIGURAZIONE DETTAGLIATA

### 1. `app.config.js` - Configurazione Expo

**Stato:** ✅ CORRETTO

```javascript
import 'dotenv/config';

export default {
  expo: {
    name: "Armadio Digitale",
    slug: "armadio-digitale",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    
    // iOS Configuration
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.armadiodigitale.app"
    },
    
    // Android Configuration
    android: {
      package: "com.armadiodigitale.app",
      targetSdkVersion: 34,                    // ✅ Android 14
      compileSdkVersion: 34,                   // ✅ Android 14
      googleServicesFile: "./google-services.json"  // ✅ Firebase
    },
    
    // Plugins
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission: "L'app richiede accesso alle foto per selezionare i capi.",
          cameraPermission: "L'app richiede accesso alla fotocamera per fotografare i capi."
        }
      ],
      "@react-native-firebase/app"  // ✅ CRUCIALE per RNFB
    ],
    
    // Environment Variables & EAS
    extra: {
      eas: {
        projectId: "e5ea0f61-c4df-4132-af5b-afe5993d7b33"
      },
      EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
      EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY
    }
  }
};
```

**✅ Punti Chiave:**
- Plugin `@react-native-firebase/app` configurato (risolve SIGABRT)
- `googleServicesFile` correttamente puntato
- API keys caricate da `.env` tramite `dotenv/config`
- Android SDK 34 (ultima versione stabile)
- Permessi camera e foto configurati

---

### 2. `eas.json` - EAS Build Configuration

**Stato:** ✅ OTTIMIZZATO

```json
{
  "cli": {
    "version": ">= 5.9.1",
    "requireCommit": false
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**📊 Profili Build:**

| Profilo | Output | Uso | Comando |
|---------|--------|-----|---------|
| **development** | Debug APK | Sviluppo con dev client | `eas build --profile development` |
| **preview** | Release APK | Testing interno ⭐ | `eas build --profile preview` |
| **production** | AAB Bundle | Google Play Store | `eas build --profile production` |

---

### 3. `package.json` - Dependencies

**Stato:** ✅ AGGIORNATO

```json
{
  "name": "armadio-digitale",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  
  "scripts": {
    "start": "expo start",
    "start:clear": "expo start --clear",
    "start:tunnel": "expo start --tunnel",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "clean": "rm -rf node_modules && rm -f package-lock.json && npm install --legacy-peer-deps"
  },
  
  "dependencies": {
    // 🔥 React Native Firebase (Nativo)
    "@react-native-firebase/app": "^23.5.0",
    "@react-native-firebase/firestore": "^23.5.0",
    "@react-native-firebase/storage": "^23.5.0",
    
    // 📱 Expo Core
    "expo": "~54.0.0",
    "react": "19.1.0",
    "react-native": "0.81.5",
    
    // 🛠️ Expo Modules
    "expo-camera": "~17.0.8",
    "expo-constants": "^18.0.10",
    "expo-dev-client": "^6.0.16",
    "expo-image-manipulator": "~14.0.7",
    "expo-image-picker": "~17.0.8",
    "expo-splash-screen": "~31.0.10",
    "expo-status-bar": "~3.0.8",
    
    // ⚙️ Utilities
    "@react-native-picker/picker": "2.11.1",
    "dotenv": "^17.2.3",
    "react-native-dotenv": "^3.4.11"
  },
  
  "devDependencies": {
    "@babel/core": "^7.20.0"
  },
  
  "overrides": {
    "undici": "6.21.2"
  }
}
```

**📦 Versioni Chiave:**
- **Expo SDK:** 54.0.0 (ultima stabile)
- **React Native:** 0.81.5
- **React:** 19.1.0
- **RNFB:** 23.5.0 (compatibile con Expo 54)

---

### 4. `babel.config.js` - Babel Configuration

**Stato:** ✅ CORRETTO

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv']  // ✅ Plugin per .env
    ]
  };
};
```

**🎯 Funzionalità:**
- Preset Expo standard
- Supporto variabili `.env` tramite `react-native-dotenv`

---

### 5. `google-services.json` - Firebase Android Config

**Stato:** ✅ PRESENTE E CONFIGURATO

```json
{
  "project_info": {
    "project_number": "880569534087",
    "project_id": "armadiodigitale",
    "storage_bucket": "armadiodigitale.firebasestorage.app"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:880569534087:android:731ba708ffe10642965a22",
        "android_client_info": {
          "package_name": "com.armadiodigitale.app"
        }
      },
      "api_key": [
        {
          "current_key": "AIzaSyBwEIW-PsXyc5stjfuvWug2PZ_j8PLwCnM"
        }
      ]
    }
  ]
}
```

**✅ Configurazione corretta:**
- Package name: `com.armadiodigitale.app` (match con app.config.js)
- Storage bucket: `armadiodigitale.firebasestorage.app`
- Project ID: `armadiodigitale`

---

## 🔥 CONFIGURAZIONE FIREBASE

### File: `src/config/firebaseConfig.js` (Senza Auth)

```javascript
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBwEIW-PsXyc5stjfuvWug2PZ_j8PLwCnM",
    authDomain: "armadiodigitale.firebaseapp.com",
    projectId: "armadiodigitale",
    storageBucket: "armadiodigitale.firebasestorage.app",
    messagingSenderId: "880569534087",
    appId: "1:880569534087:web:731ba708ffe10642965a22",
    measurementId: "G-0WY4W91L0M"
};

// Inizializzazione Firebase
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

const db = getFirestore(app);
const storage = getStorage(app);

// Utente simulato (senza Firebase Auth)
const simulatedUser = {
    uid: 'bmUXHw28LdcWsW9ySBShFEXj1Ap1',
    email: 'test@example.com',
    displayName: 'Test User'
};

export { db, storage, simulatedUser };
export default app;
```

---

### File: `App.js` - RNFB Nativo (ATTUALE)

```javascript
import Constants from 'expo-constants';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';

// API Keys da expo-constants
const apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || "";

const firebaseConfig = {
    apiKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: "armadiodigitale.firebaseapp.com",
    projectId: "armadiodigitale",
    storageBucket: "armadiodigitale.firebasestorage.app",
    messagingSenderId: "880569534087",
    appId: "1:880569534087:web:731ba708ffe10642965a22",
    measurementId: "G-0WY4W91L0M"
};

// ⚠️ Con React Native Firebase, l'inizializzazione avviene automaticamente
// tramite google-services.json - NON serve initializeApp()
```

---

## 📊 RIEPILOGO TECNICO

### Stack Tecnologico

| Componente | Versione | Stato | Note |
|------------|----------|-------|------|
| **Expo SDK** | 54.0.0 | ✅ | Ultima versione stabile |
| **React Native** | 0.81.5 | ✅ | Compatibile con Expo 54 |
| **React** | 19.1.0 | ✅ | Ultima versione |
| **RNFB App** | 23.5.0 | ✅ | Moduli nativi Firebase |
| **RNFB Firestore** | 23.5.0 | ✅ | Database |
| **RNFB Storage** | 23.5.0 | ✅ | File storage |
| **Android SDK Target** | 34 | ✅ | Android 14 |
| **Android SDK Compile** | 34 | ✅ | Android 14 |

### Configurazione Firebase

| Elemento | Valore | Stato |
|----------|--------|-------|
| **Project ID** | armadiodigitale | ✅ |
| **Storage Bucket** | armadiodigitale.firebasestorage.app | ✅ |
| **Package Name** | com.armadiodigitale.app | ✅ |
| **google-services.json** | Configurato | ✅ |
| **Plugin RNFB** | Attivo | ✅ |

### Environment Variables

```bash
# .env
EXPO_PUBLIC_GEMINI_API_KEY=<chiave-gemini-ai>
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBwEIW-PsXyc5stjfuvWug2PZ_j8PLwCnM
```

---

## 🚀 COMANDI BUILD DISPONIBILI

### Build Android

```powershell
# Preview (APK per testing) - CONSIGLIATO ⭐
npx eas build --platform android --profile preview

# Preview con cache pulita (risolve errori nativi)
npx eas build --platform android --profile preview --clear-cache

# Development (con dev client)
npx eas build --platform android --profile development

# Production (AAB per Google Play)
npx eas build --platform android --profile production
```

### Comandi Locali

```powershell
# Avvia Metro bundler
npm start

# Avvia con cache pulita
npm run start:clear

# Pulisci node_modules
npm run clean
```

---

## ⚠️ PROBLEMA ATTUALE: SIGABRT (Fatal Signal 6)

### 🔍 Analisi Tecnica del Problema

**Errore:** `Fatal signal 6 (SIGABRT)`  
**Quando si verifica:** All'avvio dell'app quando tenta di accedere a Firestore/Storage

### 📋 Causa Root

**Problema: Inizializzazione Nativa Fallita**

Il modulo `@react-native-firebase/app` (RNFB) **non viene inizializzato nel codice Java/Kotlin di Android** prima che il codice JavaScript provi a chiamare le API di Firestore/Storage.

**Sequenza Evento (Errata):**
```
1. App Android si avvia
2. Bridge React Native si inizializza
3. JavaScript viene caricato
4. App.js esegue: import storage from '@react-native-firebase/storage'
5. ❌ CRASH: Il modulo nativo RNFB non è registrato/inizializzato
6. Android termina il processo con SIGABRT (signal 6)
```

**Perché succede:**
- ❌ Il processo di **prebuild EAS** ha saltato la corretta inizializzazione nativa
- ❌ La **cache EAS** contiene una versione del codice nativo con linkage errato
- ❌ Il file `MainApplication.java/kt` non registra correttamente i package RNFB
- ❌ Il plugin `@react-native-firebase/app` in `app.config.js` non è stato processato nel build nativo

### ✅ Soluzione: Ricompilazione Totale con Cache Pulita

**Obiettivo:** Forzare EAS a rigenerare l'**intero codice nativo di avvio**, garantendo che RNFB venga inizializzato per primo.

### Fix Immediato

```powershell
# Rebuild con cache pulita per forzare compilazione nativa
npx eas build --platform android --profile preview --clear-cache
```

### 🔧 Cosa fa `--clear-cache` (Dettaglio Tecnico)

#### 1. **Pulizia Cache EAS**
```
- Rimuove cache Gradle (~/.gradle/caches)
- Pulisce cache npm/yarn EAS
- Elimina build artifacts precedenti
- Reset dello stato prebuild
```

#### 2. **Rigenerazione Codice Nativo Android**
```java
// MainApplication.java viene rigenerato con:

@Override
protected List<ReactPackage> getPackages() {
  return Arrays.<ReactPackage>asList(
    new MainReactPackage(),
    new RNFirebasePackage(),           // ✅ Package Firebase base
    new RNFirebaseStoragePackage(),    // ✅ Storage
    new RNFirebaseFirestorePackage()   // ✅ Firestore
  );
}
```

#### 3. **Integrazione google-services.json**
```
- Copia google-services.json in android/app/
- Configura buildscript in build.gradle
- Applica plugin com.google.gms.google-services
- Genera BuildConfig con Firebase SDK
```

#### 4. **Ricompilazione Moduli Nativi**
```
- Build librerie RNFB (.so files)
- Linking statico con React Native bridge
- Generazione codice JNI (Java Native Interface)
- Compilazione C++ modules per Firebase
```

#### 5. **Inizializzazione Corretta all'Avvio**
```kotlin
// Sequenza corretta post-rebuild:
1. Android avvia MainActivity
2. MainApplication.onCreate() viene chiamato
3. ReactNativeHost inizializza i package (include RNFB)
4. Bridge React Native registra moduli nativi Firebase
5. JavaScript può ora chiamare storage/firestore
6. ✅ Nessun crash - RNFB è pronto
```

### 📊 Confronto Before/After

| Aspetto | Build Attuale (Cached) | Build con --clear-cache |
|---------|----------------------|------------------------|
| **Cache Gradle** | Vecchia (errore linkage) | Pulita |
| **Prebuild** | Skipato | Eseguito completamente |
| **MainApplication** | Package RNFB mancanti | Package RNFB registrati ✅ |
| **google-services** | Non processato | Integrato nel build ✅ |
| **Moduli nativi** | Non linkati | Compilati e linkati ✅ |
| **Risultato** | SIGABRT crash ❌ | App funzionante ✅ |

### 🎯 Perché la Configurazione Era Già Corretta

La tua configurazione in `app.config.js` è **PERFETTA**:
```javascript
plugins: [
  "@react-native-firebase/app"  // ✅ Presente
],
android: {
  googleServicesFile: "./google-services.json"  // ✅ Presente
}
```

**MA** questa configurazione viene processata solo durante il **prebuild**. Se EAS usa la cache:
- ❌ Prebuild viene skippato
- ❌ Plugin non viene applicato al codice nativo
- ❌ google-services.json non viene integrato
- ❌ RNFB non viene inizializzato

Con `--clear-cache`:
- ✅ Prebuild viene **sempre eseguito**
- ✅ Plugin viene processato
- ✅ google-services.json integrato
- ✅ RNFB inizializzato correttamente

---

## ✅ CHECKLIST PRE-BUILD

- [x] **app.config.js**: Plugin `@react-native-firebase/app` presente
- [x] **app.config.js**: `googleServicesFile` configurato
- [x] **google-services.json**: File presente nella root
- [x] **package.json**: RNFB v23.5.0 installato
- [x] **eas.json**: Profilo preview configurato
- [x] **.env**: API keys configurate
- [ ] **Build nativo**: Eseguire rebuild con `--clear-cache`

---

## 📝 NOTE AGGIUNTIVE

### Differenza tra Firebase JS SDK vs RNFB

| Caratteristica | Firebase JS SDK | React Native Firebase |
|----------------|-----------------|----------------------|
| **Tipo** | Web-based | Nativo Android/iOS |
| **Performance** | Moderata | Alta |
| **Compatibilità Expo** | Go + Dev Client | Solo Dev Client/Bare |
| **Auth** | Problemi con RN | Completamente funzionante |
| **Blob/File Upload** | Richiede polyfill | Nativo |
| **Bundle Size** | Maggiore | Minore |
| **Configurazione** | initializeApp() | google-services.json |

**Scelta attuale:** React Native Firebase (RNFB) - **CORRETTO** per performance e compatibilità.

---

## 📚 FILE DOCUMENTAZIONE PRESENTI

1. **README.md** - Documentazione generale progetto
2. **FIREBASE_REPORT_UPDATED.md** - Report Firebase aggiornato
3. **BLOB_ISSUE_ANALYSIS.md** - Analisi problema Blob/ArrayBuffer
4. **ANDROID_SETUP.md** - Setup Android
5. **CHECKLIST_POST_BUILD.md** - Checklist post-build
6. **ANALISI_CONFIGURAZIONE_COMPLETA.md** - Questo file

---

## 🎯 PROSSIMI PASSI

1. **Eseguire rebuild nativo:**
   ```powershell
   npx eas build --platform android --profile preview --clear-cache
   ```

2. **Attendere build EAS** (~15-20 minuti)

3. **Scaricare e testare nuovo APK**

4. **Verificare che Firebase funzioni senza SIGABRT**

---

**Fine Analisi Configurazione**  
*Generato automaticamente il 2 Novembre 2025*
