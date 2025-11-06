#!/bin/bash

# NeoApply - Quick Start Script
# This script sets up and starts the entire application

echo "🚀 NeoApply - Starting Application..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and configure your OpenAI API key"
    exit 1
fi

# Check for OpenAI API key
if grep -q "your-openai-api-key-here" .env; then
    echo "⚠️  Warning: Please add your OpenAI API key to .env file"
    echo "OPENAI_API_KEY=sk-your-actual-key-here"
    echo ""
    read -p "Press Enter to continue anyway or Ctrl+C to exit..."
fi

echo "📦 Step 1: Building Docker containers..."
docker-compose build

echo ""
echo "🐳 Step 2: Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for database to be ready..."
sleep 5

echo ""
echo "🗄️  Step 3: Creating database..."
docker-compose exec -T backend rails db:create || echo "Database already exists"

echo ""
echo "📊 Step 4: Running migrations..."
docker-compose exec -T backend rails db:migrate

echo ""
echo "✅ Setup complete!"
echo ""
echo "📍 Services are running at:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend:  http://localhost:3000"
echo "   - Health:   http://localhost:3000/up"
echo ""
echo "🔧 To start the background job worker, run:"
echo "   docker-compose exec backend bundle exec rails solid_queue:start"
echo ""
echo "📝 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose down"
