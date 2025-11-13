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
import { getTokens } from './src/design/tokens';

// GLOBAL FALLBACK SAFETY
// Some legacy modules (or minified third-party code) appear to reference a global `tokens` object
// very early during runtime initialization (before React providers mount). This caused a
// ReferenceError: Property 'tokens' doesn't exist in release Hermes runtime.
// To prevent a hard crash, we pre-populate a dark-mode default. The ThemeProvider will still supply
// the proper contextual tokens via hooks; this global is only a safety net.
if (typeof global !== 'undefined' && !global.tokens) {
  global.tokens = getTokens('dark');
}
import { initializeSentry, setUserContext, clearUserContext } from './src/lib/sentry';
import { initializeAnalytics, setUserId } from './src/lib/analytics';
import ConsentDialog from './src/components/ConsentDialog';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();
const ONBOARDING_STORAGE_KEY = '@hasCompletedOnboarding';

// Initialize Sentry at app startup
initializeSentry();

// Prevent auto-hide splash screen
SplashScreen.preventAutoHideAsync().catch(console.warn);

const AppNavigator = () => {
  const { user, initializing } = useAuth();
  const { tokens, isLoading: themeLoading } = useTheme();
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const hasCompletedOnboarding = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        setIsFirstLaunch(hasCompletedOnboarding !== 'true');
      } catch (error) {
        // Assume not first launch if storage fails
        setIsFirstLaunch(false);
        console.warn('Error reading onboarding status from AsyncStorage:', error);
      }
    };
    checkOnboardingStatus();
  }, []);

  // Initialize analytics and check consent on app start
  useEffect(() => {
    const setupAnalytics = async () => {
      // Only check for consent if onboarding is done
      if (isFirstLaunch === false) {
        const { needsConsent } = await initializeAnalytics();
        // Show consent dialog for first-time users (not authenticated yet)
        if (needsConsent && !user) {
          setShowConsentDialog(true);
        }
      }
    };
    setupAnalytics();
  }, [user, isFirstLaunch]);

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
      if (!initializing && !themeLoading && isFirstLaunch !== null) {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.warn('Error hiding splash screen:', error);
        }
      }
    };
    hideSplash();
  }, [initializing, themeLoading, isFirstLaunch]);

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setIsFirstLaunch(false);
    } catch (error) {
      console.warn('Error saving onboarding status to AsyncStorage:', error);
      // Still proceed to app even if storage fails
      setIsFirstLaunch(false);
    }
  };

  if (initializing || themeLoading || isFirstLaunch === null) {
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

  if (isFirstLaunch) {
    return <OnboardingNavigator onComplete={handleOnboardingComplete} />;
  }

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
