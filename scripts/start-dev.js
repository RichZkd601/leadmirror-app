#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Démarrage de LeadMirror en mode développement...\n');

// Vérifier que le fichier .env existe
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  Fichier .env non trouvé. Création d\'un fichier .env basique...');
  
  const envExample = path.join(__dirname, '..', 'env.example');
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envPath);
    console.log('✅ Fichier .env créé à partir de env.example');
    console.log('📝 Veuillez configurer vos variables d\'environnement dans le fichier .env');
  } else {
    console.log('❌ Fichier env.example non trouvé');
    process.exit(1);
  }
}

// Vérifier les dépendances
console.log('📦 Vérification des dépendances...');
try {
  const { execSync } = await import('child_process');
  execSync('npm ls --depth=0', { stdio: 'inherit' });
  console.log('✅ Dépendances installées');
} catch (error) {
  console.log('❌ Problèmes avec les dépendances. Installation...');
  try {
    const { execSync } = await import('child_process');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dépendances installées avec succès');
  } catch (installError) {
    console.log('❌ Échec de l\'installation des dépendances');
    process.exit(1);
  }
}

// Démarrer le serveur de développement
console.log('\n🔥 Démarrage du serveur de développement...');
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

server.on('error', (error) => {
  console.error('❌ Erreur lors du démarrage du serveur:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`\n👋 Serveur arrêté avec le code: ${code}`);
  process.exit(code);
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur...');
  server.kill('SIGTERM');
}); 