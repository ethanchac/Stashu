#!/bin/bash

echo "🚀 Starting Stashu Mobile on iOS..."
echo ""

# Check if backend is running
if ! lsof -ti:3000 > /dev/null; then
    echo "⚠️  Backend is not running!"
    echo "Please start it first: cd ../backend && npm run dev"
    echo ""
    exit 1
fi

echo "✅ Backend is running"
echo "📱 Starting iOS simulator..."
echo ""

npx expo start --ios
