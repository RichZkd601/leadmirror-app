#!/bin/bash

set -e  # Arrêter le script en cas d'erreur

echo "🚀 Build Railway - LeadMirror"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé. Assurez-vous d'être dans le bon répertoire."
    exit 1
fi

# Nettoyer le cache npm au début
echo "🧹 Nettoyage du cache npm..."
npm cache clean --force || true

# Installation des dépendances avec fallback robuste
echo "📦 Installation des dépendances..."
if ! npm ci --no-audit --no-fund --prefer-offline; then
    echo "⚠️  npm ci a échoué, tentative avec npm install..."
    if ! npm install --no-audit --no-fund --prefer-offline; then
        echo "❌ Erreur: Impossible d'installer les dépendances"
        exit 1
    fi
fi

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "❌ Erreur: node_modules non trouvé après installation."
    exit 1
fi

# Vérifier que les outils de build sont disponibles
if ! command -v npx &> /dev/null; then
    echo "❌ Erreur: npx non trouvé"
    exit 1
fi

# Build du frontend avec Vite
echo "🔨 Build du frontend..."
if npx vite build; then
    echo "✅ Build frontend réussi"
else
    echo "❌ Erreur lors du build du frontend"
    exit 1
fi

# Vérifier que le build frontend a réussi
if [ ! -d "dist/public" ]; then
    echo "❌ Erreur: dist/public non trouvé après build frontend"
    exit 1
fi

# Build du backend avec esbuild
echo "🔨 Build du backend..."
if npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist; then
    echo "✅ Build backend réussi"
else
    echo "❌ Erreur lors du build du backend"
    exit 1
fi

# Vérifier que le build backend a réussi
if [ ! -f "dist/index.js" ]; then
    echo "❌ Erreur: dist/index.js non trouvé après build backend"
    exit 1
fi

# Vérifier les variables d'environnement critiques
echo "🔍 Vérification des variables d'environnement..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  Avertissement: DATABASE_URL non définie"
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Avertissement: OPENAI_API_KEY non définie"
fi

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "⚠️  Avertissement: STRIPE_SECRET_KEY non définie"
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "⚠️  Avertissement: SESSION_SECRET non définie"
fi

# Nettoyer le cache npm à la fin
echo "🧹 Nettoyage final du cache npm..."
npm cache clean --force || true

echo "✅ Build Railway terminé avec succès !"
echo "📊 Résumé du build:"
echo "   - Frontend: dist/public/"
echo "   - Backend: dist/index.js"
echo "   - Port: $PORT"
echo "   - Environnement: $NODE_ENV" 