import React, { useRef, useState, useMemo, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { onboardingSteps } from '../config/onboardingData';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import { useTheme } from '../contexts/ThemeContext';
import PressableScale from '../components/PressableScale';

const Pagination = ({ data, currentIndex, tokens }) => {
  const styles = getStyles(tokens); // Pagination is small, re-creating styles here is acceptable
  return (
    <View style={styles.pagination}>
      {data.map((_, index) => {
        const animatedStyle = useAnimatedStyle(() => {
          const isActive = currentIndex === index;
          return {
            backgroundColor: withTiming(isActive ? tokens.colors.primary : tokens.colors.border, {
              duration: 300,
            }),
            width: withTiming(isActive ? 24 : 8, { duration: 300 }),
          };
        });
        return <Animated.View key={index} style={[styles.dot, animatedStyle]} />;
      })}
    </View>
  );
};

const OnboardingButton = ({ isLastScreen, onPress, tokens }) => {
  const styles = getStyles(tokens); // Same for this small component
  return (
  <PressableScale onPress={onPress}>
    <View style={[styles.nextButton, { backgroundColor: tokens.colors.primary }]}>
      <Text style={[styles.nextButtonText, { color: tokens.colors.textOnPrimary }]}>
        {isLastScreen ? 'Inizia Ora' : 'Avanti'}
      </Text>
    </View>
  </PressableScale>
)};

const OnboardingNavigator = ({ onComplete }) => {
  const { tokens } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete();
  }, [onComplete]);

  const handleNext = useCallback(() => {
    if (currentIndex < onboardingSteps.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    }
  }, [currentIndex, onComplete]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  const isLastScreen = currentIndex === onboardingSteps.length - 1;

  const styles = useMemo(() => getStyles(tokens), [tokens]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]}>
      <StatusBar barStyle={tokens.isDark ? 'light-content' : 'dark-content'} backgroundColor={tokens.colors.background} />
      
      <View style={styles.header}>
        {!isLastScreen && (
           <PressableScale onPress={handleSkip} accessibilityRole="button" accessibilityLabel="Salta l'introduzione">
            <Text style={[styles.skipButton, { color: tokens.colors.textSecondary }]}>Salta</Text>
          </PressableScale>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={onboardingSteps}
        renderItem={({ item, index }) => (
          <OnboardingScreen item={item} itemIndex={index} currentIndex={currentIndex} />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        bounces={false}
      />

      <View style={styles.footer}>
        <Pagination data={onboardingSteps} currentIndex={currentIndex} tokens={tokens} />
        <OnboardingButton isLastScreen={isLastScreen} onPress={handleNext} tokens={tokens} />
      </View>
    </SafeAreaView>
  );
};

// Moved StyleSheet outside and made it a function to pass tokens
const getStyles = (tokens) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 44, // Standard header height
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
  },
  skipButton: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    padding: tokens.spacing.sm, // Increase touchable area
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40, // Adjust as needed for safe area
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    height: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.bold,
  },
});

export default OnboardingNavigator;
