/**
 * Google Sign-In Helper
 * Wrapper per @react-native-google-signin/google-signin
 * Gestisce autenticazione Google e integrazione con Firebase Auth
 */

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

/**
 * Configura Google Sign-In
 * Deve essere chiamato all'avvio dell'app (preferibilmente in App.js o AuthContext)
 * 
 * @param {string} webClientId - Web Client ID da Firebase Console
 * @example
 * configureGoogleSignIn('123456789-abcdefg.apps.googleusercontent.com');
 */
export const configureGoogleSignIn = (webClientId) => {
  if (!webClientId) {
    console.warn('⚠️  Google Sign-In: webClientId non fornito. Google Sign-In non sarà disponibile.');
    return;
  }

  try {
    GoogleSignin.configure({
      webClientId,
      offlineAccess: true, // Per ottenere refresh token
      forceCodeForRefreshToken: true, // Forza generazione codice per refresh
      scopes: ['email', 'profile'], // Permessi richiesti
    });
    console.log('✅ Google Sign-In configurato correttamente');
  } catch (error) {
    console.error('❌ Errore configurazione Google Sign-In:', error);
  }
};

/**
 * Verifica se Google Play Services è disponibile
 * Necessario per Android
 * 
 * @returns {Promise<boolean>} true se disponibile
 */
export const checkGooglePlayServices = async () => {
  try {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true, // Mostra dialog per aggiornare Play Services se necessario
    });
    return true;
  } catch (error) {
    console.error('Google Play Services non disponibile:', error);
    return false;
  }
};

/**
 * Esegue il sign-in con Google e autentica con Firebase
 * 
 * @returns {Promise<FirebaseAuthTypes.UserCredential>} Firebase User Credential
 * @throws {Error} Errore durante il sign-in
 * 
 * @example
 * try {
 *   const userCredential = await signInWithGoogle();
 *   console.log('User:', userCredential.user);
 * } catch (error) {
 *   Alert.alert('Errore', error.message);
 * }
 */
export const signInWithGoogle = async () => {
  try {
    // 1. Verifica Google Play Services (Android)
    const hasPlayServices = await checkGooglePlayServices();
    if (!hasPlayServices) {
      throw new Error('Google Play Services non disponibile. Aggiorna Google Play Services e riprova.');
    }

    // 2. Esegui Google Sign-In
    const userInfo = await GoogleSignin.signIn();
    
    // 3. Ottieni ID Token
    const { idToken } = userInfo;
    
    if (!idToken) {
      throw new Error('Impossibile ottenere ID Token da Google');
    }

    // 4. Crea credenziale Firebase
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // 5. Sign in su Firebase con credenziale Google
    const userCredential = await auth().signInWithCredential(googleCredential);

    console.log('✅ Google Sign-In completato:', userCredential.user.email);
    return userCredential;

  } catch (error) {
    // Gestione errori specifici
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign-in annullato dall\'utente');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign-in già in corso');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services non disponibile o non aggiornato');
    } else {
      console.error('Errore Google Sign-In:', error);
      throw new Error(error.message || 'Errore durante il login con Google');
    }
  }
};

/**
 * Ottiene informazioni utente corrente di Google (se loggato)
 * 
 * @returns {Promise<Object|null>} User info o null se non loggato
 */
export const getCurrentGoogleUser = async () => {
  try {
    const userInfo = await GoogleSignin.signInSilently();
    return userInfo;
  } catch (error) {
    return null;
  }
};

/**
 * Verifica se l'utente è già loggato con Google
 * 
 * @returns {Promise<boolean>} true se loggato
 */
export const isGoogleSignedIn = async () => {
  return GoogleSignin.isSignedIn();
};

/**
 * Esegue il sign-out da Google
 * NOTA: Questo NON fa sign-out da Firebase, chiama anche auth().signOut() se necessario
 * 
 * @returns {Promise<void>}
 */
export const signOutFromGoogle = async () => {
  try {
    await GoogleSignin.revokeAccess(); // Revoca accesso (opzionale, più sicuro)
    await GoogleSignin.signOut(); // Sign out da Google
    console.log('✅ Google Sign-Out completato');
  } catch (error) {
    console.error('Errore durante Google Sign-Out:', error);
    // Non lanciare errore, permettiamo comunque il sign-out da Firebase
  }
};

/**
 * Gestisce il re-authentication con Google
 * Utile quando Firebase richiede re-auth per operazioni sensibili (es. delete account)
 * 
 * @returns {Promise<FirebaseAuthTypes.AuthCredential>} Credenziale per re-auth
 */
export const getGoogleCredentialForReauth = async () => {
  try {
    const userInfo = await GoogleSignin.signIn();
    const { idToken } = userInfo;
    
    if (!idToken) {
      throw new Error('Impossibile ottenere ID Token per re-authentication');
    }

    return auth.GoogleAuthProvider.credential(idToken);
  } catch (error) {
    console.error('Errore re-authentication Google:', error);
    throw new Error('Re-authentication con Google fallita');
  }
};

export default {
  configureGoogleSignIn,
  checkGooglePlayServices,
  signInWithGoogle,
  getCurrentGoogleUser,
  isGoogleSignedIn,
  signOutFromGoogle,
  getGoogleCredentialForReauth,
};
