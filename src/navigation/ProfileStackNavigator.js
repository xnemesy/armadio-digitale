import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import { PrivacyPolicyScreen, TermsScreen, FirebaseMonitorScreen } from '../screens';
import { COLORS } from '../theme/colors';

const Stack = createNativeStackNavigator();

const ProfileStackNavigator = ({ user }) => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'default', contentStyle: { backgroundColor: COLORS.background } }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} initialParams={{ user }} />
    <Stack.Screen name="FirebaseMonitor" component={FirebaseMonitorScreen} initialParams={{ user }} />
    <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    <Stack.Screen name="Terms" component={TermsScreen} />
  </Stack.Navigator>
);

export default ProfileStackNavigator;
