#!/bin/bash
# Build the frontend and copy to Spring Boot static folder

set -e

echo "Building UniEventClient frontend..."
cd ../UniEventClient/web

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm ci
fi

# Build the frontend
npm run build

# Copy built files to backend static folder
echo "Copying frontend build to backend static folder..."
mkdir -p ../../UniEventServer/src/main/resources/static
rm -rf ../../UniEventServer/src/main/resources/static/*
cp -r dist/* ../../UniEventServer/src/main/resources/static/

echo "Frontend build complete and copied to backend!"
