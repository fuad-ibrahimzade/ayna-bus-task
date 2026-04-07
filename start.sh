#!/bin/bash

# Fix for NixOS - need libstdc++ for shapely
export LD_LIBRARY_PATH=/nix/store/22nxhmsfcv2q2rpkmfvzwg2w5z1l231z-gcc-13.3.0-lib/lib:$LD_LIBRARY_PATH

echo "Building frontend..."
cd frontend && npx ng build && cd ..

echo "Starting server on http://localhost:5000..."
source backend/venv/bin/activate
python backend/app.py
