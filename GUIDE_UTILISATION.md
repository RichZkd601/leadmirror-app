# 📚 Guide d'Utilisation - LeadMirror

## 🚀 **Démarrage Rapide**

### **1. Installation et Configuration**
```bash
# Cloner le projet
git clone https://github.com/RichZkd601/leadmirror-app.git
cd leadmirror-app

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp env.example .env
```

### **2. Configuration des Variables d'Environnement**
Éditez le fichier `.env` avec vos clés :

```bash
# Base de données
DATABASE_URL="postgresql://..."

# Session
SESSION_SECRET="votre-secret-très-sécurisé"

# OpenAI (pour les fonctionnalités IA)
OPENAI_API_KEY="sk-votre-clé-openai-ici"

# Stripe (pour les paiements)
STRIPE_SECRET_KEY="sk_live_votre-clé-stripe"
STRIPE_PUBLISHABLE_KEY="pk_live_votre-clé-stripe"
VITE_STRIPE_PUBLIC_KEY="pk_live_votre-clé-stripe"
```

### **3. Démarrage de l'Application**

#### **Mode Développement :**
```bash
npm run ultra
# Puis ouvrez : http://localhost:3000
```

#### **Mode Production :**
```bash
npm run build-prod
npm run start-prod
# Puis ouvrez : http://localhost:5000
```

## 🎯 **Fonctionnalités Principales**

### **📊 Analyse Audio**
- Upload de fichiers audio
- Analyse automatique avec IA
- Génération de rapports détaillés

### **🔐 Authentification**
- Connexion sécurisée
- Gestion des sessions
- Protection des routes

### **💳 Intégration Stripe**
- Paiements sécurisés
- Abonnements mensuels
- Offre à vie

### **📈 Analytics**
- Tableau de bord en temps réel
- Métriques de performance
- Historique des analyses

## 🛠️ **Commandes Utiles**

### **Développement :**
```bash
npm run ultra              # Démarre en mode développement
npm run test-endpoints     # Teste les endpoints locaux
npm run test-production    # Teste la production
```

### **Production :**
```bash
npm run build-prod         # Build le frontend
npm run start-prod         # Démarre en mode production
npm run deploy-frontend    # Déploie automatiquement
```

### **Maintenance :**
```bash
npm run clean              # Nettoie les fichiers temporaires
npm run type-check         # Vérifie les types TypeScript
npm run lint               # Vérifie le code
```

## 🔧 **Configuration Avancée**

### **Base de Données PostgreSQL**
```bash
# Créer une base de données
createdb leadmirror

# Configurer l'URL
DATABASE_URL="postgresql://user:password@localhost:5432/leadmirror"
```

### **Railway (Déploiement)**
```bash
# Variables d'environnement Railway
NODE_ENV=production
PORT=5000
SESSION_SECRET=votre-secret-très-sécurisé
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-votre-clé-openai-ici
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

## 📱 **Interface Utilisateur**

### **Pages Disponibles :**
- **Landing** : Page d'accueil
- **Auth** : Connexion/Inscription
- **Dashboard** : Tableau de bord principal
- **Audio Analysis** : Analyse audio
- **Analytics** : Statistiques
- **Profile** : Gestion du profil
- **Subscribe** : Abonnements
- **Security** : Paramètres de sécurité

### **Navigation :**
- Menu responsive
- Breadcrumbs
- Notifications toast
- Loading states

## 🔒 **Sécurité**

### **Authentification :**
- Sessions sécurisées
- Protection CSRF
- Validation des données

### **API :**
- Rate limiting
- Validation des entrées
- Gestion d'erreurs

### **Base de Données :**
- Connexions sécurisées
- Migrations automatiques
- Sauvegarde régulière

## 🚀 **Déploiement**

### **Railway (Recommandé) :**
```bash
# 1. Build le projet
npm run build-prod

# 2. Déployer
npm run deploy-frontend

# 3. Configurer Railway
# - Variables d'environnement
# - Build command: npm run build-prod
# - Start command: npm run start-prod
```

### **Vercel :**
```bash
# Configuration automatique
vercel --prod
```

### **Docker :**
```bash
# Build l'image
docker build -t leadmirror .

# Lancer le conteneur
docker run -p 3000:3000 leadmirror
```

## 📊 **Monitoring**

### **Health Checks :**
```bash
# Test local
curl http://localhost:3000/api/health

# Test production
curl https://leadmirror.io/api/health
```

### **Logs :**
```bash
# Logs Railway
railway logs

# Logs locaux
npm run ultra
```

## 🆘 **Dépannage**

### **Problèmes Courants :**

#### **Port déjà utilisé :**
```bash
# Tuer le processus
lsof -ti:3000 | xargs kill -9
```

#### **Base de données non connectée :**
```bash
# Vérifier l'URL
echo $DATABASE_URL

# Tester la connexion
npm run test-database
```

#### **Frontend ne se charge pas :**
```bash
# Rebuild le frontend
npm run build-prod

# Vérifier les assets
ls -la dist/public/
```

## 📞 **Support**

### **Documentation :**
- `GUIDE_DEMARRAGE.md` - Guide de démarrage
- `GUIDE_DEPLOIEMENT_PRODUCTION.md` - Déploiement
- `RESUME_FRONTEND_SOLUTION.md` - Solution frontend

### **Tests :**
```bash
npm run test-endpoints    # Tests locaux
npm run test-production   # Tests production
```

### **Debug :**
```bash
# Mode debug
DEBUG=* npm run ultra

# Logs détaillés
NODE_ENV=development npm run ultra
```

## 🎉 **Votre Application LeadMirror est Prête !**

**Fonctionnalités disponibles :**
- ✅ Interface utilisateur React complète
- ✅ API backend sécurisée
- ✅ Base de données PostgreSQL
- ✅ Intégration Stripe
- ✅ Analyse audio avec IA
- ✅ Déploiement Railway

**Prochaines étapes :**
1. 🔧 Configurer les variables d'environnement
2. 🔧 Déployer sur Railway
3. 🔧 Tester toutes les fonctionnalités
4. 🎉 Lancer votre application !

**Votre application LeadMirror est maintenant 100% fonctionnelle ! 🚀** 