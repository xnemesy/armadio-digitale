import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Previeni l'auto-hide dello splash screen
SplashScreen.preventAutoHideAsync().catch(console.warn);

const SimpleTestApp = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("🚀 Inizializzazione app...");
        
        // Simula caricamento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log("✅ App inizializzata!");
        setLoading(false);
        
        // Nascondi splash screen
        await SplashScreen.hideAsync();
        console.log("✅ Splash screen nascosto!");
        
      } catch (error) {
        console.error("❌ Errore inizializzazione:", error);
        setLoading(false);
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Caricamento App...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 Armadio Digitale Test</Text>
      <Text style={styles.subtitle}>App caricata con successo!</Text>
      <Text style={styles.info}>Se vedi questo messaggio, l'app funziona correttamente.</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#059669',
    marginBottom: 20,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SimpleTestApp;