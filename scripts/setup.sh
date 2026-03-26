#!/bin/bash

echo "🚀 Setting up Scrappa project (Docker)..."
echo ""

# Frontend .env
if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
  echo "✓ Created frontend/.env"
  echo "  → Please edit frontend/.env and fill in your Supabase credentials"
else
  echo "✓ frontend/.env already exists"
fi

echo ""

# Backend .env
if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "✓ Created backend/.env"
  echo "  → Please edit backend/.env and fill in your Supabase/AWS credentials"
else
  echo "✓ backend/.env already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env files with your API credentials"
echo "  2. docker-compose up --build (First time: build & start containers)"
echo "  3. docker-compose up (Subsequent times: start containers)"
echo ""
echo "Access:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:8000"
echo "  - Backend Docs: http://localhost:8000/docs"
