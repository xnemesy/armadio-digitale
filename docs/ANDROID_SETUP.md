# Installazione Android SDK e Emulatore

## Metodo 1: Android Studio (Completo)

1. **Scarica Android Studio**:
   - Vai su https://developer.android.com/studio
   - Scarica e installa Android Studio

2. **Configura SDK**:
   - Apri Android Studio
   - Vai su "Tools" → "SDK Manager"
   - Installa almeno API Level 33 (Android 13)

3. **Crea Virtual Device**:
   - Vai su "Tools" → "AVD Manager"
   - Clicca "Create Virtual Device"
   - Scegli un device (es. Pixel 6)
   - Scarica system image
   - Avvia l'emulatore

4. **Variabili ambiente**:
   ```bash
   ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
   ANDROID_SDK_ROOT=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
   ```

## Metodo 2: Solo SDK (Più leggero)

1. **Command Line Tools Only**:
   - Scarica da https://developer.android.com/studio#downloads
   - Estrai in C:\android-sdk

2. **Installa SDK via command line**:
   ```bash
   sdkmanager "platform-tools" "platforms;android-33"
   sdkmanager "system-images;android-33;google_apis;x86_64"
   avdmanager create avd -n "Pixel_6_API_33" -k "system-images;android-33;google_apis;x86_64"
   ```

## Per questo progetto Expo

- **Raccomandato**: Usa Expo Go sul telefono
- **Alternativa**: Test web con `npx expo start --web`
- **Solo se necessario**: Android Studio per emulatore