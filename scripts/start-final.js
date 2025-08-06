#!/usr/bin/env node

/**
 * Script de démarrage final pour LeadMirror
 * Donne toutes les options à l'utilisateur
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎯 LeadMirror - Script de Démarrage Final\n');

console.log('📋 Options disponibles :');
console.log('1. 🚀 Serveur simple (recommandé pour développement)');
console.log('   - Fonctionne sans base de données');
console.log('   - Accès immédiat à localhost');
console.log('   - Frontend complet');
console.log('');
console.log('2. 🔧 Serveur complet avec base de données');
console.log('   - Toutes les fonctionnalités');
console.log('   - Nécessite DATABASE_URL configurée');
console.log('   - Fonctionnalités IA (si OPENAI_API_KEY configurée)');
console.log('');
console.log('3. 🧪 Serveur de test');
console.log('   - Pour tests de health check');
console.log('   - Fonctionne en arrière-plan');
console.log('');
console.log('4. 🔍 Diagnostic complet');
console.log('   - Vérifie tous les composants');
console.log('   - Test de la base de données');
console.log('   - Analyse des problèmes');
console.log('');

// Fonction pour démarrer le serveur simple
function startSimpleServer() {
  console.log('🚀 Démarrage du serveur simple...');
  console.log('💡 Accès: http://localhost:3001');
  console.log('💡 Health check: http://localhost:3001/api/health');
  console.log('');
  
  const server = spawn('npm', ['run', 'start-simple'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: '3001'
    }
  });

  server.on('error', (error) => {
    console.error('❌ Erreur:', error);
  });

  return server;
}

// Fonction pour démarrer le serveur complet
function startFullServer() {
  console.log('🔧 Démarrage du serveur complet...');
  console.log('💡 Accès: http://localhost:5000');
  console.log('💡 Health check: http://localhost:5000/api/health');
  console.log('');
  
  const server = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: '5000'
    }
  });

  server.on('error', (error) => {
    console.error('❌ Erreur:', error);
  });

  return server;
}

// Fonction pour démarrer le serveur de test
function startTestServer() {
  console.log('🧪 Démarrage du serveur de test...');
  console.log('💡 Health check: http://localhost:8080/api/health');
  console.log('');
  
  const server = spawn('npm', ['run', 'test-server'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: '8080'
    }
  });

  return server;
}

// Fonction pour diagnostic
function runDiagnostic() {
  console.log('🔍 Lancement du diagnostic complet...');
  console.log('');
  
  const diagnostic = spawn('npm', ['run', 'diagnose-health'], {
    stdio: 'inherit',
    shell: true
  });

  return diagnostic;
}

// Fonction pour tester la base de données
function testDatabase() {
  console.log('🗄️ Test de la base de données...');
  console.log('');
  
  const test = spawn('npm', ['run', 'test-database'], {
    stdio: 'inherit',
    shell: true
  });

  return test;
}

// Fonction principale
async function main() {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Choisissez une option (1-4) ou "q" pour quitter: ', (answer) => {
    rl.close();
    
    switch (answer.trim()) {
      case '1':
        console.log('✅ Option 1 sélectionnée: Serveur simple');
        startSimpleServer();
        break;
        
      case '2':
        console.log('✅ Option 2 sélectionnée: Serveur complet');
        startFullServer();
        break;
        
      case '3':
        console.log('✅ Option 3 sélectionnée: Serveur de test');
        startTestServer();
        break;
        
      case '4':
        console.log('✅ Option 4 sélectionnée: Diagnostic complet');
        runDiagnostic();
        break;
        
      case 'q':
      case 'Q':
        console.log('👋 Au revoir !');
        process.exit(0);
        break;
        
      default:
        console.log('❌ Option invalide. Utilisation du serveur simple par défaut...');
        startSimpleServer();
        break;
    }
  });
}

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt...');
  process.exit(0);
});

// Démarrage
main(); 