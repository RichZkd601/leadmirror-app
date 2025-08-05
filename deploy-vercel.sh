#!/bin/bash

echo "🚀 Déploiement Vercel - Solution Alternative"

# Sauvegarder le fichier vercel.json actuel
if [ -f "vercel.json" ]; then
    mv vercel.json vercel.json.backup
    echo "✅ vercel.json sauvegardé"
fi

# Créer un vercel.json minimal
cat > vercel.json << 'VERCEL_EOF'
{
  "version": 2,
  "functions": {
    "server/index.ts": {
      "maxDuration": 30
    }
  }
}
VERCEL_EOF

echo "✅ Nouveau vercel.json créé"

# Commiter et pousser
git add vercel.json
git commit -m "Configuration Vercel simplifiée pour éviter les conflits"
git push origin main

echo "✅ Code poussé vers GitHub"
echo "🎯 Maintenant vous pouvez déployer sur Vercel sans erreur !"
