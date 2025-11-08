# 🔐 Configurazione Firebase Authentication

## ✅ Implementazione Completata

### Pacchetti Installati
- ✅ `@react-native-firebase/auth` - Authentication nativa per React Native

### File Creati/Modificati
1. **AuthContext** (`src/contexts/AuthContext.js`)
   - Gestione stato autenticazione
   - Sign in / Sign up
   - Password reset
   - Email verification
   - Logout

2. **AuthScreen** (`src/screens/AuthScreen.js`)
   - Schermata login/registrazione
   - Recupero password
   - UI migliorata con feedback

3. **ProfileScreen** (`src/screens/ProfileScreen.js`)
   - Visualizzazione info utente
   - Badge verifica email
   - Logout con conferma

4. **App.js**
   - Integrato AuthProvider
   - Navigazione condizionale basata su auth state

## 📋 Configurazione Firebase Console

### 1. Abilitare Email/Password Authentication

1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Seleziona il progetto **armadiodigitale**
3. Nel menu laterale: **Build** → **Authentication**
4. Vai alla tab **Sign-in method**
5. Clicca su **Email/Password**
6. Abilita:
   - ✅ **Email/Password** (attivato)
   - ✅ **Email link (passwordless sign-in)** (opzionale)
7. Salva

### 2. Personalizzare Template Email (Opzionale ma Raccomandato)

1. In **Authentication** → **Templates**
2. Personalizza:
   - **Email di verifica**
   - **Reset password**
   - **Cambio email**

Esempio template email di verifica:
```
Ciao %DISPLAY_NAME%,

Grazie per esserti registrato su Armadio Digitale!

Per completare la registrazione, clicca sul link qui sotto per verificare il tuo indirizzo email:
%LINK%

Se non hai richiesto questa email, puoi ignorarla.

Grazie,
Il team di Armadio Digitale
```

### 3. Configurare Dominio Autorizzato

1. In **Authentication** → **Settings**
2. Nella sezione **Authorized domains**
3. Verifica che siano presenti:
   - `localhost` (per sviluppo)
   - Il tuo dominio (se hai una web app)

### 4. Opzionale: Abilitare Altri Provider

Puoi abilitare altri metodi di login:
- Google Sign-In
- Apple Sign-In
- Facebook Login
- Etc.

## 🧪 Testing

### Test Manuale nell'App

1. **Registrazione**:
   ```
   Email: test@example.com
   Password: test123456
   ```

2. **Login**:
   - Usa le stesse credenziali

3. **Reset Password**:
   - Clicca "Password dimenticata?"
   - Inserisci email
   - Controlla inbox

4. **Verifica Email**:
   - Dopo registrazione, vedrai banner
   - Tap per reinviare email
   - Clicca link nell'email

### Test da Firebase Console

1. Vai in **Authentication** → **Users**
2. Vedrai gli utenti registrati
3. Puoi:
   - Disabilitare utenti
   - Eliminare utenti
   - Resettare password manualmente
   - Verificare email manualmente

## 🔒 Security Rules (Da Implementare)

Aggiorna le Firestore Security Rules per proteggere i dati utente:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regola base: solo utenti autenticati
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Regola: solo proprietario può accedere ai propri dati
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    match /artifacts/{appId}/users/{userId}/{document=**} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

## 📱 Funzionalità Implementate

### ✅ AuthContext Hook
```javascript
import { useAuth } from '../contexts/AuthContext';

const { user, signIn, signUp, signOut, loading } = useAuth();
```

### Metodi Disponibili
- ✅ `signIn(email, password)` - Login
- ✅ `signUp(email, password)` - Registrazione con verifica email
- ✅ `signOut()` - Logout
- ✅ `resetPassword(email)` - Reset password
- ✅ `updateUserProfile(displayName, photoURL)` - Aggiorna profilo
- ✅ `resendEmailVerification()` - Reinvia email verifica
- ✅ `user` - Oggetto utente corrente (null se non autenticato)
- ✅ `loading` - Stato caricamento
- ✅ `isAuthenticated` - Boolean se utente è loggato

### Proprietà User Object
```javascript
{
  uid: string,
  email: string,
  emailVerified: boolean,
  displayName: string | null,
  photoURL: string | null,
  // ... altri campi Firebase
}
```

## 🔄 Prossimi Passi

1. ✅ Implementato Firebase Auth
2. ⏳ Testare auth nell'app
3. ⏳ Configurare Security Rules
4. ⏳ Implementare Google Sign-In (opzionale)
5. ⏳ Aggiungere profilo utente dettagliato
6. ⏳ Implementare avatar personalizzato

## 🐛 Troubleshooting

### Errore: "auth/invalid-api-key"
- Verifica che `google-services.json` sia aggiornato
- Controlla che l'API key sia corretta in Firebase Console

### Errore: "auth/network-request-failed"
- Controlla connessione internet
- Verifica che Firebase sia configurato correttamente

### Email di verifica non arriva
- Controlla spam/junk
- Verifica template email in Firebase Console
- Controlla che il dominio sia autorizzato

### Build Android fallisce
```bash
cd android && ./gradlew clean
cd .. && npx react-native run-android
```

## 📚 Risorse

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [React Native Firebase Auth](https://rnfirebase.io/auth/usage)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
