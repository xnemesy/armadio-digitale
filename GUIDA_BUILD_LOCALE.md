# 🏗️ Guida Build Locale Android - Armadio Digitale

**Data:** 2 Novembre 2025  
**Scopo:** Creare APK in locale bypassando il limite EAS build mensili

---

## 📋 Prerequisiti

### 1️⃣ **Installare Android Studio**

#### Download
👉 https://developer.android.com/studio

#### Installazione
1. Scarica **Android Studio Ladybug** (ultima versione)
2. Esegui l'installer `.exe`
3. Segui il wizard:
   - ✅ **Android SDK**
   - ✅ **Android SDK Platform**
   - ✅ **Android Virtual Device** (opzionale per emulatore)

#### Percorso Installazione Consigliato
```
C:\Program Files\Android\Android Studio
```

---

### 2️⃣ **Configurare Android SDK**

#### Apri SDK Manager
1. Apri Android Studio
2. Vai su: **Tools** → **SDK Manager**
3. Nella tab **SDK Platforms**, installa:
   - ✅ **Android 14.0 (UpsideDownCake) - API Level 34**
   
4. Nella tab **SDK Tools**, installa:
   - ✅ **Android SDK Build-Tools 34.0.0**
   - ✅ **Android SDK Command-line Tools**
   - ✅ **Android SDK Platform-Tools**
   - ✅ **Android Emulator** (opzionale)

5. Clicca **Apply** e attendi il download (~2-3 GB)

---

### 3️⃣ **Configurare Variabili Ambiente Windows**

#### Apri Impostazioni Sistema
1. Premi `Win + R`
2. Digita: `sysdm.cpl` e premi Invio
3. Vai alla tab **Avanzate**
4. Clicca **Variabili d'ambiente**

#### Crea ANDROID_HOME (Variabile Sistema)
1. Nella sezione **Variabili di sistema**, clicca **Nuova**
2. **Nome variabile:** `ANDROID_HOME`
3. **Valore variabile:** `C:\Users\TUO_USERNAME\AppData\Local\Android\Sdk`
   
   ⚠️ Sostituisci `TUO_USERNAME` con il tuo nome utente Windows!

#### Aggiungi al PATH
1. Nella sezione **Variabili di sistema**, seleziona **Path**
2. Clicca **Modifica**
3. Clicca **Nuovo** e aggiungi:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\cmdline-tools\latest\bin
   %ANDROID_HOME%\emulator
   ```

4. Clicca **OK** su tutte le finestre

#### Verifica Installazione
Apri **nuovo** terminale PowerShell e testa:
```powershell
# Verifica ADB
adb version

# Verifica SDK Manager
sdkmanager --version

# Verifica ANDROID_HOME
$env:ANDROID_HOME
```

---

## 🚀 Build Locale

### Step 1: Prebuild (Genera Codice Nativo Android)

Apri PowerShell nella cartella del progetto:
```powershell
cd C:\Users\Spazi\armadio-digitale
```

Esegui prebuild per generare la cartella `android/`:
```powershell
npx expo prebuild --platform android --clean
```

**Cosa fa:**
- Crea cartella `android/` con codice nativo
- Integra `google-services.json`
- Configura RNFB nei file Java/Kotlin
- Setup Gradle build system

**Output atteso:**
```
✔ Created native Android project
✔ Installed expo modules
✔ Applied plugins
```

---

### Step 2: Build APK Release

```powershell
npx expo run:android --variant release
```

**Cosa fa:**
- Compila codice nativo Android
- Build moduli React Native Firebase
- Crea APK firmato in modalità release
- Output: `android/app/build/outputs/apk/release/app-release.apk`

**Tempo stimato:** 10-15 minuti (primo build)

---

### Step 3: Installare APK su Dispositivo

#### Opzione A: Via USB
```powershell
# Abilita Debug USB sul telefono
# Collega telefono al PC

# Installa APK
adb install android/app/build/outputs/apk/release/app-release.apk
```

#### Opzione B: Condivisione File
1. Copia `app-release.apk` sul telefono
2. Apri file manager sul telefono
3. Tap sull'APK e installa

---

## 🔧 Risoluzione Problemi Comuni

### Errore: "ANDROID_HOME not set"
```powershell
# Riavvia PowerShell dopo aver impostato le variabili ambiente
# Oppure imposta temporaneamente:
$env:ANDROID_HOME = "C:\Users\TUO_USERNAME\AppData\Local\Android\Sdk"
```

### Errore: "No Android SDK found"
```powershell
# Verifica percorso SDK
dir $env:ANDROID_HOME

# Se non esiste, reinstalla SDK da Android Studio SDK Manager
```

### Errore: "Gradle build failed"
```powershell
# Pulisci cache Gradle
cd android
.\gradlew clean

# Retry build
cd ..
npx expo run:android --variant release
```

### Errore: "Could not find or load main class org.gradle.wrapper.GradleWrapperMain"
```powershell
# Reinstalla Gradle wrapper
cd android
.\gradlew wrapper --gradle-version 8.3
cd ..
```

---

## 📊 Confronto EAS vs Build Locale

| Aspetto | EAS Build | Build Locale |
|---------|-----------|--------------|
| **Setup** | Nessuno | Android Studio richiesto |
| **Tempo** | 15-20 min | 10-15 min (dopo setup) |
| **Cache** | Cloud | Locale (più veloce) |
| **Limite mensile** | 30 build gratis | Illimitato ✅ |
| **Ambiente** | Cloud Ubuntu | Windows PC |
| **Debug** | Limitato | Completo con logcat |

---

## ✅ Vantaggi Build Locale

1. ✅ **Nessun limite mensile** - Build illimitati
2. ✅ **Più veloce** - No upload/download
3. ✅ **Debug completo** - Accesso a logcat e Android Studio debugger
4. ✅ **Test immediato** - APK disponibile subito
5. ✅ **Gratis** - Nessun costo aggiuntivo

---

## 📝 Note Finali

### Dopo il Primo Build
I build successivi saranno **molto più veloci** (~2-3 minuti) grazie alla cache Gradle locale.

### Pulizia Cache (se necessario)
```powershell
# Pulisci cache Gradle
cd android
.\gradlew clean

# Pulisci completamente
cd ..
rm -r android
npx expo prebuild --platform android --clean
```

### Firma APK per Distribuzione
Il build release viene automaticamente firmato con:
- Debug keystore (per testing)

Per Google Play Store, usa EAS build production o configura firma manuale.

---

**Fine Guida**  
*Buon Build! 🚀*
