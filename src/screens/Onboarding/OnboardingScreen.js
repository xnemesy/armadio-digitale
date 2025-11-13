import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

const OnboardingScreen = ({ item, currentIndex, itemIndex }) => {
  const { width } = useWindowDimensions();
  const { tokens } = useTheme();

  const isActive = currentIndex === itemIndex;

  // Animation values
  const iconScale = useSharedValue(0.5);
  const iconOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      iconScale.value = withDelay(100, withTiming(1, { duration: 400 }));
      iconOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
      textTranslateY.value = withDelay(300, withTiming(0, { duration: 500 }));
      textOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    } else {
      // Reset values when screen is not active
      iconScale.value = 0.5;
      iconOpacity.value = 0;
      textTranslateY.value = 30;
      textOpacity.value = 0;
    }
  }, [isActive]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing.xl,
      width: width,
    },
    content: {
      alignItems: 'center',
      maxWidth: 400,
    },
    icon: {
      fontSize: 80,
      marginBottom: tokens.spacing.xxl,
    },
    title: {
      fontSize: tokens.typography.sizes.xxl,
      fontWeight: tokens.typography.weights.bold,
      textAlign: 'center',
      marginBottom: tokens.spacing.lg,
      color: tokens.colors.textPrimary,
    },
    description: {
      fontSize: tokens.typography.sizes.md,
      textAlign: 'center',
      lineHeight: tokens.typography.sizes.md * 1.5,
      color: tokens.colors.textSecondary,
    },
  }), [tokens, width]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.Text style={[styles.icon, iconAnimatedStyle]}>{item.icon}</Animated.Text>
        <Animated.View style={textAnimatedStyle}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    </View>
  );
};

export default OnboardingScreen;
