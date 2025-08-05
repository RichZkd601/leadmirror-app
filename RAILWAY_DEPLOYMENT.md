# 🚀 Guide de Déploiement Railway - LeadMirror

## ✅ Configuration Optimisée pour Railway

Le projet a été entièrement configuré pour Railway avec suppression de toutes les références Vercel.

## 🔧 Configuration Optimisée

### 1. Dockerfile Optimisé
- Installation de **toutes** les dépendances (dev + prod) pour le build
- Ordre correct des opérations
- Permissions appropriées pour le script
- Utilisateur non-root pour la sécurité

### 2. Script railway-build.sh Amélioré
- Gestion d'erreurs robuste avec `set -e`
- Vérifications préliminaires
- Messages d'erreur détaillés
- Build frontend et backend séparés

### 3. Configuration Railway
- Utilisation de `DOCKERFILE` au lieu de `nixpacks`
- Healthcheck optimisé
- Variables d'environnement préconfigurées

## 🚀 Déploiement

### Prérequis
```bash
# Vérifier que tout fonctionne localement
npm run railway-deploy
```

### Variables d'Environnement Requises
```env
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your-super-secret-session-key
NODE_ENV=production
```

### Variables d'Environnement Optionnelles
```env
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 📋 Scripts Disponibles

### Tests Locaux
```bash
# Test rapide du build
npm run test-build

# Vérification des variables d'environnement
npm run verify-env

# Test complet de déploiement
npm run test-deployment

# Test et vérification combinés
npm run railway-deploy
```

### Build et Démarrage
```bash
# Build manuel
npm run railway-build

# Démarrage en production
npm start
```

## 🔍 Diagnostic des Problèmes

### Si le build échoue :
1. Vérifiez les variables d'environnement : `npm run verify-env`
2. Testez le build localement : `npm run test-build`
3. Consultez les logs Railway pour les erreurs spécifiques

### Si l'application ne démarre pas :
1. Vérifiez que `dist/index.js` existe
2. Testez la syntaxe : `node -c dist/index.js`
3. Vérifiez les variables critiques (DATABASE_URL, SESSION_SECRET)

## 🏗️ Structure du Build

```
dist/
├── index.js          # Backend compilé
└── public/           # Frontend compilé
    ├── index.html
    ├── assets/
    └── ...
```

## 🔧 Configuration Docker

Le Dockerfile utilise :
- Node.js 18 Alpine
- Installation complète des dépendances
- Build séparé frontend/backend
- Utilisateur non-root pour la sécurité
- Port exposé : 5000 (Railway gère automatiquement)

## 🚀 Déploiement sur Railway

1. **Connectez votre repository GitHub à Railway**
2. **Configurez les variables d'environnement** dans l'interface Railway
3. **Déployez automatiquement** - Railway détectera le Dockerfile
4. **Vérifiez les logs** pour s'assurer du bon déploiement

## 📊 Monitoring

- **Healthcheck** : `/api/health`
- **Logs** : Accessibles via l'interface Railway
- **Métriques** : Monitoring automatique Railway

## 🔒 Sécurité

- Utilisateur non-root dans le conteneur
- Variables d'environnement sécurisées
- Session secret configuré
- CORS configuré pour Railway 