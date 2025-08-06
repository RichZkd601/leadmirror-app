# 🐳 Guide de Déploiement Docker - LeadMirror

## Configuration Docker Optimisée

Votre application est maintenant configurée pour un déploiement optimal avec Docker.

### ✅ Problèmes Résolus

1. **Postinstall npm** : Le script `railway-build.sh` est maintenant copié avant `npm ci`
2. **Permissions** : Le script est rendu exécutable avant l'installation
3. **Ordre des opérations** : Configuration → Installation → Code → Build
4. **Sécurité** : Utilisateur non-root dans le conteneur

### 📁 Fichiers de Configuration

- `Dockerfile` : Configuration Docker optimisée
- `.dockerignore` : Exclusion des fichiers inutiles
- `railway-build.sh` : Script de build robuste
- `package.json` : Script postinstall amélioré

### 🔧 Structure du Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app

# Copier les fichiers de configuration en premier
COPY package*.json ./
COPY railway-build.sh ./
COPY railway.toml ./
COPY nixpacks.toml ./

# Rendre le script exécutable avant npm ci
RUN chmod +x railway-build.sh

# Installer les dépendances
RUN npm ci --no-audit --no-fund --prefer-offline

# Copier le reste du code
COPY . .

# Exécuter le build
RUN ./railway-build.sh

# Sécurité : utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 5000
CMD ["npm", "start"]
```

### 🧪 Test Local

Testez le build Docker localement :

```bash
# Test du build Docker
npm run test-docker

# Ou directement avec Docker
docker build -t leadmirror .
docker run -p 5000:5000 leadmirror
```

### 🚀 Déploiement

#### Option 1: Railway avec Dockerfile
1. **Connectez votre repository** à Railway
2. **Railway détectera automatiquement** le Dockerfile
3. **Configurez les variables d'environnement**
4. **Déployez**

#### Option 2: Railway avec nixpacks (recommandé)
1. **Supprimez le Dockerfile** : `rm Dockerfile`
2. **Utilisez uniquement** `railway.toml` et `nixpacks.toml`
3. **Déployez** - Railway utilisera nixpacks

### 🔧 Variables d'Environnement

Configurez ces variables dans votre conteneur :

```bash
NODE_ENV=production
DATABASE_URL=your-database-url
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
SESSION_SECRET=your-super-secret-session-key
```

### 📊 Avantages de cette Configuration

- ✅ **Build plus rapide** avec cache Docker optimisé
- ✅ **Sécurité renforcée** avec utilisateur non-root
- ✅ **Gestion d'erreurs robuste** dans le script de build
- ✅ **Configuration unifiée** sans conflits
- ✅ **Test local** avec `npm run test-docker`

### 🔍 Dépannage

#### Si le build échoue :
1. **Vérifiez les permissions** : `chmod +x railway-build.sh`
2. **Testez localement** : `npm run test-docker`
3. **Consultez les logs** Docker pour les erreurs spécifiques

#### Si l'application ne démarre pas :
1. **Vérifiez les variables d'environnement**
2. **Testez la syntaxe** : `node -c dist/index.js`
3. **Vérifiez les logs** du conteneur

### 🎯 Recommandation

Pour Railway, nous recommandons d'utiliser **nixpacks** plutôt que Dockerfile pour :
- **Build plus rapide**
- **Configuration plus simple**
- **Meilleure intégration** avec Railway

Votre application est maintenant prête pour un déploiement stable ! 🚀 