#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
CHECK_SCRIPT="$ROOT_DIR/scripts/check_firebase.js"

# Check Xcode installation
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode non trovato. Installalo dall'App Store."
    exit 1
fi

# Set correct Xcode path
sudo xcode-select --switch /Applications/Xcode.app

echo "1/6 - Pulizia e reinstallazione dipendenze..."
rm -rf node_modules
rm -f package-lock.json
npm install --legacy-peer-deps

# Tentativo di risolvere automaticamente vulnerabilità note
echo "Eseguo npm audit fix (tentativo automatico)..."
npm audit fix || true

# Install CocoaPods (robusto: preferisce brew, altrimenti gem; fornisce istruzioni su errori di permessi)
echo "2/6 - Installo CocoaPods..."
if command -v pod >/dev/null 2>&1; then
  echo "✔ CocoaPods già installato."
else
  if command -v brew >/dev/null 2>&1; then
    echo "✔ Homebrew trovato: provo ad installare CocoaPods via brew..."
    if ! brew install cocoapods; then
      echo "Errore: 'brew install cocoapods' è fallito. Verifica la tua installazione Homebrew."
      exit 1
    fi
  else
    echo "Homebrew non trovato. Provo ad installare CocoaPods via RubyGems (gem)..."
    if gem install cocoapods; then
      echo "✔ CocoaPods installato via gem."
    else
      echo "✖ Installazione via gem fallita (probabilmente permessi insufficienti)."
      echo ""
      echo "Opzioni per risolvere:"
      echo "  1) Esegui (richiede password):"
      echo "       sudo gem install cocoapods"
      echo "     oppure (più sicuro su macOS Catalina+):"
      echo "       sudo gem install -n /usr/local/bin cocoapods"
      echo ""
      echo "  2) Installa Homebrew e poi:"
      echo "       /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
      echo "       brew install cocoapods"
      echo ""
      echo "Dopo aver installato CocoaPods, riesegui lo script."
      exit 1
    fi
  fi
fi

echo "3/6 - Eseguo expo doctor..."
npx expo-doctor

echo "4/6 - Verifica configurazione expo..."
npx expo config --type prebuild

echo "5/6 - Verifica file Firebase nativi..."
if ! node "$CHECK_SCRIPT"; then
    echo "Errore: verifica Firebase fallita. Sostituisci i file placeholder e riprova."
    exit 1
fi

# Install iOS dependencies
if [ -d "ios" ]; then
    echo "Installazione dipendenze iOS..."
    cd ios
    pod install
    cd ..
fi

echo "6/6 - Avvio build EAS (Android, profile: production)"
echo "Nota: assicurati di aver effettuato login con 'eas login' e di avere eas-cli installato."
eas build -p android --profile production --non-interactive --clear-cache

echo "Build lanciata. Controlla il log EAS o la dashboard per lo stato della build."
