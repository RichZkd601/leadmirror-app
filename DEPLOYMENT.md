# 🚀 Guide de Déploiement Vercel

## 📋 Prérequis

1. **Compte Vercel** : [vercel.com](https://vercel.com)
2. **Compte GitHub** : Pour connecter votre repository
3. **Variables d'environnement** : Configurées dans Vercel

## 🔧 Configuration Vercel

### 1. Variables d'Environnement

Dans votre dashboard Vercel, ajoutez ces variables :

```bash
# Base de données
DATABASE_URL=postgresql://votre_utilisateur:votre_mot_de_passe@votre_host/votre_database?sslmode=require

# OpenAI
OPENAI_API_KEY=sk-votre_clé_openai_ici

# Stripe
STRIPE_SECRET_KEY=sk_live_votre_clé_stripe_ici
VITE_STRIPE_PUBLIC_KEY=pk_live_votre_clé_publique_stripe_ici

# Sessions
SESSION_SECRET=votre_secret_de_session_ici

# Webhook Stripe (à configurer après déploiement)
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret_ici
```

### 2. Configuration du Build

- **Framework Preset** : Node.js
- **Build Command** : `npm run build`
- **Output Directory** : `dist`
- **Install Command** : `npm install`

### 3. Domaines

- **Production** : `votre-app.vercel.app`
- **Custom Domain** : `votre-domaine.com` (optionnel)

## 🔗 Configuration Stripe Webhooks

### 1. Dashboard Stripe

1. Allez sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Developers** → **Webhooks**
3. **Add endpoint**

### 2. URL Webhook

```
https://votre-app.vercel.app/api/stripe-webhook
```

### 3. Événements à Sélectionner

- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

### 4. Récupération du Secret

1. Cliquez sur **"Reveal"** pour voir le webhook secret
2. Copiez le secret (format : `whsec_xxxxxxxxxx`)
3. Ajoutez-le dans les variables d'environnement Vercel

## 🚀 Déploiement

### 1. Connecter GitHub

1. Allez sur [vercel.com](https://vercel.com)
2. **New Project**
3. **Import Git Repository**
4. Sélectionnez votre repository

### 2. Configuration

- **Framework** : Node.js
- **Root Directory** : `./`
- **Build Command** : `npm run build`
- **Output Directory** : `dist`

### 3. Variables d'Environnement

Ajoutez toutes les variables listées ci-dessus dans l'interface Vercel.

### 4. Déployer

Cliquez sur **"Deploy"** et attendez la fin du build.

## 🔄 Mises à Jour

### Déploiement Automatique

- ✅ **Push sur main** → Déploiement automatique
- ✅ **Pull Requests** → Prévisualisation automatique
- ✅ **Rollback** → Possibilité de revenir en arrière

### Déploiement Manuel

```bash
# Installer Vercel CLI
npm i -g vercel

# Login
vercel login

# Déployer
vercel --prod
```

## 📊 Monitoring

### Vercel Analytics

- **Performance** : Temps de chargement
- **Erreurs** : Logs d'erreurs
- **Trafic** : Statistiques de visite

### Logs

```bash
# Voir les logs
vercel logs

# Logs en temps réel
vercel logs --follow
```

## 🔧 Maintenance

### Variables d'Environnement

- **Mise à jour** : Via dashboard Vercel
- **Sécurité** : Chiffrées automatiquement
- **Versioning** : Historique des changements

### Base de Données

- **Neon** : Gestion automatique
- **Backups** : Automatiques
- **Monitoring** : Via dashboard Neon

## 🆘 Support

### Problèmes Courants

1. **Build Failed** : Vérifiez les logs Vercel
2. **Variables Manquantes** : Vérifiez l'environnement
3. **Webhooks** : Testez avec Stripe CLI

### Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Neon Database](https://neon.tech/docs) 