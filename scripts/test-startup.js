#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

console.log('🧪 Test de démarrage de l\'application...');

// Vérifier les variables d'environnement
console.log('🔍 Vérification des variables d\'environnement...');
const requiredVars = ['DATABASE_URL', 'SESSION_SECRET', 'NODE_ENV'];
let missingVars = [];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  console.log('❌ Variables manquantes:', missingVars.join(', '));
  console.log('💡 Configurez ces variables pour tester localement');
  process.exit(1);
}

console.log('✅ Variables d\'environnement OK');

// Démarrer l'application en arrière-plan
console.log('🚀 Démarrage de l\'application...');
const child = spawn('node', ['scripts/start.js'], {
  stdio: 'pipe',
  env: { ...process.env, NODE_ENV: 'production' }
});

let output = '';
let errorOutput = '';

child.stdout.on('data', (data) => {
  output += data.toString();
  console.log('📤', data.toString().trim());
});

child.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.log('❌', data.toString().trim());
});

// Attendre que l'application démarre
console.log('⏳ Attente du démarrage...');
await setTimeout(5000);

// Tester les endpoints
console.log('🔍 Test des endpoints...');

try {
  // Test de la route racine
  const response1 = await fetch('http://localhost:5000/');
  const data1 = await response1.json();
  console.log('✅ Route racine:', data1);

  // Test de la route de santé
  const response2 = await fetch('http://localhost:5000/health');
  const data2 = await response2.json();
  console.log('✅ Route de santé:', data2);

  console.log('🎉 Application fonctionne correctement !');
} catch (error) {
  console.log('❌ Erreur lors du test:', error.message);
} finally {
  // Arrêter l'application
  console.log('🛑 Arrêt de l\'application...');
  child.kill('SIGTERM');
  
  setTimeout(() => {
    if (!child.killed) {
      child.kill('SIGKILL');
    }
  }, 5000);
} 