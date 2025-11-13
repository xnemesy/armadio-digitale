import React, { createContext, useState, useEffect, useContext } from 'react';
import auth from '@react-native-firebase/auth';
import firestore, { collection, getDocs } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { Alert, Platform } from 'react-native';
import { APP_ID } from '../config/appConfig';
import { signInWithGoogle as googleSignIn, signOutFromGoogle, configureGoogleSignIn } from '../lib/googleAuth';
import { signInWithApple as appleSignIn, isAppleSignInSupported } from '../lib/appleAuth';
import Constants from 'expo-constants';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Configure Google Sign-In on mount
  useEffect(() => {
    const webClientId = Constants.expoConfig?.extra?.googleWebClientId;
    if (webClientId) {
      configureGoogleSignIn(webClientId);
    } else {
      console.warn('⚠️  Google Web Client ID non configurato in app.config.js');
    }
  }, []);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((userState) => {
      setUser(userState);
      if (initializing) setInitializing(false);
      setLoading(false);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, [initializing]);

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Sign in error:', error);
      let message = 'Errore durante il login';
      
      switch (error.code) {
        case 'auth/invalid-email':
          message = 'Email non valida';
          break;
        case 'auth/user-disabled':
          message = 'Utente disabilitato';
          break;
        case 'auth/user-not-found':
          message = 'Utente non trovato';
          break;
        case 'auth/wrong-password':
          message = 'Password errata';
          break;
        case 'auth/invalid-credential':
          message = 'Credenziali non valide';
          break;
        case 'auth/too-many-requests':
          message = 'Troppi tentativi. Riprova più tardi';
          break;
      }
      
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email, password) => {
    try {
      setLoading(true);
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      
      // Send email verification
      await userCredential.user.sendEmailVerification();
      
      return { 
        success: true, 
        user: userCredential.user,
        message: 'Account creato! Controlla la tua email per verificare l\'account.'
      };
    } catch (error) {
      console.error('Sign up error:', error);
      let message = 'Errore durante la registrazione';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'Email già registrata';
          break;
        case 'auth/invalid-email':
          message = 'Email non valida';
          break;
        case 'auth/operation-not-allowed':
          message = 'Operazione non consentita';
          break;
        case 'auth/weak-password':
          message = 'Password troppo debole (minimo 6 caratteri)';
          break;
      }
      
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      
      // Sign out da Google se necessario
      await signOutFromGoogle();
      
      // Sign out da Firebase
      await auth().signOut();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: 'Errore durante il logout' };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await googleSignIn();
      return { success: true };
    } catch (error).
      console.error('Google sign in error:', error);
      return { success: false, error: error.message || 'Errore durante il login con Google' };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Apple
  const signInWithApple = async () => {
    try {
      setLoading(true);
      
      // Verifica supporto
      const isSupported = await isAppleSignInSupported();
      if (!isSupported) {
        return { 
          success: false, 
          error: Platform.OS === 'ios' 
            ? 'Apple Sign-In richiede iOS 13 o superiore'
            : 'Apple Sign-In è disponibile solo su iOS'
        };
      }
      
      await appleSignIn();
      return { success: true };
    } catch (error) {
      console.error('Apple sign in error:', error);
      return { success: false, error: error.message || 'Errore durante il login con Apple' };
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      await auth().sendPasswordResetEmail(email);
      return { 
        success: true, 
        message: 'Email di reset inviata. Controlla la tua casella di posta.' 
      };
    } catch (error) {
      console.error('Reset password error:', error);
      let message = 'Errore durante il reset della password';
      
      switch (error.code) {
        case 'auth/invalid-email':
          message = 'Email non valida';
          break;
        case 'auth/user-not-found':
          message = 'Utente non trovato';
          break;
      }
      
      return { success: false, error: message };
    }
  };

  // Update user profile
  const updateUserProfile = async (displayName, photoURL) => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return { success: false, error: 'Nessun utente connesso' };
      }

      await currentUser.updateProfile({
        displayName: displayName || currentUser.displayName,
        photoURL: photoURL || currentUser.photoURL,
      });

      // Update local user state
      setUser({ ...currentUser, displayName, photoURL });
      
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Errore durante l\'aggiornamento del profilo' };
    }
  };

  // Resend email verification
  const resendEmailVerification = async ().
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return { success: false, error: 'Nessun utente connesso' };
      }

      await currentUser.sendEmailVerification();
      return { 
        success: true, 
        message: 'Email di verifica inviata. Controlla la tua casella di posta.' 
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { success: false, error: 'Errore durante l\'invio dell\'email di verifica' };
    }
  };

  // Delete account with all user data (GDPR compliance)
  const deleteAccount = async () => {
    try {
      setLoading(true);
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return { success: false, error: 'Nessun utente connesso' };
      }

      const userId = currentUser.uid;
      const userPath = `artifacts/${APP_ID}/users/${userId}`;
      const itemsPath = `${userPath}/items`;

      // Step 1: Delete all user items from Firestore
      const itemsCollection = collection(firestore(), itemsPath);
      const itemsSnapshot = await getDocs(itemsCollection);
      const deletePromises = [];

      // Delete each item and its associated images
      for (const doc of itemsSnapshot.docs) {
        const itemData = doc.data();
        
        // Delete images from Storage
        if (itemData.thumbnailUrl) {
          try {
            const thumbnailRef = storage().refFromURL(itemData.thumbnailUrl);
            deletePromises.push(thumbnailRef.delete().catch(console.error));
          } catch (error) {
            console.error('Error deleting thumbnail:', error);
          }
        }
        
        if (itemData.imageUrls && Array.isArray(itemData.imageUrls)) {
          for (const imageUrl of itemData.imageUrls) {
            try {
              const imageRef = storage().refFromURL(imageUrl);
              deletePromises.push(imageRef.delete().catch(console.error));
            } catch (error) {
              console.error('Error deleting image:', error);
            }
          }
        }

        // Delete Firestore document
        deletePromises.push(doc.ref.delete());
      }

      // Wait for all deletions to complete
      await Promise.all(deletePromises);

      // Step 2: Delete user metadata document if exists
      try {
        await firestore().doc(userPath).delete();
      } catch (error) {
        console.error('Error deleting user metadata:', error);
      }

      // Step 3: Delete Firebase Auth account
      await currentUser.delete();

      return { 
        success: true, 
        message: 'Account eliminato con successo' 
      };
    } catch (error) {
      console.error('Delete account error:', error);
      let message = 'Errore durante l\'eliminazione dell\'account';
      
      switch (error.code) {
        case 'auth/requires-recent-login':
          message = 'Per sicurezza, devi effettuare nuovamente il login prima di eliminare l\'account';
          break;
        case 'auth/network-request-failed':
          message = 'Errore di rete. Controlla la connessione';
          break;
      }
      
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    initializing,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithApple,
    resetPassword,
    updateUserProfile,
    resendEmailVerification,
    deleteAccount,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</Auth.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
