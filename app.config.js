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
      bundleIdentifier: "com.armadiodigitale.app"
    },
    android: {
      package: "com.armadiodigitale.app",
      targetSdkVersion: 34,
      compileSdkVersion: 34,
      googleServicesFile: "./google-services.json"
    },
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission: "L'app richiede accesso alle foto per selezionare i capi.",
          cameraPermission: "L'app richiede accesso alla fotocamera per fotografare i capi."
        }
      ],
      "@react-native-firebase/app"
    ],
    extra: {
      eas: {
        projectId: "e5ea0f61-c4df-4132-af5b-afe5993d7b33"
      }
    }
  }
};
