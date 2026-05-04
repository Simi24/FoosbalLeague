#!/bin/bash
set -e

echo "=== FoosRank - Dev Environment Setup ==="

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

# Symlink host home so Claude Code plugin paths resolve inside the container
# (plugin configs use absolute host paths like /Users/admintemp/.claude/...)
if [ ! -e "/Users/admintemp" ]; then
    sudo mkdir -p /Users/admintemp
    sudo ln -sf /home/vscode/.claude /Users/admintemp/.claude
fi

echo "=== Setup Complete ==="
echo "Run 'just dev' to start the full stack"
