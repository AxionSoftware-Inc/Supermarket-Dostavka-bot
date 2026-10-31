#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================="
echo "🚀 Korzinka Telegram Delivery System"
echo "=========================================="

# Check Python environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r backend/requirements.txt
else
    source venv/bin/activate
fi

# Build frontend if dist doesn't exist
if [ ! -d "frontend/dist" ]; then
    echo "Building frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
fi

echo "Starting Backend API & Telegram Bot..."
export PYTHONPATH=backend
python3 backend/app/main.py
