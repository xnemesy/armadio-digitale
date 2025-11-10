#!/bin/bash

# Get SHA-1 and SHA-256 fingerprints for Firebase Console
# Usage: ./scripts/get-sha-fingerprints.sh

echo "🔑 Getting Android SHA Fingerprints for Firebase..."
echo ""
echo "═══════════════════════════════════════════════════════"
echo "📱 DEBUG KEYSTORE (for development)"
echo "═══════════════════════════════════════════════════════"
echo ""

# Debug keystore location
DEBUG_KEYSTORE="$HOME/.android/debug.keystore"

if [ -f "$DEBUG_KEYSTORE" ]; then
    echo "Debug keystore found: $DEBUG_KEYSTORE"
    echo ""
    keytool -list -v -keystore "$DEBUG_KEYSTORE" -alias androiddebugkey -storepass android -keypass android 2>/dev/null | grep -A 3 "Certificate fingerprints:"
    echo ""
else
    echo "⚠️  Debug keystore not found at: $DEBUG_KEYSTORE"
    echo "Run the app once to generate it automatically."
    echo ""
fi

echo "═══════════════════════════════════════════════════════"
echo "🔒 RELEASE KEYSTORE (for production)"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check for release keystore in common locations
RELEASE_KEYSTORE_LOCATIONS=(
    "android/app/release.keystore"
    "android/app/armadio-digitale-release.keystore"
    "android/app/debug.keystore"
    "android/app/my-release-key.keystore"
)

RELEASE_FOUND=false

for keystore in "${RELEASE_KEYSTORE_LOCATIONS[@]}"; do
    if [ -f "$keystore" ]; then
        echo "Release keystore found: $keystore"
        echo ""
        echo "⚠️  You need to provide the keystore password and alias."
        echo "Run this command manually:"
        echo ""
        echo "  keytool -list -v -keystore $keystore -alias YOUR_ALIAS"
        echo ""
        RELEASE_FOUND=true
        break
    fi
done

if [ "$RELEASE_FOUND" = false ]; then
    echo "ℹ️  No release keystore found in common locations."
    echo ""
    echo "If you're using EAS Build, get SHA-1 from:"
    echo "  1. eas credentials"
    echo "  2. Select Android → Production"
    echo "  3. View keystore info"
    echo ""
    echo "Or generate a new release keystore:"
    echo ""
    echo "  keytool -genkeypair -v -storetype PKCS12 \\"
    echo "    -keystore android/app/armadio-digitale-release.keystore \\"
    echo "    -alias armadio-digitale \\"
    echo "    -keyalg RSA -keysize 2048 -validity 10000"
    echo ""
fi

echo "═══════════════════════════════════════════════════════"
echo "📋 NEXT STEPS"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "1. Copy the SHA-1 and SHA-256 fingerprints above"
echo "2. Go to Firebase Console:"
echo "   https://console.firebase.google.com/"
echo "3. Select your project: armadiodigitale"
echo "4. Project Settings → General → Your apps → Android app"
echo "5. Click 'Add fingerprint'"
echo "6. Paste SHA-1 (and optionally SHA-256)"
echo "7. Download new google-services.json"
echo "8. Replace android/app/google-services.json"
echo ""
echo "✅ Done!"
echo ""
