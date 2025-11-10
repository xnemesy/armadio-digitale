module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      '@babel/preset-flow', // Add Flow support for React Native
    ],
    plugins: [
      // Removed react-native-dotenv: using Expo extra (app.config.js) + Constants instead
      'react-native-reanimated/plugin',
    ]
  };
};
