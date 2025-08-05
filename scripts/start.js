#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Démarrage de LeadMirror...');

// Vérifier si le build existe
const distPath = path.join(process.cwd(), 'dist', 'index.js');
const hasBuild = fs.existsSync(distPath);

if (hasBuild) {
  console.log('✅ Build trouvé, démarrage en mode production...');
  console.log('📁 Fichier:', distPath);
  
  // Démarrer avec le build
  const child = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  child.on('error', (error) => {
    console.error('❌ Erreur lors du démarrage:', error.message);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    console.log(`🛑 Application arrêtée avec le code: ${code}`);
    process.exit(code);
  });
  
} else {
  console.log('⚠️ Build non trouvé, démarrage en mode développement...');
  console.log('📁 Fichier source:', path.join(process.cwd(), 'server', 'index.ts'));
  
  // Démarrer avec tsx
  const child = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  child.on('error', (error) => {
    console.error('❌ Erreur lors du démarrage:', error.message);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    console.log(`🛑 Application arrêtée avec le code: ${code}`);
    process.exit(code);
  });
} 