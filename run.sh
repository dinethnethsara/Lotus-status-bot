#!/bin/bash

# Print banner
echo "====================================="
echo "    WhatsApp Status Bot Launcher     "
echo "====================================="
echo "      Powered by Lotus Mansion       "
echo "====================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed."
    echo "Please install Node.js to run this bot:"
    echo "https://nodejs.org/en/download/ (v16 or higher recommended)"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "⚠️ Warning: Using Node.js v$NODE_VERSION, which is older than recommended (v16+)"
    echo "Some features may not work correctly. Consider upgrading Node.js."
    echo ""
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️ No .env file found, creating from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file from example template"
        echo "⚠️ Please edit the .env file with your own settings!"
    else
        echo "❌ Error: .env.example file not found"
        exit 1
    fi
fi

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ Error installing dependencies. Please check npm logs."
        exit 1
    fi
    
    echo "✅ Dependencies installed successfully"
fi

# Create necessary directories
mkdir -p ./session ./media/status

echo "🚀 Starting WhatsApp Status Bot..."
echo "ℹ️ Scan the QR code with WhatsApp when it appears"
echo ""

# Start the bot with proper error handling
node index.js

# Check if bot crashed
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Bot crashed or encountered an error"
    echo "Check the error message above for details"
    exit 1
fi