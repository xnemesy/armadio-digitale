# 🔐 Firebase Multi-Provider Authentication - Complete Setup# 🔐 Configurazione Firebase Authentication



Guida completa per configurare Firebase Authentication con Email/Password + Google Sign-In + Apple Sign-In.## ✅ Implementazione Completata



---### Pacchetti Installati

- ✅ `@react-native-firebase/auth` - Authentication nativa per React Native

## 🎯 **Implementazione Completata**

### File Creati/Modificati

✅ **SHA-1 Debug generato:** `B4:1B:3E:98:60:5A:95:11:15:0C:7D:FB:39:BF:2A:27:17:C1:D2:43`  1. **AuthContext** (`src/contexts/AuthContext.js`)

✅ **Google Sign-In SDK installato**     - Gestione stato autenticazione

✅ **Apple Sign-In SDK installato**     - Sign in / Sign up

✅ **src/lib/googleAuth.js** - Wrapper completo Google authentication     - Password reset

✅ **src/lib/appleAuth.js** - Wrapper completo Apple authentication     - Email verification

✅ **AuthContext aggiornato** - sign in Google + signInWithApple + signInWithEmail     - Logout

✅ **LoginScreen** - UI completa con 3 provider  

✅ **app.config.js** - Configurazione googleWebClientId  2. **AuthScreen** (`src/screens/AuthScreen.js`)

✅ **.env.example** - Template variabili ambiente     - Schermata login/registrazione

   - Recupero password

---   - UI migliorata con feedback



## 📋 **Setup Firebase Console (AZIONE RICHIESTA)**3. **ProfileScreen** (`src/screens/ProfileScreen.js`)

   - Visualizzazione info utente

### **1. Aggiungi SHA-1 Fingerprint**   - Badge verifica email

   - Logout con conferma

1. Vai su: https://console.firebase.google.com/

2. Seleziona progetto: **armadiodigitale**4. **App.js**

3. ⚙️ **Project Settings** → **General**   - Integrato AuthProvider

4. Scorri a **Your apps** → Android app   - Navigazione condizionale basata su auth state

5. Clicca **Add fingerprint**

6. Incolla SHA-1 Debug:## 📋 Configurazione Firebase Console

   ```

   B4:1B:3E:98:60:5A:95:11:15:0C:7D:FB:39:BF:2A:27:17:C1:D2:43### 1. Abilitare Email/Password Authentication

   ```

7. Clicca **Save**1. Vai su [Firebase Console](https://console.firebase.google.com)

2. Seleziona il progetto **armadiodigitale**

### **2. Abilita Google Sign-In**3. Nel menu laterale: **Build** → **Authentication**

4. Vai alla tab **Sign-in method**

1. Sidebar → **Authentication** → **Sign-in method**5. Clicca su **Email/Password**

2. Clicca **Google** → **Enable**6. Abilita:

3. **Project support email**: Inserisci tua email   - ✅ **Email/Password** (attivato)

4. **IMPORTANTE:** Copia il **Web client ID** mostrato   - ✅ **Email link (passwordless sign-in)** (opzionale)

   - Esempio: `123456789012-abcdefg...apps.googleusercontent.com`7. Salva

5. **Save**

### 2. Personalizzare Template Email (Opzionale ma Raccomandato)

### **3. Scarica google-services.json Aggiornato**

1. In **Authentication** → **Templates**

1. **Project Settings** → **General** → **Your apps** → **Android app**2. Personalizza:

2. Clicca **Download google-services.json**   - **Email di verifica**

3. Sostituisci `android/app/google-services.json`   - **Reset password**

   - **Cambio email**

### **4. Abilita Email/Password (se non già fatto)**

Esempio template email di verifica:

1. **Authentication** → **Sign-in method** → **Email/Password**```

2. **Enable** → **Save**Ciao %DISPLAY_NAME%,



### **5. (Opzionale) Abilita Apple Sign-In per iOS**Grazie per esserti registrato su Armadio Digitale!



1. **Authentication** → **Sign-in method** → **Apple**Per completare la registrazione, clicca sul link qui sotto per verificare il tuo indirizzo email:

2. **Enable** → **Save**%LINK%

3. *Richiede Apple Developer Account*

Se non hai richiesto questa email, puoi ignorarla.

---

Grazie,

## 🔧 **Configurazione Locale**Il team di Armadio Digitale

```

### **1. Crea file .env**

### 3. Configurare Dominio Autorizzato

Crea `.env` nella root del progetto:

1. In **Authentication** → **Settings**

```bash2. Nella sezione **Authorized domains**

# Firebase API Key (da Firebase Console → Project Settings)3. Verifica che siano presenti:

EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyC...   - `localhost` (per sviluppo)

   - Il tuo dominio (se hai una web app)

# Google Web Client ID (copiato da step 2 sopra)

GOOGLE_WEB_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com### 4. Opzionale: Abilitare Altri Provider



# Gemini API (optional, per AI features)Puoi abilitare altri metodi di login:

EXPO_PUBLIC_GEMINI_API_KEY=your_key- Google Sign-In

- Apple Sign-In

# Sentry (optional, per crash reporting)- Facebook Login

SENTRY_DSN=https://xxxxx@sentry.io/123456- Etc.

```

## 🧪 Testing

### **2. Verifica google-services.json**

### Test Manuale nell'App

```bash

# Il file DEVE contenere il tuo package name1. **Registrazione**:

cat android/app/google-services.json | grep "package_name"   ```

   Email: test@example.com

# Output atteso:   Password: test123456

# "package_name": "com.armadiodigitale.app"   ```

```

2. **Login**:

---   - Usa le stesse credenziali



## 🚀 **Rebuild App**3. **Reset Password**:

   - Clicca "Password dimenticata?"

Dopo aver completato la configurazione Firebase:   - Inserisci email

   - Controlla inbox

```bash

# Clean rebuild (necessario per SHA-1 e google-services.json)4. **Verifica Email**:

cd android && ./gradlew clean && cd ..   - Dopo registrazione, vedrai banner

   - Tap per reinviare email

# Development build con EAS   - Clicca link nell'email

eas build --platform android --profile development

### Test da Firebase Console

# OPPURE build locale

npm run android1. Vai in **Authentication** → **Users**

```2. Vedrai gli utenti registrati

3. Puoi:

---   - Disabilitare utenti

   - Eliminare utenti

## 🧪 **Test Autenticazione**   - Resettare password manualmente

   - Verificare email manualmente

### **A. Test Email/Password**

## 🔒 Security Rules (Da Implementare)

```javascript

import { useAuth } from '../contexts/AuthContext';Aggiorna le Firestore Security Rules per proteggere i dati utente:



const { signIn, signUp } = useAuth();```javascript

rules_version = '2';

// Registrazioneservice cloud.firestore {

const result = await signUp('test@example.com', 'password123');  match /databases/{database}/documents {

if (result.success) {    // Regola base: solo utenti autenticati

  console.log('Account creato! Controlla email per verifica.');    function isAuthenticated() {

}      return request.auth != null;

    }

// Login    

const loginResult = await signIn('test@example.com', 'password123');    // Regola: solo proprietario può accedere ai propri dati

if (loginResult.success) {    function isOwner(userId) {

  console.log('Login completato!');      return isAuthenticated() && request.auth.uid == userId;

}    }

```    

    match /artifacts/{appId}/users/{userId}/{document=**} {

### **B. Test Google Sign-In**      allow read, write: if isOwner(userId);

    }

1. Apri app su device/emulatore  }

2. Vai a **LoginScreen**}

3. Clicca bottone **"🔵 Google"**```

4. Seleziona account Google

5. Verifica login completato## 📱 Funzionalità Implementate



**Debug logs da cercare:**### ✅ AuthContext Hook

``````javascript

✅ Google Sign-In configurato correttamenteimport { useAuth } from '../contexts/AuthContext';

✅ Google Sign-In completato: user@gmail.com

```const { user, signIn, signUp, signOut, loading } = useAuth();

```

**Se vedi errore `DEVELOPER_ERROR`:**

- Verifica SHA-1 aggiunto a Firebase Console### Metodi Disponibili

- Verifica google-services.json aggiornato- ✅ `signIn(email, password)` - Login

- Rebuild app- ✅ `signUp(email, password)` - Registrazione con verifica email

- ✅ `signOut()` - Logout

### **C. Test Apple Sign-In (iOS)**- ✅ `resetPassword(email)` - Reset password

- ✅ `updateUserProfile(displayName, photoURL)` - Aggiorna profilo

1. Apri app su iOS 13+ device- ✅ `resendEmailVerification()` - Reinvia email verifica

2. Vai a **LoginScreen**- ✅ `user` - Oggetto utente corrente (null se non autenticato)

3. Verifica bottone **"🍎 Apple"** visibile- ✅ `loading` - Stato caricamento

4. Clicca bottone- ✅ `isAuthenticated` - Boolean se utente è loggato

5. Autenticati con Face ID/Touch ID

### Proprietà User Object

**Requisiti:**```javascript

- iOS 13+{

- Apple Developer Account  uid: string,

- Xcode entitlement configurato  email: string,

  emailVerified: boolean,

---  displayName: string | null,

  photoURL: string | null,

## 🔒 **Test Security Rules**  // ... altri campi Firebase

}

### **Firestore Test con Auth Reale**```



Firebase Console → Firestore Database → Regole → Playground## 🔄 Prossimi Passi



**Test 1: Accesso autenticato ai propri dati ✅**1. ✅ Implementato Firebase Auth

```2. ⏳ Testare auth nell'app

Location: /artifacts/armadiodigitale/users/{YOUR_UID}/items/test13. ⏳ Configurare Security Rules

Access: Read4. ⏳ Implementare Google Sign-In (opzionale)

Authentication: Firebase Auth (inserisci il tuo UID reale)5. ⏳ Aggiungere profilo utente dettagliato

```6. ⏳ Implementare avatar personalizzato

Risultato atteso: ✅ Simulated read allowed

## 🐛 Troubleshooting

**Test 2: Blocco accesso cross-user ❌**

```### Errore: "auth/invalid-api-key"

Location: /artifacts/armadiodigitale/users/OTHER_USER_ID/items/test1- Verifica che `google-services.json` sia aggiornato

Access: Read- Controlla che l'API key sia corretta in Firebase Console

Authentication: Firebase Auth (il tuo UID diverso da OTHER_USER_ID)

```### Errore: "auth/network-request-failed"

Risultato atteso: ❌ Simulated read denied- Controlla connessione internet

- Verifica che Firebase sia configurato correttamente

### **Ottieni il tuo Firebase UID**

### Email di verifica non arriva

```javascript- Controlla spam/junk

import auth from '@react-native-firebase/auth';- Verifica template email in Firebase Console

- Controlla che il dominio sia autorizzato

// Dopo login

const user = auth().currentUser;### Build Android fallisce

console.log('Firebase UID:', user.uid);```bash

// Esempio output: Firebase UID: kJ7h3L9mP2qR8sT4vW6xcd android && ./gradlew clean

```cd .. && npx react-native run-android

```

---

## 📚 Risorse

## 📱 **Integrazione LoginScreen**

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)

Il LoginScreen è già implementato in `src/screens/LoginScreen.js`.- [React Native Firebase Auth](https://rnfirebase.io/auth/usage)

- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)

### **Aggiungi a Navigation Stack**

```javascript
// In App.js o AuthNavigator
import LoginScreen from './src/screens/LoginScreen';

<Stack.Navigator>
  <Stack.Screen 
    name="Login" 
    component={LoginScreen}
    options={{ headerShown: false }}
  />
</Stack.Navigator>
```

### **Features LoginScreen**

- ✅ Email/Password form con validazione
- ✅ Password visibility toggle
- ✅ Google Sign-In button
- ✅ Apple Sign-In button (solo iOS 13+)
- ✅ "Password dimenticata?" link
- ✅ "Registrati" link
- ✅ Design system integrato (tokens)
- ✅ Feedback tattile
- ✅ Gestione errori localizzata

---

## 🐛 **Troubleshooting**

### **Errore: "Google Sign-In DEVELOPER_ERROR"**

**Causa:** SHA-1 non aggiunto o google-services.json non aggiornato

**Soluzione:**
1. Verifica SHA-1 in Firebase Console (Project Settings → Android app)
2. Scarica nuovo google-services.json
3. Sostituisci `android/app/google-services.json`
4. Clean rebuild:
   ```bash
   cd android && ./gradlew clean && cd ..
   eas build --platform android --profile development
   ```

### **Errore: "Google Web Client ID non configurato"**

**Causa:** GOOGLE_WEB_CLIENT_ID mancante in .env

**Soluzione:**
1. Firebase Console → Authentication → Sign-in method → Google
2. Copia Web client ID
3. Aggiungi a `.env`:
   ```bash
   GOOGLE_WEB_CLIENT_ID=your-web-client-id
   ```
4. Riavvia Metro bundler: `npm run android`

### **Apple Sign-In button non visibile**

**Causa:** iOS < 13 o Android

**Verifica:**
```javascript
import { isAppleSignInSupported } from '../lib/appleAuth';

const check = async () => {
  const isAvailable = await isAppleSignInSupported();
  console.log('Apple Sign-In:', isAvailable ? 'Disponibile' : 'Non disponibile');
};
```

### **Errore: "auth/requires-recent-login"**

**Causa:** Operazione sensibile (es. delete account) richiede re-autenticazione

**Soluzione:** Già gestito in AuthContext deleteAccount():
```javascript
// Re-auth automatico se necessario
if (error.code === 'auth/requires-recent-login') {
  // Mostra alert e reindirizza a login
}
```

---

## ✅ **Checklist Completa**

### **Firebase Console**
- [ ] SHA-1 Debug aggiunto: `B4:1B:3E:98:60:5A:95:11:15:0C:7D:FB:39:BF:2A:27:17:C1:D2:43`
- [ ] Google Sign-In abilitato
- [ ] Web Client ID copiato
- [ ] google-services.json scaricato e sostituito
- [ ] Email/Password abilitato
- [ ] (Opzionale) Apple Sign-In abilitato

### **Configurazione Locale**
- [ ] File `.env` creato con `GOOGLE_WEB_CLIENT_ID`
- [ ] File `.env` contiene `EXPO_PUBLIC_FIREBASE_API_KEY`
- [ ] `android/app/google-services.json` aggiornato
- [ ] Dipendenze installate (google-signin, apple-authentication)

### **Build & Test**
- [ ] Clean rebuild eseguito
- [ ] App testata su device reale
- [ ] Email/Password login funziona
- [ ] Google Sign-In funziona
- [ ] Logs verificati (no errori DEVELOPER_ERROR)
- [ ] Security Rules testate con UID reale

---

## 📚 **Files Implementati**

```
src/
├── lib/
│   ├── googleAuth.js          # ✅ Google Sign-In wrapper
│   ├── appleAuth.js           # ✅ Apple Sign-In wrapper
│   ├── analytics.js           # ✅ Firebase Analytics con consent
│   └── sentry.js              # ✅ Crash reporting
├── contexts/
│   └── AuthContext.js         # ✅ Multi-provider auth + deleteAccount
├── screens/
│   └── LoginScreen.js         # ✅ UI completa 3 provider
└── components/
    └── ConsentDialog.js       # ✅ GDPR analytics consent

scripts/
├── get-sha-fingerprints.sh    # ✅ Ottieni SHA-1/SHA-256
├── verify-firebase-rules.js   # ✅ Test Security Rules
└── deploy-rules.sh            # ✅ Deploy automatico rules

docs/
├── FIREBASE_AUTH_SETUP.md     # ✅ Questa guida
├── FIREBASE_SECURITY_RULES.md # ✅ Guida Security Rules
└── COMPLIANCE_COMPLETED.md    # ✅ Checklist compliance GDPR
```

---

## 🎯 **Next Steps**

### **Immediate (Oggi)**
1. ✅ Aggiungi SHA-1 a Firebase Console (5 min)
2. ✅ Abilita Google Sign-In e copia Web Client ID (3 min)
3. ✅ Crea file `.env` con GOOGLE_WEB_CLIENT_ID (2 min)
4. ✅ Scarica nuovo google-services.json (1 min)
5. ✅ Rebuild app con EAS (10-15 min)
6. ✅ Test Google Sign-In su device (5 min)

### **Future (Optional)**
- iOS Setup con Apple Sign-In
- Release SHA-1 da EAS production build
- Sentry DSN per crash reporting
- Analytics consent testing

---

## 📞 **Support**

**SHA-1 generato:** `B4:1B:3E:98:60:5A:95:11:15:0C:7D:FB:39:BF:2A:27:17:C1:D2:43`

**Script utili:**
```bash
# Ottieni SHA-1 (già generato)
bash scripts/get-sha-fingerprints.sh

# Test Security Rules
node scripts/verify-firebase-rules.js

# Deploy rules automatico
bash scripts/deploy-rules.sh
```

**Resources:**
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Google Sign-In React Native](https://react-native-google-signin.github.io/docs/)
- [Apple Sign-In Docs](https://github.com/invertase/react-native-apple-authentication)

---

✅ **Implementazione Completa!** Ora devi solo:
1. Aggiungere SHA-1 a Firebase Console
2. Abilitare Google Sign-In e copiare Web Client ID
3. Creare `.env` con `GOOGLE_WEB_CLIENT_ID`
4. Rebuild app

🎉 Dopo questi 4 step avrai autenticazione multi-provider funzionante!
