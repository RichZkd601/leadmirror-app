#!/usr/bin/env node

/**
 * Script de démarrage ultra-simple pour LeadMirror
 * Évite tous les problèmes complexes
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 LeadMirror - Démarrage Ultra-Simple\n');

// Configuration
const port = process.env.PORT || '3000';
const envPath = path.join(__dirname, '..', '.env');

// Vérifications préliminaires
console.log('🔍 Vérifications préliminaires...');

// 1. Vérifier le fichier .env
if (!fs.existsSync(envPath)) {
  console.log('📝 Création du fichier .env...');
  const envExample = path.join(__dirname, '..', 'env.example');
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envPath);
    console.log('✅ Fichier .env créé');
  }
}

// 2. Libérer le port si nécessaire
try {
  const { execSync } = await import('child_process');
  const pids = execSync(`lsof -ti:${port}`, { stdio: 'pipe' }).toString().trim();
  if (pids) {
    console.log(`🔧 Libération du port ${port}...`);
    execSync(`kill -9 ${pids}`, { stdio: 'pipe' });
  }
} catch (error) {
  // Port libre, pas de problème
}

console.log('📋 Configuration:');
console.log(`   🌐 URL: http://localhost:${port}`);
console.log(`   🔧 Port: ${port}`);
console.log(`   🛠️  Mode: Développement`);
console.log(`   📁 Environnement: ${process.env.NODE_ENV || 'development'}\n`);

console.log('🔥 Démarrage du serveur...');
console.log('⏳ Veuillez patienter quelques secondes...\n');

// Démarrer le serveur directement avec tsx
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: port
  }
});

// Attendre un peu et tester le serveur
setTimeout(async () => {
  try {
    const { execSync } = await import('child_process');
    const response = execSync(`curl -s http://localhost:${port}/api/health`, { 
      stdio: 'pipe',
      timeout: 5000 
    });
    console.log('\n✅ Serveur démarré avec succès !');
    console.log(`🌐 Frontend: http://localhost:${port}`);
    console.log(`🔌 API: http://localhost:${port}/api/health`);
    console.log('\n💡 Utilisez Ctrl+C pour arrêter le serveur');
    console.log('🎉 Votre site LeadMirror est prêt !');
  } catch (error) {
    console.log('\n⚠️ Le serveur prend plus de temps à démarrer...');
    console.log('💡 Vérifiez http://localhost:' + port + ' dans votre navigateur');
  }
}, 8000);

server.on('error', (error) => {
  console.error('❌ Erreur lors du démarrage:', error);
});

server.on('close', (code) => {
  console.log(`\n👋 Serveur arrêté (code: ${code})`);
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur...');
  server.kill('SIGTERM');
  process.exit(0);
}); 