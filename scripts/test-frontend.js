#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Test du frontend LeadMirror...\n');

// Vérifier que les fichiers essentiels existent
const requiredFiles = [
  'client/src/App.tsx',
  'client/src/main.tsx',
  'client/index.html',
  'vite.config.ts',
  'tsconfig.json',
  'tailwind.config.ts',
  'package.json'
];

console.log('📁 Vérification des fichiers essentiels...');
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MANQUANT`);
    process.exit(1);
  }
}

// Vérifier la configuration TypeScript
console.log('\n🔧 Vérification de la configuration TypeScript...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ Configuration TypeScript valide');
} catch (error) {
  console.log('❌ Erreurs TypeScript détectées');
  process.exit(1);
}

// Vérifier la configuration Vite
console.log('\n⚡ Vérification de la configuration Vite...');
try {
  // Import dynamique pour éviter les problèmes de module
  const viteConfigPath = path.join(__dirname, '..', 'vite.config.ts');
  if (fs.existsSync(viteConfigPath)) {
    console.log('✅ Configuration Vite trouvée');
  } else {
    throw new Error('Fichier vite.config.ts non trouvé');
  }
} catch (error) {
  console.log('❌ Erreur dans la configuration Vite:', error.message);
  process.exit(1);
}

// Vérifier les dépendances
console.log('\n📦 Vérification des dépendances...');
try {
  execSync('npm ls --depth=0', { stdio: 'inherit' });
  console.log('✅ Dépendances installées correctement');
} catch (error) {
  console.log('❌ Problèmes avec les dépendances');
  process.exit(1);
}

// Test de build en mode développement
console.log('\n🏗️ Test de build en mode développement...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build réussi');
} catch (error) {
  console.log('❌ Échec du build');
  process.exit(1);
}

console.log('\n🎉 Tous les tests du frontend sont passés avec succès !');
console.log('🚀 Le frontend est prêt à fonctionner avec le backend.'); 