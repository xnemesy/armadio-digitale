import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import AuthScreen from './src/screens/AuthScreen';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { COLORS } from './src/theme/colors';
import { initializeSentry, setUserContext, clearUserContext } from './src/lib/sentry';
import { initializeAnalytics, setUserId } from './src/lib/analytics';
import ConsentDialog from './src/components/ConsentDialog';

const Stack = createNativeStackNavigator();

// Initialize Sentry at app startup
initializeSentry();

// Prevent auto-hide splash screen
SplashScreen.preventAutoHideAsync().catch(console.warn);

const AppNavigator = () => {
  const { user, initializing } = useAuth();
  const { tokens, isLoading: themeLoading } = useTheme();
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  // Initialize analytics and check consent on app start
  useEffect(() => {
    const setupAnalytics = async () => {
      const { needsConsent } = await initializeAnalytics();
      // Show consent dialog for first-time users (not authenticated yet)
      if (needsConsent && !user) {
        setShowConsentDialog(true);
      }
    };
    setupAnalytics();
  }, [user]);

  // Set Sentry user context and Analytics user ID when user logs in/out
  useEffect(() => {
    if (user) {
      setUserContext(user);
      setUserId(user.uid);
    } else {
      clearUserContext();
      setUserId(null);
    }
  }, [user]);

  // Hide splash screen when loading complete
  useEffect(() => {
    const hideSplash = async () => {
      if (!initializing && !themeLoading) {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.warn('Error hiding splash screen:', error);
        }
      }
    };
    hideSplash();
  }, [initializing, themeLoading]);

  if (initializing || themeLoading) {
    return (
      <View style={[styles.fullScreenCenter, { backgroundColor: tokens.colors.background }]}>
        <StatusBar barStyle={tokens.isDark ? 'light-content' : 'dark-content'} backgroundColor={tokens.colors.background} />
        <ActivityIndicator size="large" color={tokens.colors.accent} />
        <Text style={[styles.loadingText, { color: tokens.colors.textPrimary }]}>Caricamento...</Text>
      </View>
    );
  }

  const handleConsentClose = (consentGiven) => {
    setShowConsentDialog(false);
    // Analytics consent is already saved in ConsentDialog component
  };

  return (
    <NavigationContainer>
      <StatusBar barStyle={tokens.isDark ? 'light-content' : 'dark-content'} backgroundColor={tokens.colors.background} />
      {user ? (
        <MainTabNavigator user={user} />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.colors.background } }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
      )}
      
      {/* Consent Dialog */}
      <ConsentDialog visible={showConsentDialog} onClose={handleConsentClose} />
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  fullScreenCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 10, color: COLORS.textPrimary }
});

export default App;
