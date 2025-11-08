module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      '@babel/preset-flow', // Add Flow support for React Native
    ],
    plugins: [
      ['module:react-native-dotenv'],
      'react-native-reanimated/plugin',
    ]
  };
};
