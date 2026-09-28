#!/bin/sh
# Starts backend and frontend dev servers together, stops both on Ctrl+C.

cd "$(dirname "$0")"

cleanup() {
  echo "Stopping..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
}
trap cleanup EXIT INT TERM

(cd backend && npm run dev) &
BACKEND_PID=$!

(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Backend:  http://localhost:4000"
echo "Frontend: http://localhost:5173"

wait "$BACKEND_PID" "$FRONTEND_PID"
