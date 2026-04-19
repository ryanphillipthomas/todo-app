#!/bin/bash
# Starts the API and web dev server together.
# Ctrl+C stops both.

trap 'kill 0' EXIT

cd "$(dirname "$0")"

echo "Starting API on :3001..."
npm run api &
API_PID=$!

echo "Starting web on :5173..."
npm run web &
WEB_PID=$!

echo ""
echo "  API  → http://localhost:3001"
echo "  Web  → http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both."

wait
