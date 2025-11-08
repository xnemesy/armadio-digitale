import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import AuthScreen from './src/screens/AuthScreen';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { COLORS } from './src/theme/colors';

const Stack = createNativeStackNavigator();

// Prevent auto-hide splash screen
SplashScreen.preventAutoHideAsync().catch(console.warn);

const AppNavigator = () => {
  const { user, initializing } = useAuth();
  const { tokens, isLoading: themeLoading } = useTheme();

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
        <ActivityIndicator size="large" color={tokens.colors.accent} />
        <Text style={[styles.loadingText, { color: tokens.colors.textPrimary }]}>Caricamento...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <MainTabNavigator user={user} />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.colors.background } }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemeStatusBar />
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
};

// Separate component to access theme context for StatusBar
const ThemeStatusBar = () => {
  const { tokens, isDark } = useTheme();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={tokens.colors.background} 
        translucent={false} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  fullScreenCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 10, color: COLORS.textPrimary }
});

export default App;
