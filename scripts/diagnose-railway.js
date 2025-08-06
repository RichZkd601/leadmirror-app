#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔍 Diagnostic Railway - LeadMirror');
console.log('=====================================');

// Vérifier les variables d'environnement
console.log('\n📋 Variables d\'environnement :');
const envVars = [
  'DATABASE_URL',
  'SESSION_SECRET', 
  'NODE_ENV',
  'PORT',
  'OPENAI_API_KEY',
  'STRIPE_SECRET_KEY'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NON DÉFINIE`);
  }
});

// Vérifier la structure du projet
console.log('\n📁 Structure du projet :');
const files = [
  'package.json',
  'Dockerfile',
  'server/index.ts',
  'dist/index.js',
  'scripts/start.js'
];

files.forEach(file => {
  try {
    const stats = fs.statSync(file);
    console.log(`✅ ${file}: ${stats.size} bytes`);
  } catch (error) {
    console.log(`❌ ${file}: NON TROUVÉ`);
  }
});

// Vérifier les ports
console.log('\n🌐 Configuration des ports :');
console.log(`PORT: ${process.env.PORT || '5000'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Vérifier les dépendances
console.log('\n📦 Dépendances :');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ package.json: ${packageJson.name} v${packageJson.version}`);
  console.log(`📋 Scripts disponibles: ${Object.keys(packageJson.scripts).join(', ')}`);
} catch (error) {
  console.log('❌ Erreur lecture package.json:', error.message);
}

// Vérifier le build
console.log('\n🔨 État du build :');
try {
  if (fs.existsSync('dist/index.js')) {
    const stats = fs.statSync('dist/index.js');
    console.log(`✅ dist/index.js: ${stats.size} bytes`);
  } else {
    console.log('❌ dist/index.js: NON TROUVÉ');
    console.log('💡 Exécutez "npm run build" pour créer le build');
  }
} catch (error) {
  console.log('❌ Erreur vérification build:', error.message);
}

console.log('\n🎯 Recommandations :');
console.log('1. Vérifiez que toutes les variables d\'environnement sont configurées sur Railway');
console.log('2. Assurez-vous que le build existe (npm run build)');
console.log('3. Vérifiez les logs Railway pour plus de détails');
console.log('4. Testez localement avec "npm run test-startup"'); 