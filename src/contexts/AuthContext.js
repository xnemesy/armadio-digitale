import React, { createContext, useState, useEffect, useContext } from 'react';
import auth from '@react-native-firebase/auth';
import { Alert } from 'react-native';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

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
      await auth().signOut();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: 'Errore durante il logout' };
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
  const resendEmailVerification = async () => {
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

  const value = {
    user,
    loading,
    initializing,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
    resendEmailVerification,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
