#!/usr/bin/env node

/**
 * Script de test de déploiement pour Railway
 * Usage: node scripts/test-deployment.js
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

console.log('🧪 Test de déploiement Railway...\n');

// Vérifications préliminaires
console.log('📋 Vérifications préliminaires:');

// 1. Vérifier que le build existe
const distPath = join(process.cwd(), 'dist');
const publicPath = join(distPath, 'public');
const indexPath = join(distPath, 'index.js');

if (!existsSync(distPath)) {
  console.log('  ❌ Répertoire dist/ non trouvé');
  process.exit(1);
}
console.log('  ✅ Répertoire dist/ trouvé');

if (!existsSync(publicPath)) {
  console.log('  ❌ Répertoire dist/public/ non trouvé');
  process.exit(1);
}
console.log('  ✅ Répertoire dist/public/ trouvé');

if (!existsSync(indexPath)) {
  console.log('  ❌ Fichier dist/index.js non trouvé');
  process.exit(1);
}
console.log('  ✅ Fichier dist/index.js trouvé');

// 2. Vérifier les variables d'environnement critiques
console.log('\n🔍 Vérification des variables d\'environnement:');

const criticalVars = ['DATABASE_URL', 'SESSION_SECRET'];
let missingVars = [];

for (const varName of criticalVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
    console.log(`  ❌ ${varName}: MANQUANTE`);
  } else {
    console.log(`  ✅ ${varName}: CONFIGURÉE`);
  }
}

if (missingVars.length > 0) {
  console.log(`\n⚠️  Variables manquantes: ${missingVars.join(', ')}`);
  console.log('   Le déploiement peut échouer sans ces variables.');
}

// 3. Test de syntaxe du fichier principal
console.log('\n🔧 Test de syntaxe du fichier principal:');
try {
  const { execSync } = await import('child_process');
  execSync('node -c dist/index.js', { stdio: 'pipe' });
  console.log('  ✅ Syntaxe du fichier principal OK');
} catch (error) {
  console.log('  ❌ Erreur de syntaxe dans dist/index.js');
  console.log(`     Erreur: ${error.message}`);
  process.exit(1);
}

// 4. Test de démarrage rapide (timeout de 10 secondes)
console.log('\n🚀 Test de démarrage de l\'application:');
console.log('   Démarrage en cours... (timeout: 10s)');

const app = spawn('node', ['dist/index.js'], {
  env: { ...process.env, PORT: '5001' },
  stdio: ['pipe', 'pipe', 'pipe']
});

let appStarted = false;
let appOutput = '';

app.stdout.on('data', (data) => {
  appOutput += data.toString();
  if (appOutput.includes('Server running') || appOutput.includes('Listening')) {
    appStarted = true;
    console.log('  ✅ Application démarrée avec succès');
    app.kill();
  }
});

app.stderr.on('data', (data) => {
  appOutput += data.toString();
});

app.on('error', (error) => {
  console.log(`  ❌ Erreur de démarrage: ${error.message}`);
  process.exit(1);
});

// Timeout après 10 secondes
setTimeout(() => {
  if (!appStarted) {
    console.log('  ⚠️  Timeout: Application non démarrée dans les 10 secondes');
    console.log('     Sortie de l\'application:');
    console.log(appOutput);
    app.kill();
  }
}, 10000);

app.on('close', (code) => {
  if (code === 0 || appStarted) {
    console.log('\n✅ Test de déploiement réussi!');
    console.log('🚀 L\'application est prête pour le déploiement Railway.');
  } else {
    console.log('\n❌ Test de déploiement échoué.');
    console.log(`   Code de sortie: ${code}`);
    process.exit(1);
  }
}); 