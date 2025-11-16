import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from './CustomTabBar';
import HomeStackNavigator from './HomeStackNavigator';
import OutfitAIStackNavigator from './OutfitAIStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';
import AddItemScreen from '../screens/AddItemScreen';
import StatsScreen from '../screens/StatsScreen';

import { useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const { user } = useAuth();

  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="HomeTab" options={{ tabBarLabel: 'Armadio', tabBarAccessibilityLabel: 'Armadio' }}>
        {() => <HomeStackNavigator />}
      </Tab.Screen>
      <Tab.Screen name="OutfitAITab" options={{ tabBarLabel: 'Outfit AI', tabBarAccessibilityLabel: 'Outfit AI Builder' }}>
        {() => <OutfitAIStackNavigator />}
      </Tab.Screen>
      <Tab.Screen name="AddItem" component={AddItemScreen} options={{ tabBarLabel: '', tabBarAccessibilityLabel: 'Aggiungi Capo con Fotocamera' }} />
      <Tab.Screen name="StatsTab" component={StatsScreen} options={{ tabBarLabel: 'Statistiche', tabBarAccessibilityLabel: 'Statistiche Armadio' }} />
      <Tab.Screen name="ProfileTab" options={{ tabBarLabel: 'Profilo', tabBarAccessibilityLabel: 'Profilo Utente' }}>
        {() => <ProfileStackNavigator />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
