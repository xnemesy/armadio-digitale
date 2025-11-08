import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Home, Zap, Camera, User, BarChart3 } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.sideContainer}>
          {state.routes.slice(0, 2).map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel;
            const isFocused = state.index === index;
            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };
            const Icon = route.name === 'HomeTab' ? Home : Zap;
            const iconColor = isFocused ? COLORS.navActive : COLORS.navInactive;
            return (
              <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabButton} activeOpacity={0.7}>
                <Icon size={24} color={iconColor} strokeWidth={isFocused ? 2.5 : 2} />
                <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.centerSpacer} />
        <View style={styles.sideContainer}>
          {state.routes.slice(3, 5).map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel;
            const isFocused = state.index === index + 3;
            const onPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };
            const Icon = route.name === 'StatsTab' ? BarChart3 : User;
            const iconColor = isFocused ? COLORS.navActive : COLORS.navInactive;
            return (
              <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabButton} activeOpacity={0.7}>
                <Icon size={24} color={iconColor} strokeWidth={isFocused ? 2.5 : 2} />
                <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <TouchableOpacity onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate('AddItem');
      }} style={styles.floatingButton} activeOpacity={0.8}>
        <View style={styles.floatingButtonInner}>
          <Camera size={32} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, paddingBottom: Platform.OS === 'ios' ? 20 : 10 },
  container: { flex: 1, backgroundColor: COLORS.navBackground, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderTopColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 15 },
  sideContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  centerSpacer: { width: 80 },
  tabButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 12 },
  label: { fontSize: 11, fontWeight: '500', color: COLORS.navInactive, marginTop: 4 },
  labelActive: { color: COLORS.navActive, fontWeight: '600' },
  floatingButton: { position: 'absolute', bottom: Platform.OS === 'ios' ? 40 : 30, left: '50%', marginLeft: -36, width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 16, elevation: 20, justifyContent: 'center', alignItems: 'center' },
  floatingButtonInner: { width: '100%', height: '100%', borderRadius: 36, borderWidth: 4, borderColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }
});

export default CustomTabBar;
