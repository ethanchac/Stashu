#!/bin/bash

echo "🚀 Stashu Mobile Setup Script"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created!"
    echo "⚠️  Please edit .env and add your Firebase credentials"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully!"
    else
        echo "❌ Failed to install dependencies"
        echo "💡 Try running: npm install --legacy-peer-deps"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Firebase credentials"
echo "2. Make sure backend is running: cd ../backend && npm run dev"
echo "3. Start the app: npm start"
echo ""
echo "For detailed instructions, see MOBILE_SETUP.md"
