#!/usr/bin/env node

/**
 * Script de démarrage robuste pour le développement
 * Gère les erreurs et fournit des logs détaillés
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Démarrage robuste de LeadMirror...\n');

// Vérifier les variables d'environnement
console.log('📋 Variables d\'environnement :');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   PORT: ${process.env.PORT || '5000'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Définie' : '❌ Non définie'}`);
console.log(`   SESSION_SECRET: ${process.env.SESSION_SECRET ? '✅ Définie' : '❌ Non définie'}\n`);

// Créer un fichier .env basique si nécessaire
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️ Fichier .env non trouvé, création d\'un fichier basique...');
  const envExample = path.join(__dirname, '..', 'env.example');
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envPath);
    console.log('✅ Fichier .env créé à partir de env.example');
  }
}

// Fonction pour démarrer le serveur avec logs détaillés
function startServer() {
  console.log('🔥 Démarrage du serveur principal...');
  
  const server = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: process.env.PORT || '8080'
    }
  });

  server.on('error', (error) => {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
  });

  server.on('close', (code) => {
    console.log(`\n👋 Serveur arrêté avec le code: ${code}`);
    if (code !== 0) {
      console.log('💡 Suggestions de dépannage :');
      console.log('   - Vérifiez les variables d\'environnement');
      console.log('   - Assurez-vous que le port est libre');
      console.log('   - Vérifiez les logs d\'erreur ci-dessus');
    }
  });

  return server;
}

// Fonction pour tester le serveur
async function testServer() {
  const port = process.env.PORT || '8080';
  console.log(`\n🔍 Test du serveur sur le port ${port}...`);
  
  // Attendre que le serveur démarre
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    const { execSync } = await import('child_process');
    const response = execSync(`curl -s http://localhost:${port}/api/health`, { 
      stdio: 'pipe',
      timeout: 10000 
    });
    console.log('✅ Serveur fonctionnel !');
    console.log(`📄 Réponse: ${response.toString()}`);
  } catch (error) {
    console.log('❌ Serveur non accessible');
    console.log('💡 Le serveur peut prendre plus de temps à démarrer...');
  }
}

// Fonction pour démarrer le serveur de test en fallback
function startTestServer() {
  console.log('\n🚀 Démarrage du serveur de test en fallback...');
  
  const testServer = spawn('npm', ['run', 'test-server'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: '8080'
    }
  });

  return testServer;
}

// Fonction principale
async function main() {
  try {
    // Démarrer le serveur principal
    const server = startServer();
    
    // Tester le serveur après un délai
    setTimeout(async () => {
      await testServer();
    }, 3000);
    
    // Gestion de l'arrêt propre
    process.on('SIGINT', () => {
      console.log('\n🛑 Arrêt du serveur...');
      server.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Arrêt du serveur...');
      server.kill('SIGTERM');
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    console.log('🚀 Démarrage du serveur de test en fallback...');
    startTestServer();
  }
}

main(); 