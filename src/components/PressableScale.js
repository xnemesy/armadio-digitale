import React from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

/**
 * PressableScale - Pressable wrapper with scale animation on press
 * 
 * Usage:
 *   <PressableScale onPress={handlePress}>
 *     <YourComponent />
 *   </PressableScale>
 * 
 * Props:
 *   - onPress: Function called on press
 *   - children: React nodes to render
 *   - style: Additional styles (optional)
 *   - activeScale: Scale factor when pressed (default: 0.95)
 *   - springConfig: Reanimated spring config (optional)
 *   - disabled: Disable press (default: false)
 */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PressableScale = ({
  children,
  onPress,
  style,
  activeScale = 0.95,
  springConfig = { damping: 15, stiffness: 300 },
  disabled = false,
  ...pressableProps
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(activeScale, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, style]}
      {...pressableProps}
    >
      {children}
    </AnimatedPressable>
  );
};

export default PressableScale;
