#!/bin/bash
# Helper script to set up .env.local file
# Usage: ./scripts/setup-env.sh [path-to-service-account.json]

if [ -z "$1" ]; then
  echo "Usage: ./scripts/setup-env.sh [path-to-service-account.json]"
  echo ""
  echo "Example: ./scripts/setup-env.sh ~/Downloads/k-factor-4634e-firebase-adminsdk-fbsvc-b0db789bb6.json"
  exit 1
fi

SERVICE_ACCOUNT_FILE="$1"

if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
  echo "Error: Service account file not found: $SERVICE_ACCOUNT_FILE"
  exit 1
fi

# Convert JSON to single-line string
SERVICE_ACCOUNT_KEY=$(cat "$SERVICE_ACCOUNT_FILE" | jq -c . 2>/dev/null || cat "$SERVICE_ACCOUNT_FILE" | python3 -c "import json, sys; print(json.dumps(json.load(sys.stdin)))")

if [ -z "$SERVICE_ACCOUNT_KEY" ]; then
  echo "Error: Failed to convert service account JSON to single-line string"
  echo "Make sure jq or python3 is installed"
  exit 1
fi

# Create .env.local from .env.example if it doesn't exist
if [ ! -f ".env.local" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env.local
    echo "Created .env.local from .env.example"
  else
    echo "Error: .env.example not found"
    exit 1
  fi
fi

# Extract project info from service account
PROJECT_ID=$(echo "$SERVICE_ACCOUNT_KEY" | jq -r '.project_id' 2>/dev/null || echo "")

if [ -n "$PROJECT_ID" ]; then
  echo "Detected project ID: $PROJECT_ID"
  echo ""
  echo "Next steps:"
  echo "1. Get Firebase client config from Firebase Console"
  echo "2. Fill in NEXT_PUBLIC_* values in .env.local"
  echo "3. The FIREBASE_SERVICE_ACCOUNT_KEY has been set below"
  echo ""
fi

# Update .env.local with service account key
# Check if FIREBASE_SERVICE_ACCOUNT_KEY already exists
if grep -q "FIREBASE_SERVICE_ACCOUNT_KEY=" .env.local; then
  # Update existing line (works on macOS and Linux)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|FIREBASE_SERVICE_ACCOUNT_KEY=.*|FIREBASE_SERVICE_ACCOUNT_KEY=$SERVICE_ACCOUNT_KEY|" .env.local
  else
    # Linux
    sed -i "s|FIREBASE_SERVICE_ACCOUNT_KEY=.*|FIREBASE_SERVICE_ACCOUNT_KEY=$SERVICE_ACCOUNT_KEY|" .env.local
  fi
  echo "Updated FIREBASE_SERVICE_ACCOUNT_KEY in .env.local"
else
  # Append if not found
  echo "" >> .env.local
  echo "FIREBASE_SERVICE_ACCOUNT_KEY=$SERVICE_ACCOUNT_KEY" >> .env.local
  echo "Added FIREBASE_SERVICE_ACCOUNT_KEY to .env.local"
fi

echo ""
echo "✅ Service account key configured in .env.local"
echo "⚠️  Remember to add Firebase client config values (NEXT_PUBLIC_*) from Firebase Console"

