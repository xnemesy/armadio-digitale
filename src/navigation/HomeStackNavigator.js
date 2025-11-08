import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import DetailScreen from '../screens/DetailScreen';
import { COLORS } from '../theme/colors';

const Stack = createNativeStackNavigator();

const HomeStackNavigator = ({ user }) => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'default', contentStyle: { backgroundColor: COLORS.background } }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} initialParams={{ user }} />
    <Stack.Screen name="Detail" component={DetailScreen} />
  </Stack.Navigator>
);

export default HomeStackNavigator;
