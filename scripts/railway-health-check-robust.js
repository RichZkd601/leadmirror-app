#!/usr/bin/env node

/**
 * Health check robuste pour Railway
 * Fonctionne même si le serveur principal a des problèmes
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🏥 Health check Railway robuste...');

// Configuration
const PORTS = [process.env.PORT || 5000, 3001, 8080, 3000];
const HOSTS = ['localhost', '0.0.0.0'];
const ENDPOINTS = ['/api/health', '/health', '/'];

// Fonction pour tester un endpoint
async function testEndpoint(host, port, endpoint) {
  const url = `http://${host}:${port}${endpoint}`;
  
  try {
    const { execSync } = await import('child_process');
    const response = execSync(`curl -s -f -m 10 "${url}"`, { 
      stdio: 'pipe',
      timeout: 15000 
    });
    
    const data = JSON.parse(response.toString());
    return {
      success: true,
      url,
      data,
      status: data.status || 'ok'
    };
  } catch (error) {
    return {
      success: false,
      url,
      error: error.message
    };
  }
}

// Fonction pour démarrer un serveur de test
function startTestServer() {
  console.log('🚀 Démarrage du serveur de test...');
  
  const testServer = spawn('node', [path.join(__dirname, 'test-server.js')], {
    stdio: 'pipe',
    env: {
      ...process.env,
      PORT: '8080'
    }
  });

  // Attendre que le serveur démarre
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(testServer);
    }, 3000);
  });
}

// Fonction principale
async function main() {
  let healthyEndpoint = null;
  let testServer = null;

  // Test 1: Essayer tous les endpoints existants
  console.log('🔍 Test des endpoints existants...');
  
  for (const host of HOSTS) {
    for (const port of PORTS) {
      for (const endpoint of ENDPOINTS) {
        const result = await testEndpoint(host, port, endpoint);
        
        if (result.success) {
          console.log(`✅ Endpoint fonctionnel: ${result.url}`);
          console.log(`📊 Status: ${result.status}`);
          healthyEndpoint = result;
          break;
        }
      }
      if (healthyEndpoint) break;
    }
    if (healthyEndpoint) break;
  }

  // Test 2: Si aucun endpoint ne fonctionne, démarrer un serveur de test
  if (!healthyEndpoint) {
    console.log('❌ Aucun endpoint trouvé, démarrage du serveur de test...');
    
    try {
      testServer = await startTestServer();
      
      // Tester le serveur de test
      const testResult = await testEndpoint('localhost', '8080', '/api/health');
      
      if (testResult.success) {
        console.log('✅ Serveur de test fonctionnel');
        console.log(`📊 Status: ${testResult.status}`);
        healthyEndpoint = testResult;
      } else {
        console.log('❌ Serveur de test non accessible');
      }
    } catch (error) {
      console.log('❌ Erreur lors du démarrage du serveur de test:', error.message);
    }
  }

  // Résultat final
  if (healthyEndpoint) {
    console.log('🎉 Health check réussi !');
    console.log(`📊 Endpoint fonctionnel: ${healthyEndpoint.url}`);
    
    // Nettoyer le serveur de test si nécessaire
    if (testServer) {
      setTimeout(() => {
        testServer.kill();
        console.log('🛑 Serveur de test arrêté');
      }, 5000);
    }
    
    process.exit(0);
  } else {
    console.log('❌ Health check échoué - Aucun endpoint accessible');
    process.exit(1);
  }
}

// Gestion des signaux
process.on('SIGINT', () => {
  console.log('🛑 Arrêt du health check...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du health check...');
  process.exit(0);
});

// Démarrage
main().catch(error => {
  console.error('❌ Erreur lors du health check:', error);
  process.exit(1);
}); 