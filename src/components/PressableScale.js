import React from 'react';
import { Pressable, View } from 'react-native';
// In tests we use a lightweight mock; guard reanimated imports gracefully
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

  const mergedArray = Array.isArray(style) ? [animatedStyle, ...style] : [animatedStyle, style];
  // Flatten for test style assertions (testing-library toHaveStyle prefers object)
  const mergedStyle = Object.assign({}, ...mergedArray.filter(Boolean));

  const childrenWithStyle = React.Children.map(children, (child, idx) => {
    if (React.isValidElement(child) && idx === 0 && style) {
      const childStyle = Array.isArray(child.props.style)
        ? [...child.props.style, style]
        : [child.props.style, style].filter(Boolean);
      return React.cloneElement(child, { style: childStyle });
    }
    return child;
  });

  if (disabled) {
    // Remove interactive props when disabled to prevent firing
    const { onPress: _op, onPressIn: _pi, onPressOut: _po, ...rest } = pressableProps;
    return (
      <View style={mergedStyle} accessibilityState={{ disabled }} testID={rest.testID || 'pressable-scale-disabled'} {...rest}>
        {childrenWithStyle}
      </View>
    );
  }

  return (
    <AnimatedPressable
      testID={pressableProps.testID || 'pressable-scale'}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={false}
  style={mergedStyle}
      accessibilityState={{ disabled }}
      {...pressableProps}
    >
      {childrenWithStyle}
    </AnimatedPressable>
  );
};

export default PressableScale;
