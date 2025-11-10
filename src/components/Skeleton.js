import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useThemeTokens } from '../design/tokens';

const SkeletonContainer = ({ width = '100%', height = 16, borderRadius, style }) => {
  const t = useThemeTokens();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, {
        duration: t.durations.slow * 3,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [shimmer, t.durations.slow]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + shimmer.value * 0.35,
  }));

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: borderRadius ?? t.radii.md,
          backgroundColor: t.colors.surfaceLight,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: t.colors.surface },
          animatedStyle,
        ]}
      />
    </View>
  );
};

export const SkeletonBlock = SkeletonContainer;

export const SkeletonCircle = ({ size = 40, style }) => (
  <SkeletonContainer width={size} height={size} borderRadius={size / 2} style={style} />
);

export default SkeletonContainer;
