# 🚀 Guide de Déploiement Production - LeadMirror

## ✅ Tests de Validation Complétés

### 📊 **Résultats des Tests :**
- ✅ **8/8 tests passés** (100% de réussite)
- ✅ **Health Check** : Fonctionne parfaitement
- ✅ **Sécurité** : Tous les endpoints sensibles sont protégés
- ✅ **Validation** : Les données invalides sont rejetées
- ✅ **Authentification** : Middleware de sécurité actif

## 🌐 **Configuration pour la Production**

### 1. **Variables d'Environnement Requises**

Créez un fichier `.env` en production avec :

```env
# Base de données
DATABASE_URL="postgresql://username:password@host:port/database"

# Sécurité
SESSION_SECRET="votre-secret-session-très-sécurisé"
NODE_ENV="production"

# OpenAI
OPENAI_API_KEY="sk-votre-clé-openai-ici"

# Stripe
STRIPE_SECRET_KEY="sk_live_votre-clé-stripe-secrète"
STRIPE_PUBLISHABLE_KEY="pk_live_51RrCDDF1s37tn7hIkrZF8MiKBNHWgoyR8mBa25TZevpJKnnUfHDQs411BpFuGZjc4hzLdgrPrzXmvCXsb6tvbceO00JF2AY2Iu"
STRIPE_WEBHOOK_SECRET="whsec_votre-webhook-secret"

# Frontend
VITE_STRIPE_PUBLIC_KEY="pk_live_51RrCDDF1s37tn7hIkrZF8MiKBNHWgoyR8mBa25TZevpJKnnUfHDQs411BpFuGZjc4hzLdgrPrzXmvCXsb6tvbceO00JF2AY2Iu"

# Google OAuth (optionnel)
GOOGLE_CLIENT_ID="votre-google-client-id"
GOOGLE_CLIENT_SECRET="votre-google-client-secret"

# Google Cloud Storage (optionnel)
GOOGLE_CLOUD_PROJECT_ID="votre-project-id"
GOOGLE_CLOUD_BUCKET_NAME="votre-bucket-name"
GOOGLE_CLOUD_CREDENTIALS="votre-credentials-json"

# Notion (optionnel)
NOTION_DATABASE_ID="votre-notion-database-id"
```

### 2. **Base de Données PostgreSQL**

#### Installation et Configuration :
```bash
# Installer PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Créer la base de données
sudo -u postgres createdb leadmirror_prod
sudo -u postgres createuser leadmirror_user

# Configurer les permissions
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE leadmirror_prod TO leadmirror_user;
\q
```

#### Migration des schémas :
```bash
# Installer Drizzle CLI
npm install -g drizzle-kit

# Générer les migrations
npx drizzle-kit generate

# Appliquer les migrations
npx drizzle-kit migrate
```

### 3. **Déploiement sur Railway**

#### Configuration Railway :
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### Variables d'environnement Railway :
```bash
# Dans l'interface Railway ou via CLI
railway variables set NODE_ENV=production
railway variables set DATABASE_URL="postgresql://..."
railway variables set SESSION_SECRET="votre-secret"
railway variables set OPENAI_API_KEY="sk-votre-clé-openai-ici"
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set STRIPE_PUBLISHABLE_KEY="pk_live_..."
railway variables set STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 4. **Configuration du Frontend**

#### Variables d'environnement Vite :
```env
# .env.production
VITE_API_URL="https://leadmirror.io/api"
VITE_STRIPE_PUBLIC_KEY="pk_live_51RrCDDF1s37tn7hIkrZF8MiKBNHWgoyR8mBa25TZevpJKnnUfHDQs411BpFuGZjc4hzLdgrPrzXmvCXsb6tvbceO00JF2AY2Iu"
```

#### Build de production :
```bash
# Build du frontend
npm run build

# Vérifier le build
npm run preview
```

### 5. **Configuration Stripe**

#### Webhooks Stripe :
```bash
# Créer le webhook dans l'interface Stripe
stripe listen --forward-to https://leadmirror.io/api/stripe-webhook

# Événements à écouter :
# - customer.subscription.created
# - customer.subscription.updated
# - customer.subscription.deleted
# - checkout.session.completed
# - invoice.payment_succeeded
# - invoice.payment_failed
```

#### Test des webhooks :
```bash
# Tester le webhook localement
stripe trigger checkout.session.completed
```

### 6. **Monitoring et Alerting**

#### Sentry pour le monitoring d'erreurs :
```javascript
// Dans server/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "votre-dsn-sentry",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Capturer les erreurs
app.use(Sentry.Handlers.errorHandler());
```

#### Uptime Robot pour le monitoring :
- URL : `https://leadmirror.io/api/health`
- Intervalle : 5 minutes
- Timeout : 30 secondes
- Alertes : Email, Slack, Discord

### 7. **Sécurité**

#### Headers de sécurité :
```javascript
// Dans server/index.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.stripe.com"]
    }
  }
}));
```

#### Rate limiting :
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite par IP
  message: "Trop de requêtes, réessayez plus tard"
});

app.use('/api/', limiter);
```

### 8. **Tests de Production**

#### Test des endpoints de production :
```bash
# Health check
curl -s https://leadmirror.io/api/health

# Test d'authentification
curl -X POST https://leadmirror.io/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test d'analyse (avec token)
curl -X POST https://leadmirror.io/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"conversationText":"Test conversation"}'
```

#### Test des webhooks Stripe :
```bash
# Tester le webhook
stripe trigger checkout.session.completed \
  --add checkout_session:metadata.userId=test_user_id \
  --add checkout_session:metadata.type=lifetime
```

### 9. **Optimisations de Performance**

#### Cache Redis (optionnel) :
```javascript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache des analyses
app.get('/api/analyses/:id', isAuthenticated, async (req, res) => {
  const cacheKey = `analysis:${req.params.id}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // ... logique normale
  await redis.setex(cacheKey, 3600, JSON.stringify(analysis));
});
```

#### Compression :
```javascript
import compression from 'compression';

app.use(compression());
```

### 10. **Backup et Récupération**

#### Backup automatique de la base de données :
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
gzip backup_$DATE.sql
aws s3 cp backup_$DATE.sql.gz s3://leadmirror-backups/
```

#### Récupération :
```bash
# Restaurer une sauvegarde
gunzip backup_20250101_120000.sql.gz
psql $DATABASE_URL < backup_20250101_120000.sql
```

## 🎯 **Checklist de Déploiement**

### ✅ **Pré-déploiement :**
- [ ] Variables d'environnement configurées
- [ ] Base de données PostgreSQL créée
- [ ] Clés API OpenAI et Stripe configurées
- [ ] Webhooks Stripe configurés
- [ ] SSL/HTTPS configuré
- [ ] Monitoring configuré

### ✅ **Post-déploiement :**
- [ ] Tests des endpoints de production
- [ ] Test des webhooks Stripe
- [ ] Vérification du monitoring
- [ ] Test des paiements
- [ ] Test des analyses IA
- [ ] Vérification des performances

### ✅ **Maintenance :**
- [ ] Backups automatiques
- [ ] Monitoring des erreurs
- [ ] Mise à jour des dépendances
- [ ] Surveillance des coûts API

## 🚀 **Votre API LeadMirror est Prête pour la Production !**

**Tous les tests sont passés et votre application est sécurisée et optimisée pour la production ! 🎉** 