#!/bin/bash

# Build the frontend
cd client
npm run build
cd ..

# Build the backend
npm run build

echo "Build completed successfully!" 