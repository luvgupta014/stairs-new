#!/bin/bash
# Development setup script for STAIRS Talent Hub Backend

echo "🚀 Setting up STAIRS Talent Hub Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your specific configuration!"
else
    echo "✅ .env file already exists"
fi

# Display next steps
echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit the .env file with your configuration"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:5000 to test the API"
echo ""
echo "Available commands:"
echo "- npm run dev   : Start development server with auto-reload"
echo "- npm start     : Start production server"
echo "- npm test      : Run tests (once implemented)"
echo ""