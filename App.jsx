import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { auth, db } from './src/config/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import {
  HomeScreen,
  AuthScreen,
  AddItemScreen,
  DetailScreen,
  OutfitBuilderScreen
} from './src/screens';
import { LoadingOverlay } from './src/components';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('home');
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setViewMode(currentUser ? 'home' : 'auth');
    });

    return () => unsubscribe();
  }, []);

  const renderScreen = () => {
    if (loading) {
      return <LoadingOverlay />;
    }

    if (!user) {
      return <AuthScreen />;
    }

    switch (viewMode) {
      case 'add':
        return <AddItemScreen setViewMode={setViewMode} user={user} />;
      case 'outfit':
        return <OutfitBuilderScreen setViewMode={setViewMode} items={items} />;
      case 'detail':
        return <DetailScreen setViewMode={setViewMode} items={items} />;
      default:
        return <HomeScreen setViewMode={setViewMode} user={user} items={items} />;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {renderScreen()}
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  }
};
