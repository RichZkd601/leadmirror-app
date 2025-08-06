# 🚀 Guide de Démarrage Rapide - LeadMirror

## ✅ Votre site est maintenant prêt !

### 🎯 Comment lancer le site

1. **Ouvrez un terminal** dans le dossier du projet
2. **Lancez la commande** :
   ```bash
   npm run start-final
   ```
3. **Attendez quelques secondes** que le serveur démarre
4. **Ouvrez votre navigateur** et allez sur : `http://localhost:3000`

### 🔧 Commandes utiles

- **Démarrer le site** : `npm run start-final`
- **Arrêter le serveur** : `Ctrl+C` dans le terminal
- **Vérifier l'API** : `curl http://localhost:3000/api/health`

### 🌐 URLs importantes

- **Frontend** : http://localhost:3000
- **API Health** : http://localhost:3000/api/health
- **API Documentation** : http://localhost:3000/api/

### ⚠️ Problèmes courants

**Port déjà utilisé** :
```bash
# Libérer le port 3000
lsof -ti:3000 | xargs kill -9
```

**Dépendances manquantes** :
```bash
npm install
```

**Fichier .env manquant** :
```bash
cp env.example .env
```

### 🎉 Fonctionnalités disponibles

✅ **Frontend React** avec interface moderne  
✅ **API REST** fonctionnelle  
✅ **Système d'authentification**  
✅ **Upload de fichiers audio**  
✅ **Analyse IA** (avec clé OpenAI)  
✅ **Interface responsive**  

### 🔑 Configuration optionnelle

Pour activer toutes les fonctionnalités, ajoutez dans votre fichier `.env` :

```env
# Pour l'analyse IA
OPENAI_API_KEY="votre-clé-openai"

# Pour les paiements
STRIPE_SECRET_KEY="votre-clé-stripe"

# Pour l'authentification Google
GOOGLE_CLIENT_ID="votre-client-id"
GOOGLE_CLIENT_SECRET="votre-client-secret"
```

### 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que le port 3000 est libre
2. Assurez-vous que Node.js est installé
3. Vérifiez que toutes les dépendances sont installées

**Votre site LeadMirror est maintenant opérationnel ! 🎉** 