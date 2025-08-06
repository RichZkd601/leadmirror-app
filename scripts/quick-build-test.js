#!/usr/bin/env node

/**
 * Script de test rapide du build pour Railway
 * Usage: node scripts/quick-build-test.js
 */

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

console.log('⚡ Test rapide du build Railway...\n');

// Nettoyer les builds précédents
console.log('🧹 Nettoyage des builds précédents...');
if (existsSync('dist')) {
  rmSync('dist', { recursive: true, force: true });
  console.log('  ✅ Répertoire dist/ supprimé');
}

// Test du script de build
console.log('\n🔨 Test du script railway-build.sh...');
try {
  execSync('./railway-build.sh', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  console.log('  ✅ Script de build exécuté avec succès');
} catch (error) {
  console.log('  ❌ Erreur lors de l\'exécution du script de build');
  process.exit(1);
}

// Vérification des fichiers de build
console.log('\n📋 Vérification des fichiers de build...');

const requiredFiles = [
  'dist/index.js',
  'dist/public/index.html'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  if (existsSync(file)) {
    console.log(`  ✅ ${file}: PRÉSENT`);
  } else {
    console.log(`  ❌ ${file}: MANQUANT`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('\n❌ Certains fichiers de build sont manquants');
  process.exit(1);
}

// Test de syntaxe du fichier principal
console.log('\n🔧 Test de syntaxe du fichier principal...');
try {
  execSync('node -c dist/index.js', { stdio: 'pipe' });
  console.log('  ✅ Syntaxe du fichier principal OK');
} catch (error) {
  console.log('  ❌ Erreur de syntaxe dans dist/index.js');
  process.exit(1);
}

console.log('\n🎉 Test rapide du build réussi!');
console.log('🚀 Le build est prêt pour le déploiement Railway.'); 