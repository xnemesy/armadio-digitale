import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput,
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Previeni l'auto-hide dello splash screen
SplashScreen.preventAutoHideAsync().catch(console.warn);

const AuthTestApp = () => {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("🚀 Inizializzazione app senza Firebase...");
        
        // Inizializza senza Firebase per ora
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setLoading(false);
        await SplashScreen.hideAsync();
        console.log("✅ App base caricata!");
        
      } catch (error) {
        console.error("❌ Errore inizializzazione:", error);
        setLoading(false);
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, []);

  const handleFirebaseTest = async () => {
    try {
      console.log("🔥 Tentativo di caricamento Firebase...");
      Alert.alert("Info", "Caricamento Firebase...");
      
      // Importa dinamicamente Firebase solo quando necessario
      const { auth, db, storage, getAuthInstance } = await import('./src/config/firebaseConfig');
      
      console.log("✅ Firebase base caricato:", !!auth, !!db, !!storage);
      
      // Prova a ottenere auth instance
      const authInstance = await getAuthInstance();
      console.log("✅ Auth funzionante:", !!authInstance);
      
      setFirebaseReady(true);
      Alert.alert("Successo", "Firebase caricato correttamente!");
      
    } catch (error) {
      console.error("❌ Errore Firebase:", error);
      Alert.alert("Errore Firebase", error.message);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Errore", "Inserisci email e password");
      return;
    }
    
    if (!firebaseReady) {
      Alert.alert("Test Login", `Email: ${email}\nPassword: ${password}`);
      return;
    }
    
    try {
      console.log("🔐 Tentativo di login Firebase...");
      Alert.alert("Info", "Login in corso...");
      
      const { getAuthInstance } = await import('./src/config/firebaseConfig');
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      
      const authInstance = await getAuthInstance();
      const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
      
      console.log("✅ Login riuscito:", userCredential.user.email);
      Alert.alert("Successo", `Benvenuto ${userCredential.user.email}!`);
      
    } catch (error) {
      console.error("❌ Errore login:", error);
      Alert.alert("Errore Login", error.message);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Errore", "Inserisci email e password");
      return;
    }
    
    if (!firebaseReady) {
      Alert.alert("Errore", "Devi prima testare Firebase");
      return;
    }
    
    try {
      console.log("👤 Tentativo di registrazione Firebase...");
      Alert.alert("Info", "Registrazione in corso...");
      
      const { getAuthInstance } = await import('./src/config/firebaseConfig');
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      
      const authInstance = await getAuthInstance();
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
      
      console.log("✅ Registrazione riuscita:", userCredential.user.email);
      Alert.alert("Successo", `Account creato per ${userCredential.user.email}!`);
      
    } catch (error) {
      console.error("❌ Errore registrazione:", error);
      Alert.alert("Errore Registrazione", error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Caricamento Armadio Digitale...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Armadio Digitale</Text>
      <Text style={styles.subtitle}>Test Autenticazione</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>
          {firebaseReady ? '🔐 Login Firebase' : '🔍 Test Login'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: firebaseReady ? '#059669' : '#9CA3AF' }]} 
        onPress={handleRegister}
        disabled={!firebaseReady}
      >
        <Text style={styles.buttonText}>👤 Registrati</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: firebaseReady ? '#059669' : '#F59E0B' }]} 
        onPress={handleFirebaseTest}
      >
        <Text style={styles.buttonText}>
          {firebaseReady ? '✅ Firebase OK' : '🔥 Test Firebase'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.info}>
        Stato Firebase: {firebaseReady ? 'Connesso' : 'Non testato'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FB',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FB',
  },
  loadingText: {
    marginTop: 10,
    color: '#4F46E5',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  info: {
    marginTop: 20,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default AuthTestApp;