import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from './CustomTabBar';
import HomeStackNavigator from './HomeStackNavigator';
import OutfitAIStackNavigator from './OutfitAIStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';
import AddItemScreen from '../screens/AddItemScreen';
import StatsScreen from '../screens/StatsScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = ({ user }) => (
  <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
    <Tab.Screen name="HomeTab" options={{ tabBarLabel: 'Armadio', tabBarAccessibilityLabel: 'Armadio' }}>
      {() => <HomeStackNavigator user={user} />}
    </Tab.Screen>
    <Tab.Screen name="OutfitAITab" options={{ tabBarLabel: 'Outfit AI', tabBarAccessibilityLabel: 'Outfit AI Builder' }}>
      {() => <OutfitAIStackNavigator user={user} />}
    </Tab.Screen>
    <Tab.Screen name="AddItem" component={AddItemScreen} initialParams={{ user }} options={{ tabBarLabel: '', tabBarAccessibilityLabel: 'Aggiungi Capo con Fotocamera' }} />
    <Tab.Screen name="StatsTab" component={StatsScreen} initialParams={{ user }} options={{ tabBarLabel: 'Statistiche', tabBarAccessibilityLabel: 'Statistiche Armadio' }} />
    <Tab.Screen name="ProfileTab" options={{ tabBarLabel: 'Profilo', tabBarAccessibilityLabel: 'Profilo Utente' }}>
      {() => <ProfileStackNavigator user={user} />}
    </Tab.Screen>
  </Tab.Navigator>
);

export default MainTabNavigator;
