# Utiliser une image Node.js optimisée pour la production
FROM node:20-alpine AS base

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration npm pour optimiser le cache
COPY package*.json .npmrc* ./

# Installer les dépendances avec gestion d'erreurs robuste
RUN npm ci --no-audit --no-fund --prefer-offline --production=false && \
    npm cache clean --force && \
    echo "✅ Dépendances installées avec succès"

# Copier le reste du code source
COPY . .

# Vérifier que tous les fichiers nécessaires sont présents
RUN echo "🔍 Vérification des fichiers critiques..." && \
    ls -la package.json && \
    ls -la server/index.ts && \
    echo "✅ Tous les fichiers critiques sont présents"

# Build de l'application
RUN echo "🔨 Build de l'application..." && \
    npm run build && \
    echo "✅ Build terminé avec succès"

# Vérifier que les fichiers de build existent
RUN echo "🔍 Vérification des fichiers de build..." && \
    ls -la dist/ && \
    ls -la dist/index.js && \
    ls -la dist/public/ && \
    echo "✅ Tous les fichiers de build sont présents"

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    echo "✅ Utilisateur non-root créé"

# Changer la propriété des fichiers et nettoyer
RUN chown -R nextjs:nodejs /app && \
    echo "✅ Permissions mises à jour"

# Passer à l'utilisateur non-root
USER nextjs

# Exposer le port (Railway définit automatiquement PORT)
EXPOSE 5000

# Définir les variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=5000

# Healthcheck pour vérifier que l'application fonctionne
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:$PORT/ || exit 1

# Commande de démarrage optimisée pour Railway
CMD ["node", "scripts/start.js"] 
