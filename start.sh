#!/bin/bash
# Start both backend and frontend

# Fix for NixOS - need libstdc++ for shapely
export LD_LIBRARY_PATH=/nix/store/22nxhmsfcv2q2rpkmfvzwg2w5z1l231z-gcc-13.3.0-lib/lib:$LD_LIBRARY_PATH

echo "Starting Flask backend on http://localhost:5000..."
source backend/venv/bin/activate
python backend/app.py &
BACKEND_PID=$!

echo "Starting Angular frontend on http://localhost:4200..."
cd frontend && npx ng serve &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID, Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop both"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
