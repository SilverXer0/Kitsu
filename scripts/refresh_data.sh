#!/usr/bin/env bash
set -euo pipefail

echo "Starting Kitsu refresh workflow..."

echo "Step 1: Refreshing high-value anime data..."
INGEST_MODE=refresh go run backend/cmd/ingester/main.go

echo "Step 2: Regenerating recommendations..."
./.venv/bin/python -m offline.src.main

echo "Refresh workflow complete."