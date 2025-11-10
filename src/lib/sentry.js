import * as Sentry from '@sentry/react-native';

// Initialize Sentry only if DSN is provided
const SENTRY_DSN = process.env.SENTRY_DSN || null;

export const initializeSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('[Sentry] DSN not configured. Crash reporting disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Enable in production only
    enabled: !__DEV__,
    
    // Set environment
    environment: __DEV__ ? 'development' : 'production',
    
    // Sample rate for performance monitoring (10% of transactions)
    tracesSampleRate: 0.1,
    
    // Enable native crash handling
    enableNative: true,
    enableNativeNagger: false,
    
    // Attach stack trace to all messages
    attachStacktrace: true,
    
    // Set release version (update this with your app version)
    release: 'armadio-digitale@1.0.0',
    
    // Distribution (for build-specific tracking)
    dist: '1',
    
    // Before send hook - Filter sensitive data
    beforeSend: (event, hint) => {
      // Remove user email from breadcrumbs/context if needed
      if (event.user && event.user.email) {
        event.user.email = event.user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
      }
      
      // Filter out specific errors you don't want to track
      const error = hint.originalException;
      if (error && typeof error === 'string') {
        // Ignore network timeout errors
        if (error.includes('Network request failed')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Ignore specific errors
    ignoreErrors: [
      // React Native warnings
      'Non-Error promise rejection captured',
      'Warning: ',
      
      // Network errors (too noisy)
      'Network request failed',
      'Request failed with status code',
      
      // Firebase common errors
      'auth/network-request-failed',
    ],
    
    // Breadcrumbs (track navigation, console logs, etc.)
    maxBreadcrumbs: 50,
    
    // Enable auto session tracking
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000, // 30 seconds
    
    // Integrations
    integrations: [
      new Sentry.ReactNativeTracing({
        // Enable automatic tracing of React Navigation
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        
        // Trace network requests
        tracingOrigins: ['localhost', 'firebasestorage.googleapis.com', 'firestore.googleapis.com'],
      }),
    ],
  });

  console.log('[Sentry] Initialized successfully');
};

// Manually capture exceptions
export const captureException = (error, context = {}) => {
  if (!SENTRY_DSN) return;
  
  Sentry.captureException(error, {
    extra: context,
  });
};

// Manually capture messages
export const captureMessage = (message, level = 'info', context = {}) => {
  if (!SENTRY_DSN) return;
  
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
};

// Set user context (call after login)
export const setUserContext = (user) => {
  if (!SENTRY_DSN) return;
  
  Sentry.setUser({
    id: user.uid,
    email: user.email ? user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : undefined, // Masked
    username: user.displayName || undefined,
  });
};

// Clear user context (call after logout)
export const clearUserContext = () => {
  if (!SENTRY_DSN) return;
  
  Sentry.setUser(null);
};

// Add breadcrumb (track user actions)
export const addBreadcrumb = (category, message, data = {}) => {
  if (!SENTRY_DSN) return;
  
  Sentry.addBreadcrumb({
    category,
    message,
    level: 'info',
    data,
  });
};

// Wrap navigation to track screen views
export const withSentryNavigationTracing = (navigation) => {
  if (!SENTRY_DSN) return navigation;
  
  return Sentry.wrap(navigation);
};

export default Sentry;
