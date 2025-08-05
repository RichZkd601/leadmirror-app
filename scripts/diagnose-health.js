#!/usr/bin/env node

/**
 * Script de diagnostic pour les problèmes de health check
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Diagnostic des problèmes de health check...\n');

// 1. Vérifier les variables d'environnement
console.log('📋 Variables d\'environnement :');
console.log(`   PORT: ${process.env.PORT || '5000 (défaut)'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Définie' : '❌ Non définie'}`);
console.log(`   SESSION_SECRET: ${process.env.SESSION_SECRET ? '✅ Définie' : '❌ Non définie'}\n`);

// 2. Vérifier les ports utilisés
console.log('🔌 Ports utilisés :');
try {
  const ports = [5000, 8080, 3000, 3001];
  for (const port of ports) {
    try {
      execSync(`lsof -i :${port}`, { stdio: 'pipe' });
      console.log(`   Port ${port}: ❌ Utilisé`);
    } catch {
      console.log(`   Port ${port}: ✅ Libre`);
    }
  }
} catch (error) {
  console.log('   Erreur lors de la vérification des ports');
}
console.log('');

// 3. Vérifier les fichiers essentiels
console.log('📁 Fichiers essentiels :');
const essentialFiles = [
  'server/index.ts',
  'server/routes.ts',
  'server/socialAuth.ts',
  'package.json',
  'tsconfig.json'
];

for (const file of essentialFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`   ${file}: ✅ Existe`);
  } else {
    console.log(`   ${file}: ❌ Manquant`);
  }
}
console.log('');

// 4. Test de démarrage simple
console.log('🚀 Test de démarrage simple :');
try {
  console.log('   Démarrage du serveur de test...');
  const testServer = execSync('node scripts/test-server.js', { 
    stdio: 'pipe',
    timeout: 10000 
  });
  console.log('   ✅ Serveur de test démarré avec succès');
} catch (error) {
  console.log('   ❌ Erreur lors du démarrage du serveur de test');
  console.log(`   Erreur: ${error.message}`);
}
console.log('');

// 5. Test de health check
console.log('🏥 Test de health check :');
try {
  const response = execSync('curl -s http://localhost:8080/api/health', { 
    stdio: 'pipe',
    timeout: 5000 
  });
  console.log('   ✅ Health check réussi');
  console.log(`   Réponse: ${response.toString()}`);
} catch (error) {
  console.log('   ❌ Health check échoué');
  console.log(`   Erreur: ${error.message}`);
}
console.log('');

console.log('📊 Résumé du diagnostic :');
console.log('   - Vérifiez que les variables d\'environnement sont définies');
console.log('   - Assurez-vous qu\'aucun autre service n\'utilise le port');
console.log('   - Vérifiez que la base de données est accessible');
console.log('   - Testez avec le serveur de test: npm run test-server'); 