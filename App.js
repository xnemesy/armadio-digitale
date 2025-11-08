import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import AuthScreen from './src/screens/AuthScreen';
import { COLORS } from './src/theme/colors';

const Stack = createNativeStackNavigator();

// Prevent auto-hide splash screen
SplashScreen.preventAutoHideAsync().catch(console.warn);

const App = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Hide splash screen when loading complete
  useEffect(() => {
    const hideSplash = async () => {
      if (!loading) {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.warn('Error hiding splash screen:', error);
        }
      }
    };
    hideSplash();
  }, [loading]);

  useEffect(() => {
    // ❌ AUTH DISABILITATO - Skip diretto alla home con utente mock
    const initApp = async () => {
      try {
        console.log('App inizializzata senza Auth');
        setUser({ uid: 'test-user' }); // Utente mock
        setLoading(false);
      } catch (err) {
        console.error('Errore di inizializzazione:', err);
        setLoading(false);
      }
    };
    initApp();
  }, []);

  if (loading) {
    return (
      <View style={styles.fullScreenCenter}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Caricamento App...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} translucent={false} />
      <NavigationContainer>
        {user ? (
          <MainTabNavigator user={user} />
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
            <Stack.Screen name="Auth" component={AuthScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  fullScreenCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 10, color: COLORS.textPrimary }
});

export default App;
