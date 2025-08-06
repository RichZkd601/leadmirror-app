# 🚂 Guide de Déploiement Railway - LeadMirror

## 📋 Variables d'Environnement Requises

Pour que l'application fonctionne correctement sur Railway, vous devez configurer les variables d'environnement suivantes :

### 🔑 Variables Obligatoires

1. **DATABASE_URL**
   - URL de connexion à votre base de données PostgreSQL
   - Format : `postgresql://username:password@host:port/database`
   - Exemple : `postgresql://user:pass@host.neon.tech/leadmirror`

2. **SESSION_SECRET**
   - Clé secrète pour chiffrer les sessions utilisateur
   - Doit être une chaîne aléatoire de 32+ caractères
   - Exemple : `your-super-secret-session-key-change-this-123`

3. **NODE_ENV**
   - Environnement de l'application
   - Valeur : `production`

### 🔧 Variables Optionnelles

4. **OPENAI_API_KEY**
   - Clé API OpenAI pour les analyses audio IA
   - Format : `sk-...`

5. **STRIPE_SECRET_KEY**
   - Clé secrète Stripe pour les paiements
   - Format : `sk_test_...` ou `sk_live_...`

6. **STRIPE_WEBHOOK_SECRET**
   - Secret webhook Stripe
   - Format : `whsec_...`

7. **GOOGLE_CLIENT_ID**
   - ID client Google OAuth
   - Format : `123456789-abcdef.apps.googleusercontent.com`

8. **GOOGLE_CLIENT_SECRET**
   - Secret client Google OAuth

## 🛠️ Configuration sur Railway

### Étape 1 : Accéder aux Variables d'Environnement

1. Connectez-vous à votre dashboard Railway
2. Sélectionnez votre projet "leadmirror-app"
3. Allez dans l'onglet "Variables"

### Étape 2 : Ajouter les Variables

Ajoutez chaque variable avec sa valeur :

```
DATABASE_URL=postgresql://your-database-url
SESSION_SECRET=your-super-secret-key-here
NODE_ENV=production
OPENAI_API_KEY=sk-your-openai-key
STRIPE_SECRET_KEY=sk_test_your-stripe-key
```

### Étape 3 : Redéployer

1. Sauvegardez les variables
2. Railway redéploiera automatiquement l'application
3. Surveillez les logs pour vérifier le succès

## 🔍 Diagnostic des Problèmes

### Erreur "DATABASE_URL must be set"
- **Cause** : Variable DATABASE_URL non configurée
- **Solution** : Ajouter la variable dans Railway

### Erreur "Healthcheck failed"
- **Cause** : Application ne démarre pas à cause des variables manquantes
- **Solution** : Configurer toutes les variables obligatoires

### Erreur "Endpoint API introuvable"
- **Cause** : Application ne répond pas sur le port configuré
- **Solution** : Vérifier que l'application démarre correctement

## 📊 Vérification

Après configuration, l'application devrait :

1. ✅ Démarrer sans erreur
2. ✅ Répondre aux healthchecks
3. ✅ Être accessible via l'URL Railway
4. ✅ Afficher la page d'accueil

## 🆘 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs Railway
2. Assurez-vous que toutes les variables sont configurées
3. Testez localement avec un fichier `.env`
4. Contactez le support si nécessaire 