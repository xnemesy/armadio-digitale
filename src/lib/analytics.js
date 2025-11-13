import analytics, {
  setAnalyticsCollectionEnabled,
  logScreenView as rnLogScreenView,
  logEvent as rnLogEvent,
  setUserProperty as rnSetUserProperty,
  setUserId as rnSetUserId,
} from '@react-native-firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_CONSENT_KEY = '@analytics_consent';

// Initialize analytics consent state
let analyticsEnabled = false;
const analyticsInstance = analytics();

export const initializeAnalytics = async () => {
  try {
    const consent = await AsyncStorage.getItem(ANALYTICS_CONSENT_KEY);

    if (consent === null) {
      // First time user - show consent dialog
      return { needsConsent: true, enabled: false };
    }

    analyticsEnabled = consent === 'true';
    await setAnalyticsCollectionEnabled(analyticsInstance, analyticsEnabled);

    console.log(`[Analytics] Initialized - Enabled: ${analyticsEnabled}`);
    return { needsConsent: false, enabled: analyticsEnabled };
  } catch (error) {
    console.error('[Analytics] Initialization error:', error);
    return { needsConsent: false, enabled: false };
  }
};

// Save user consent
export const setAnalyticsConsent = async (enabled) => {
  try {
    await AsyncStorage.setItem(ANALYTICS_CONSENT_KEY, enabled.toString());
    analyticsEnabled = enabled;
    await setAnalyticsCollectionEnabled(analyticsInstance, enabled);

    console.log(`[Analytics] Consent saved - Enabled: ${enabled}`);
    return { success: true };
  } catch (error) {
    console.error('[Analytics] Error saving consent:', error);
    return { success: false, error: error.message };
  }
};

// Get current consent status
export const getAnalyticsConsent = async () => {
  try {
    const consent = await AsyncStorage.getItem(ANALYTICS_CONSENT_KEY);
    return consent === 'true';
  } catch (error) {
    console.error('[Analytics] Error getting consent:', error);
    return false;
  }
};

// Log screen view
export const logScreenView = async (screenName, screenClass) => {
  if (!analyticsEnabled) return;

  try {
    await rnLogScreenView(analyticsInstance, {
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  } catch (error) {
    console.error('[Analytics] Error logging screen view:', error);
  }
};

// Log custom event
export const logEvent = async (eventName, params = {}) => {
  if (!analyticsEnabled) return;

  try {
    await rnLogEvent(analyticsInstance, eventName, params);
  } catch (error) {
    console.error(`[Analytics] Error logging event ${eventName}:`, error);
  }
};

// Pre-defined events for common actions
export const AnalyticsEvents = {
  // User actions
  ITEM_ADDED: 'item_added',
  ITEM_DELETED: 'item_deleted',
  ITEM_UPDATED: 'item_updated',
  
  // Outfit actions
  OUTFIT_CREATED: 'outfit_created',
  OUTFIT_AI_GENERATED: 'outfit_ai_generated',
  
  // Search & Filter
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  SORT_CHANGED: 'sort_changed',
  
  // AI features
  AI_IMAGE_ANALYZED: 'ai_image_analyzed',
  AI_SHOPPING_SUGGESTIONS: 'ai_shopping_suggestions',
  
  // Navigation
  SCREEN_VIEW: 'screen_view',
  TAB_CHANGED: 'tab_changed',
  
  // Settings
  THEME_CHANGED: 'theme_changed',
  LANGUAGE_CHANGED: 'language_changed',
  
  // Account
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  LOGOUT: 'logout',
  ACCOUNT_DELETED: 'account_deleted',
  
  // Errors
  ERROR_OCCURRED: 'error_occurred',
};

// Convenience methods for common events
export const logItemAdded = (category, hasAI = false) => {
  logEvent(AnalyticsEvents.ITEM_ADDED, {
    category,
    used_ai: hasAI,
  });
};

export const logItemDeleted = (category) => {
  logEvent(AnalyticsEvents.ITEM_DELETED, { category });
};

export const logOutfitGenerated = (itemCount, method = 'manual') => {
  logEvent(AnalyticsEvents.OUTFIT_CREATED, {
    item_count: itemCount,
    method, // 'manual' or 'ai'
  });
};

export const logSearchPerformed = (query, resultsCount) => {
  logEvent(AnalyticsEvents.SEARCH_PERFORMED, {
    search_term: query.substring(0, 50), // Limit length
    results_count: resultsCount,
  });
};

export const logFilterApplied = (filterType, filterValue) => {
  logEvent(AnalyticsEvents.FILTER_APPLIED, {
    filter_type: filterType,
    filter_value: filterValue,
  });
};

export const logAIFeatureUsed = (feature, success = true) => {
  logEvent(AnalyticsEvents.AI_IMAGE_ANALYZED, {
    feature,
    success,
  });
};

export const logThemeChanged = (theme) => {
  logEvent(AnalyticsEvents.THEME_CHANGED, { theme });
};

export const logError = (errorType, errorMessage) => {
  logEvent(AnalyticsEvents.ERROR_OCCURRED, {
    error_type: errorType,
    error_message: errorMessage.substring(0, 100), // Limit length
  });
};

// Set user properties (demographics, preferences)
export const setUserProperty = async (name, value) => {
  if (!analyticsEnabled) return;

  try {
    await rnSetUserProperty(analyticsInstance, name, value);
  } catch (error) {
    console.error(`[Analytics] Error setting user property ${name}:`, error);
  }
};

// Set user ID (call after login)
export const setUserId = async (userId) => {
  if (!analyticsEnabled) return;

  try {
    // Hash or anonymize user ID for privacy
    const anonymousId = userId.substring(0, 8); // Use only first 8 chars
    await rnSetUserId(analyticsInstance, anonymousId);
  } catch (error) {
    console.error('[Analytics] Error setting user ID:', error);
  }
};

export default analytics;
