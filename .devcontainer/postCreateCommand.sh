#!/bin/bash
set -e

echo "=== Foosball League - Dev Environment Setup ==="

# Install backend dependencies
echo "Installing backend Python dependencies..."
pip install --no-cache-dir -r backend/requirements.txt

# Install frontend dependencies
echo "Installing frontend Node dependencies..."
cd frontend && yarn install && cd ..

# Make init script executable
chmod +x backend/init-aws.sh

# Install yarn if not available (node feature might run after this)
if ! command -v yarn &> /dev/null; then
    npm install -g yarn
    cd frontend && yarn install && cd ..
fi

echo "Installing Claude Code..."
npm install -g @anthropic-ai/claude-code

echo "=== Setup Complete ==="
echo "Run 'just dev' to start the full stack"
