# Gemini Project Context: Armadio Digitale

This document provides context for the Gemini agent to understand the "Armadio Digitale" project.

## Project Overview

"Armadio Digitale" is a React Native mobile application for managing a digital wardrobe. It uses a hybrid AI approach for analyzing clothes: on-device for fast categorization and cloud-based for detailed analysis. The backend is built on Firebase.

## Key Technologies

*   **Framework**: React Native with Expo (SDK 54)
*   **Backend**: Firebase (Firestore, Storage, Auth, Analytics)
*   **AI**:
    *   **On-device**: ExecuTorch with MobileNetV3 for clothing categorization.
    *   **Cloud**: Gemini 2.0 Flash Exp via Cloud Functions for detailed metadata extraction.
*   **Navigation**: React Navigation (v6)
*   **State Management**: React Hooks and Context API, with AsyncStorage for persistence.
*   **Animations**: React Native Reanimated
*   **Styling**: A mix of a legacy `colors.js` file and a new design token system (`tokens.js`).
*   **Code Quality**: ESLint and Prettier.
*   **Testing**: Jest with React Native Testing Library.

## Project Structure

The project is well-structured with a clear separation of concerns:

*   `src/screens`: Contains the main screens of the application.
*   `src/components`: Contains reusable UI components.
*   `src/navigation`: Defines the navigation structure of the app.
*   `src/lib`: Contains utility functions, including AI-related logic.
*   `src/ml`: Contains the on-device machine learning client.
*   `src/contexts`: Contains React context providers for Auth and Theme.
*   `src/theme` & `src/design`: Contain styling and design tokens.
*   `docs/`: Contains detailed project documentation.
*   `firebase/`: Firebase configuration.
*   `functions/`: Firebase cloud functions.

## How to Run the App

The project uses Expo's dev client.

To run on Android:
```bash
npx expo run:android
```

To run on iOS:
```bash
npm run ios:community
```

## How to Run Tests

To run all tests:
```bash
npm test
```

To run tests in watch mode:
```bash
npm run test:watch
```

## Code Quality

To lint the code:
```bash
npm run lint
```

To fix linting errors:
```bash:
npm run lint:fix
```

To format the code:
```bash
npm run format
```
