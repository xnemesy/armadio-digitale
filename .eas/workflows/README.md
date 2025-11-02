# EAS Workflows - Automazione Build & Deploy

Questa cartella contiene i workflow automatizzati per EAS (Expo Application Services).

## 📋 Workflow Disponibili

### 1. Build Workflows

#### `build-android-development.yml`
- **Scopo**: Build di sviluppo con dev client
- **Trigger**: 
  - Manuale: `eas workflow:run build-android-development`
  - Automatico: Push su `main` o `development` branch
- **Profilo**: `development`
- **Output**: APK con Expo Dev Client

#### `build-android-preview.yml`
- **Scopo**: Build di test/anteprima
- **Trigger**:
  - Manuale: `eas workflow:run build-android-preview`
  - Automatico: Push su `main`, `staging`, `preview` branch
- **Profilo**: `preview`
- **Output**: APK standalone per testing

#### `build-android-production.yml`
- **Scopo**: Build produzione per Play Store
- **Trigger**: Solo manuale (`eas workflow:run build-android-production`)
- **Profilo**: `production`
- **Output**: AAB firmato per Google Play

### 2. Submit Workflow

#### `submit-android.yml`
- **Scopo**: Caricamento automatico su Google Play Store
- **Trigger**: Solo manuale
- **Track**: `internal` (configurabile: alpha, beta, production)
- **Comando**: `eas workflow:run submit-android`

### 3. Update Workflow

#### `eas-update.yml`
- **Scopo**: Aggiornamenti OTA (Over-The-Air) senza rebuild
- **Trigger**: 
  - Manuale: `eas workflow:run eas-update`
  - Automatico: Push su `main` branch
- **Branch**: `production`

## 🚀 Come Usare i Workflow

### Eseguire manualmente un workflow:
```bash
# Build development
eas workflow:run build-android-development

# Build preview (quello usato ora)
eas workflow:run build-android-preview

# Build production
eas workflow:run build-android-production

# Submit to Play Store
eas workflow:run submit-android

# Publish OTA update
eas workflow:run eas-update
```

### Trigger automatici:
I workflow si attivano automaticamente quando:
- **Development/Preview**: Push su `main`, `development`, `staging`, `preview`
- **Update OTA**: Push su `main` (solo per update JavaScript, non rebuild)

## 📝 Configurazione Profili (eas.json)

I workflow usano i profili definiti in `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

## 🔧 Stato Attuale

### Build Correnti:
- **Build #1** (b4ceddb0): ✅ Completato - Rimozione Firebase Auth
- **Build #2** (e2a26f02): 🔄 In corso - Fix Blob upload (uploadString Base64)

### Prossimi Passi:
1. ✅ Attendere completamento Build #2
2. ✅ Installare APK su emulatore
3. ✅ Testare upload foto (verifica fix Blob)
4. ⏳ Deploy su Play Store con `submit-android.yml`

## 🛠️ Troubleshooting

### Errori Comuni:

**"Workflow not found"**
- Verifica che i file .yml siano in `.eas/workflows/`
- Esegui `eas build:configure` per aggiornare

**"Build failed"**
- Controlla i log: `https://expo.dev/accounts/xh00k/projects/armadio-digitale/builds/[BUILD_ID]`
- Verifica `eas.json` e `app.json`

**"Firebase Auth crash"**
- ✅ RISOLTO: Firebase Auth rimosso completamente da App.js

**"Blob upload error"**
- ✅ FIX APPLICATO: Rimossa funzione `compressImage`, uso solo `uploadString` Base64

## 📚 Riferimenti

- [EAS Workflows Docs](https://docs.expo.dev/eas/workflows/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [EAS Update](https://docs.expo.dev/eas-update/introduction/)
