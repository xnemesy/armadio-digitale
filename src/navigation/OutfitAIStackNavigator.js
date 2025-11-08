import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OutfitBuilderScreen from '../screens/OutfitBuilderScreen';
import { COLORS } from '../theme/colors';

const Stack = createNativeStackNavigator();

const OutfitAIStackNavigator = ({ user }) => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'default', contentStyle: { backgroundColor: COLORS.background } }}>
    <Stack.Screen name="OutfitBuilderMain" component={OutfitBuilderScreen} initialParams={{ user }} />
  </Stack.Navigator>
);

export default OutfitAIStackNavigator;
