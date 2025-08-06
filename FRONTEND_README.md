# 🎨 Frontend LeadMirror - Guide d'Utilisation

## 🚀 Démarrage Rapide

### 1. Installation des Dépendances
```bash
npm install
```

### 2. Configuration de l'Environnement
Copiez le fichier `env.example` vers `.env` et configurez vos variables :
```bash
cp env.example .env
```

Variables obligatoires :
- `DATABASE_URL` : URL de votre base de données PostgreSQL
- `OPENAI_API_KEY` : Clé API OpenAI
- `SESSION_SECRET` : Clé secrète pour les sessions

### 3. Démarrage en Mode Développement
```bash
npm run start-dev
```

Ou manuellement :
```bash
npm run dev
```

## 🏗️ Structure du Projet

```
client/
├── src/
│   ├── components/     # Composants React réutilisables
│   ├── pages/         # Pages de l'application
│   ├── hooks/         # Hooks React personnalisés
│   ├── lib/           # Utilitaires et configurations
│   └── ui/            # Composants UI de base
├── index.html         # Point d'entrée HTML
└── index.css          # Styles globaux
```

## 🔧 Configuration

### Vite Configuration
Le fichier `vite.config.ts` configure :
- Les alias de chemins (`@/`, `@shared/`, `@assets/`)
- Le proxy pour l'API backend
- La configuration de build
- Les optimisations de développement

### TypeScript Configuration
Le fichier `tsconfig.json` configure :
- Les chemins d'alias
- Les options de compilation
- Les types globaux

### Tailwind CSS
Le fichier `tailwind.config.ts` configure :
- Les couleurs personnalisées
- Les composants personnalisés
- Les animations

## 🎯 Fonctionnalités Principales

### Authentification
- Système d'authentification avec sessions
- Protection des routes
- Gestion des états de chargement

### Routing
- Routing basé sur l'état d'authentification
- Gestion des erreurs 404
- Navigation fluide

### UI/UX
- Design system cohérent
- Composants réutilisables
- Animations fluides
- Support du mode sombre

## 🧪 Tests

### Test du Frontend
```bash
npm run test-frontend
```

Ce script vérifie :
- L'existence des fichiers essentiels
- La configuration TypeScript
- La configuration Vite
- Les dépendances
- Le build de production

## 🚀 Déploiement

### Build de Production
```bash
npm run build
```

### Vérification du Build
```bash
npm run test-build
```

## 🔍 Dépannage

### Problèmes Courants

1. **Erreurs TypeScript**
   ```bash
   npx tsc --noEmit
   ```

2. **Problèmes de Dépendances**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Problèmes de Build**
   ```bash
   npm run test-frontend
   ```

4. **Problèmes de Proxy API**
   - Vérifiez que le backend tourne sur le port 5000
   - Vérifiez la configuration proxy dans `vite.config.ts`

### Logs de Développement
Les logs sont affichés dans la console avec des timestamps :
```
12:34:56 [express] GET /api/auth/user 200 in 45ms
12:34:57 [vite] Server ready in 1234ms
```

## 📚 Ressources

- [Documentation Vite](https://vitejs.dev/)
- [Documentation React](https://react.dev/)
- [Documentation TypeScript](https://www.typescriptlang.org/)
- [Documentation Tailwind CSS](https://tailwindcss.com/)

## 🤝 Contribution

1. Créez une branche pour votre fonctionnalité
2. Testez vos changements : `npm run test-frontend`
3. Assurez-vous que le build fonctionne : `npm run build`
4. Soumettez une pull request

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs de développement
2. Exécutez les tests : `npm run test-frontend`
3. Consultez la documentation des outils utilisés 