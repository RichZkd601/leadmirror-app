# 🚀 Guide de Déploiement Railway - LeadMirror

## Configuration Optimisée

Votre application est maintenant configurée pour un déploiement optimal sur Railway avec les améliorations suivantes :

### ✅ Problèmes Résolus

1. **Conflit de builders** : Suppression du Dockerfile pour utiliser uniquement nixpacks
2. **Erreurs npm** : Script de build amélioré avec fallback
3. **Configuration unifiée** : Utilisation exclusive de `railway.toml`
4. **Optimisation des performances** : Cache npm nettoyé et dépendances optimisées

### 📁 Fichiers de Configuration

- `railway.toml` : Configuration principale Railway
- `nixpacks.toml` : Configuration de build optimisée
- `railway-build.sh` : Script de build robuste
- `.railwayignore` : Exclusion des fichiers inutiles

### 🔧 Variables d'Environnement Requises

Configurez ces variables dans votre projet Railway :

```bash
NODE_ENV=production
DATABASE_URL=your-database-url
OPENAI_API_KEY=your-openai-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
SESSION_SECRET=your-super-secret-session-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 🧪 Test Local

Avant de déployer, testez le build localement :

```bash
npm run test-railway
```

### 🚀 Déploiement

1. **Connectez votre repository** à Railway
2. **Configurez les variables d'environnement** dans l'interface Railway
3. **Déployez automatiquement** - Railway détectera la configuration

### 📊 Monitoring

- **Healthcheck** : `/api/health`
- **Logs** : Accessibles dans l'interface Railway
- **Restart Policy** : Automatique en cas d'échec

### 🔍 Dépannage

Si vous rencontrez des erreurs :

1. **Vérifiez les variables d'environnement**
2. **Consultez les logs Railway**
3. **Testez localement** avec `npm run test-railway`
4. **Vérifiez la connectivité** de votre base de données

### 🎯 Avantages de cette Configuration

- ✅ **Build plus rapide** avec nixpacks
- ✅ **Gestion d'erreurs robuste** dans le script de build
- ✅ **Cache optimisé** pour éviter les problèmes npm
- ✅ **Configuration unifiée** sans conflits
- ✅ **Monitoring intégré** avec healthchecks

Votre application est maintenant prête pour un déploiement stable sur Railway ! 🎉 