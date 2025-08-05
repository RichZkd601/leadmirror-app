# LeadMirror - Analyse Audio Révolutionnaire

## 🚀 Déploiement Railway

### Configuration Rapide

1. **Connectez votre repository à Railway**
   - Allez sur [Railway.app](https://railway.app)
   - Connectez votre repository GitHub
   - Railway détectera automatiquement la configuration

2. **Configurez les variables d'environnement**
   ```bash
   # Variables Critiques (Obligatoires)
   DATABASE_URL=your-neon-database-url
   NODE_ENV=production
   SESSION_SECRET=your-super-secret-session-key
   
   # Variables API (Obligatoires pour les fonctionnalités)
   OPENAI_API_KEY=your-openai-api-key
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
   ```

3. **Déployez automatiquement**
   - Railway déploiera automatiquement à chaque push
   - Le health check vérifiera `/api/health`

### 🔧 Scripts de Déploiement

```bash
# Vérifier la configuration
npm run verify-env

# Test de déploiement complet
npm run test-deployment

# Health check
npm run healthcheck

# Build Railway
npm run railway-build
```

### 📊 Monitoring

- **Health Check**: `/api/health`
- **Logs**: Disponibles dans l'interface Railway
- **Variables**: Configurées dans Railway Dashboard

## 🛠️ Développement Local

```bash
# Installation
npm install

# Développement
npm run dev

# Build
npm run build

# Production
npm start
```

## 📁 Structure du Projet

```
├── api/                 # API Express simple
├── client/             # Frontend React
├── server/             # Backend principal
├── shared/             # Schémas partagés
├── scripts/            # Scripts de déploiement
├── railway.toml        # Configuration Railway
├── railway-build.sh    # Script de build Railway
└── RAILWAY_DEPLOYMENT.md # Guide détaillé Railway
```

## 🔐 Variables d'Environnement

Voir `env.example` pour la liste complète des variables.

## 📞 Support

- **Documentation Railway**: `RAILWAY_DEPLOYMENT.md`
- **Logs**: Interface Railway
- **Health Check**: `/api/health`

## 🚨 Dépannage

1. Vérifiez les variables d'environnement
2. Consultez les logs Railway
3. Testez l'endpoint `/api/health`
4. Consultez le guide de déploiement

---

**LeadMirror** - Analyse audio révolutionnaire avec IA 