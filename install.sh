#!/bin/bash

# Print banner
echo "====================================="
echo "  WhatsApp Status Bot Installation   "
echo "====================================="
echo "      Powered by Lotus Mansion       "
echo "====================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed."
    echo "Please install Node.js before running this script:"
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

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error installing dependencies. Please check npm logs."
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create necessary directories
mkdir -p ./session ./media/status
echo "✅ Created required directories"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file from example template"
    else
        echo "❌ Error: .env.example file not found"
        exit 1
    fi
fi

# Make run script executable
chmod +x run.sh
echo "✅ Made run script executable"

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit the .env file with your WhatsApp number and preferences"
echo "2. Run the bot with ./run.sh or npm start"
echo "3. Scan the QR code with your WhatsApp when prompted"
echo ""
echo "📚 Documentation available in README.md"
echo ""