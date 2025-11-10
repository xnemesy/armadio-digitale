import { registerRootComponent } from 'expo';
import { getTokens } from './src/design/tokens';

// Ensure a safe tokens fallback BEFORE loading any other modules
if (typeof global !== 'undefined' && !global.tokens) {
  try {
    global.tokens = getTokens('dark');
  } catch (e) {
    // In case tokens module has side-effects, fail silently but avoid crash
    global.tokens = global.tokens || {};
  }
}

// Load App AFTER the global fallback to prevent early ReferenceError
// Using require defers module evaluation until after the fallback above
// eslint-disable-next-line @typescript-eslint/no-var-requires
const App = require('./App').default;

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
