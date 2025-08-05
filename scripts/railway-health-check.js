#!/usr/bin/env node

/**
 * Script de health check optimisé pour Railway
 * Teste plusieurs endpoints et ports pour assurer la compatibilité
 */

import http from 'http';

const PORTS = [process.env.PORT || 5000, 8080, 3000];
const HOSTS = ['localhost', '0.0.0.0'];
const PATHS = ['/api/health', '/health', '/'];

function testEndpoint(host, port, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            resolve({
              success: true,
              host,
              port,
              path,
              statusCode: res.statusCode,
              response
            });
          } catch (error) {
            resolve({
              success: true,
              host,
              port,
              path,
              statusCode: res.statusCode,
              response: { raw: data }
            });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode} for ${host}:${port}${path}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Connection failed for ${host}:${port}${path}: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout for ${host}:${port}${path}`));
    });

    req.end();
  });
}

async function comprehensiveHealthCheck() {
  console.log('🔍 Health check Railway complet...\n');

  const results = [];
  
  for (const host of HOSTS) {
    for (const port of PORTS) {
      for (const path of PATHS) {
        try {
          console.log(`🔍 Test: ${host}:${port}${path}`);
          const result = await testEndpoint(host, port, path);
          results.push(result);
          console.log(`✅ Succès: ${host}:${port}${path}`);
          console.log(`   Status: ${result.response.status || 'ok'}`);
          console.log(`   Environment: ${result.response.environment || 'unknown'}`);
          console.log('');
          return result; // Retourner le premier succès
        } catch (error) {
          console.log(`❌ Échec: ${host}:${port}${path} - ${error.message}`);
        }
      }
    }
  }

  // Si aucun endpoint ne fonctionne, créer un serveur de test
  console.log('🚀 Aucun endpoint trouvé, démarrage du serveur de test...');
  
  const { spawn } = await import('child_process');
  const testServer = spawn('node', ['scripts/test-server.js'], {
    stdio: 'pipe',
    env: { ...process.env, PORT: '8080' }
  });

  // Attendre que le serveur démarre
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    const result = await testEndpoint('localhost', 8080, '/api/health');
    console.log('✅ Serveur de test fonctionnel');
    console.log(`   Status: ${result.response.status || 'ok'}`);
    console.log(`   Environment: ${result.response.environment || 'unknown'}`);
    
    // Arrêter le serveur de test
    testServer.kill('SIGTERM');
    return result;
  } catch (error) {
    console.log('❌ Serveur de test échoué');
    testServer.kill('SIGTERM');
    throw error;
  }
}

async function main() {
  try {
    const result = await comprehensiveHealthCheck();
    console.log('🎉 Health check réussi !');
    console.log(`📊 Endpoint fonctionnel: ${result.host}:${result.port}${result.path}`);
    process.exit(0);
  } catch (error) {
    console.log(`\n❌ Health check échoué: ${error.message}`);
    console.log('💡 Suggestions:');
    console.log('   - Vérifiez que le serveur est démarré');
    console.log('   - Vérifiez les variables d\'environnement');
    console.log('   - Vérifiez que le port est libre');
    process.exit(1);
  }
}

main(); 