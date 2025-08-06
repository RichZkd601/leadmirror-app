FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système nécessaires
RUN apk add --no-cache curl

# Copier les fichiers de configuration
COPY package*.json ./
COPY railway.json ./
COPY railway.toml ./
COPY railway-build.sh ./

# Rendre le script de build exécutable
RUN chmod +x railway-build.sh

# Installer TOUTES les dépendances (dev + prod) pour le build
RUN npm ci && npm cache clean --force

# Copier le code source
COPY . .

# Exécuter le build
RUN ./railway-build.sh

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Changer la propriété des fichiers
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exposer le port (Railway définit automatiquement PORT)
EXPOSE 5000

# Commande de démarrage optimisée pour Railway
CMD ["npm", "start"] 