#!/usr/bin/env node

/**
 * Script de démarrage simple pour le développement
 * Évite les problèmes de configuration complexes
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Démarrage simple de LeadMirror...\n');

// Vérifier et créer le fichier .env si nécessaire
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️ Fichier .env non trouvé, création...');
  const envExample = path.join(__dirname, '..', 'env.example');
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envPath);
    console.log('✅ Fichier .env créé');
  }
}

// Libérer le port si nécessaire
const port = process.env.PORT || '3000';
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

console.log(`📋 Configuration:`);
console.log(`   Port: ${port}`);
console.log(`   Environnement: ${process.env.NODE_ENV || 'development'}`);
console.log(`   URL: http://localhost:${port}\n`);

// Démarrer le serveur
console.log('🔥 Démarrage du serveur...');
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: port
  }
});

server.on('error', (error) => {
  console.error('❌ Erreur lors du démarrage:', error);
});

server.on('close', (code) => {
  console.log(`\n👋 Serveur arrêté avec le code: ${code}`);
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