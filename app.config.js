import 'dotenv/config';

export default {
  expo: {
    name: "Armadio Digitale",
    slug: "armadio-digitale",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.armadiodigitale.app",
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.armadiodigitale.app",
      targetSdkVersion: 34,
      compileSdkVersion: 34,
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission: "L'app richiede accesso alle foto per selezionare i capi.",
          cameraPermission: "L'app richiede accesso alla fotocamera per fotografare i capi."
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "e5ea0f61-c4df-4132-af5b-afe5993d7b33"
      },
      EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
      EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY
    }
  }
};
