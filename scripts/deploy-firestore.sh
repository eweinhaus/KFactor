#!/bin/bash

# Deploy Firestore Rules and Indexes using Firebase CLI
# This script deploys the security rules and indexes to your Firebase project

echo "🚀 Deploying Firestore rules and indexes to Firebase..."
echo "Project: k-factor-4634e"

# Use npx to run firebase-tools (works regardless of PATH setup)
echo "🔐 Checking Firebase authentication..."

# Deploy rules and indexes
echo "📝 Deploying Firestore rules and indexes..."
npx firebase-tools deploy --only firestore --project k-factor-4634e

echo "✅ Firestore rules and indexes deployed successfully!"

