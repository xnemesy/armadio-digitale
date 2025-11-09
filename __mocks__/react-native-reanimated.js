module.exports = {
  default: {
    // allow .call usage in legacy mocks
    call: () => {},
  },
  createAnimatedComponent: (Component) => Component,
  useSharedValue: (initialValue) => ({ value: initialValue }),
  useAnimatedStyle: () => ({}),
  withSpring: (value) => value,
  FadeIn: { duration: () => {} },
  FadeOut: { duration: () => {} },
};
