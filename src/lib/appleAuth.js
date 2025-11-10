/**
 * Apple Sign-In Helper
 * Wrapper per @invertase/react-native-apple-authentication
 * Gestisce autenticazione Apple e integrazione con Firebase Auth
 * 
 * NOTA: Apple Sign-In funziona solo su iOS 13+ e richiede:
 * - Apple Developer Account
 * - App ID configurato con Sign in with Apple capability
 * - Entitlement com.apple.developer.applesignin in Xcode
 */

import { Platform } from 'react-native';
import { appleAuth, appleAuthAndroid } from '@invertase/react-native-apple-authentication';
import auth from '@react-native-firebase/auth';

/**
 * Verifica se Apple Sign-In è supportato sul dispositivo
 * 
 * @returns {Promise<boolean>} true se supportato
 */
export const isAppleSignInSupported = async () => {
  if (Platform.OS !== 'ios') {
    return false; // Apple Sign-In nativo supportato solo su iOS
  }

  try {
    return await appleAuth.isSupported();
  } catch (error) {
    console.warn('Apple Sign-In non supportato:', error);
    return false;
  }
};

/**
 * Esegue il sign-in con Apple su iOS e autentica con Firebase
 * 
 * @returns {Promise<FirebaseAuthTypes.UserCredential>} Firebase User Credential
 * @throws {Error} Errore durante il sign-in
 * 
 * @example
 * if (Platform.OS === 'ios' && await isAppleSignInSupported()) {
 *   try {
 *     const userCredential = await signInWithApple();
 *     console.log('User:', userCredential.user);
 *   } catch (error) {
 *     Alert.alert('Errore', error.message);
 *   }
 * }
 */
export const signInWithApple = async () => {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In è disponibile solo su iOS');
  }

  try {
    // 1. Verifica supporto
    const isSupported = await isAppleSignInSupported();
    if (!isSupported) {
      throw new Error('Apple Sign-In non supportato su questo dispositivo (richiede iOS 13+)');
    }

    // 2. Esegui Apple Authentication Request
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    // 3. Verifica risposta
    const { identityToken, nonce, email, fullName } = appleAuthRequestResponse;

    if (!identityToken) {
      throw new Error('Impossibile ottenere Identity Token da Apple');
    }

    // 4. Crea credenziale Firebase
    const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

    // 5. Sign in su Firebase con credenziale Apple
    const userCredential = await auth().signInWithCredential(appleCredential);

    // 6. Aggiorna displayName se fornito da Apple (solo al primo login)
    if (fullName && !userCredential.user.displayName) {
      const displayName = [fullName.givenName, fullName.familyName]
        .filter(Boolean)
        .join(' ')
        .trim();

      if (displayName) {
        await userCredential.user.updateProfile({ displayName });
        console.log('✅ Display name aggiornato:', displayName);
      }
    }

    console.log('✅ Apple Sign-In completato:', email || userCredential.user.email);
    return userCredential;

  } catch (error) {
    // Gestione errori specifici
    if (error.code === appleAuth.Error.CANCELED) {
      throw new Error('Sign-in annullato dall\'utente');
    } else if (error.code === appleAuth.Error.FAILED) {
      throw new Error('Apple Sign-In fallito. Riprova.');
    } else if (error.code === appleAuth.Error.INVALID_RESPONSE) {
      throw new Error('Risposta non valida da Apple');
    } else if (error.code === appleAuth.Error.NOT_HANDLED) {
      throw new Error('Apple Sign-In non gestito correttamente');
    } else if (error.code === appleAuth.Error.UNKNOWN) {
      throw new Error('Errore sconosciuto durante Apple Sign-In');
    } else {
      console.error('Errore Apple Sign-In:', error);
      throw new Error(error.message || 'Errore durante il login con Apple');
    }
  }
};

/**
 * Gestisce il re-authentication con Apple
 * Utile quando Firebase richiede re-auth per operazioni sensibili (es. delete account)
 * 
 * @returns {Promise<FirebaseAuthTypes.AuthCredential>} Credenziale per re-auth
 */
export const getAppleCredentialForReauth = async () => {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In è disponibile solo su iOS');
  }

  try {
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [], // Non richiediamo scopes per re-auth
    });

    const { identityToken, nonce } = appleAuthRequestResponse;

    if (!identityToken) {
      throw new Error('Impossibile ottenere Identity Token per re-authentication');
    }

    return auth.AppleAuthProvider.credential(identityToken, nonce);
  } catch (error) {
    console.error('Errore re-authentication Apple:', error);
    throw new Error('Re-authentication con Apple fallita');
  }
};

/**
 * Ottiene lo stato delle credenziali Apple per l'utente corrente
 * Utile per verificare se l'utente ha revocato l'accesso dall'app Settings
 * 
 * @param {string} appleUserId - User ID Apple (da Firebase user.providerData)
 * @returns {Promise<number>} Stato credenziali (AUTHORIZED, REVOKED, NOT_FOUND, TRANSFERRED)
 */
export const getAppleCredentialState = async (appleUserId) => {
  if (Platform.OS !== 'ios') {
    return null;
  }

  try {
    const credentialState = await appleAuth.getCredentialStateForUser(appleUserId);
    
    switch (credentialState) {
      case appleAuth.State.AUTHORIZED:
        console.log('✅ Apple credentials valide');
        return credentialState;
      case appleAuth.State.REVOKED:
        console.warn('⚠️  Apple credentials revocate dall\'utente');
        return credentialState;
      case appleAuth.State.NOT_FOUND:
        console.warn('⚠️  Apple credentials non trovate');
        return credentialState;
      case appleAuth.State.TRANSFERRED:
        console.log('ℹ️  Apple credentials trasferite');
        return credentialState;
      default:
        return credentialState;
    }
  } catch (error) {
    console.error('Errore verifica Apple credentials:', error);
    return null;
  }
};

/**
 * Listener per monitorare cambiamenti nello stato delle credenziali Apple
 * Chiama callback quando l'utente revoca l'accesso da Settings
 * 
 * @param {Function} callback - Funzione chiamata quando lo stato cambia
 * @returns {Function} Funzione per rimuovere il listener
 * 
 * @example
 * const removeListener = onCredentialRevoked((revoked) => {
 *   if (revoked) {
 *     Alert.alert('Accesso Revocato', 'Hai revocato l\'accesso nelle impostazioni Apple.');
 *     // Logout automatico
 *     auth().signOut();
 *   }
 * });
 * 
 * // Cleanup
 * return () => removeListener();
 */
export const onCredentialRevoked = (callback) => {
  if (Platform.OS !== 'ios') {
    return () => {}; // No-op per Android
  }

  try {
    return appleAuth.onCredentialRevoked(async () => {
      console.warn('⚠️  Apple credentials revocate');
      callback(true);
    });
  } catch (error) {
    console.error('Errore setup listener Apple credentials:', error);
    return () => {};
  }
};

/**
 * Configura Apple Sign-In per Android (opzionale, richiede setup server-side)
 * NON IMPLEMENTATO - Richiede Apple Services ID e configurazione server
 * 
 * @param {Object} config - Configurazione per Android
 * @param {string} config.clientId - Apple Services ID
 * @param {string} config.redirectUri - Redirect URI configurato su Apple Developer
 */
export const configureAppleSignInAndroid = (config) => {
  if (Platform.OS !== 'android') {
    return;
  }

  console.warn('⚠️  Apple Sign-In su Android non implementato. Richiede configurazione server-side.');
  // Per implementare:
  // 1. Crea Apple Services ID su Apple Developer
  // 2. Configura Return URLs
  // 3. Usa appleAuthAndroid.configure(config)
  // 4. Implementa appleAuthAndroid.signIn()
};

export default {
  isAppleSignInSupported,
  signInWithApple,
  getAppleCredentialForReauth,
  getAppleCredentialState,
  onCredentialRevoked,
  configureAppleSignInAndroid,
};
