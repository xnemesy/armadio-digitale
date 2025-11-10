#!/bin/bash

# Deploy Firebase Security Rules
# Usage: ./scripts/deploy-rules.sh

echo "🔥 Deploying Firebase Security Rules..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Login to Firebase (if not already logged in)
echo "🔐 Checking Firebase authentication..."
firebase login --no-localhost

# Deploy Firestore rules
echo "📝 Deploying Firestore rules..."
firebase deploy --only firestore:rules

# Deploy Storage rules
echo "🗂️  Deploying Storage rules..."
firebase deploy --only storage:rules

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Test rules in Firebase Console Playground"
echo "2. Monitor 'Security rules blocked request' metrics"
echo "3. Test in app with real user authentication"
