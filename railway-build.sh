#!/bin/bash
echo "🚀 Build Railway - LeadMirror"
npm install --omit=dev
npx vite build
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
echo "✅ Build Railway terminé !"
