#!/usr/bin/env node

/**
 * Script de health check pour Railway
 * Usage: node scripts/health-check.js
 */

import http from 'http';
import https from 'https';

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
const HEALTH_PATH = '/api/health';

function checkHealth() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: HEALTH_PATH,
      method: 'GET',
      timeout: 10000, // 10 secondes timeout
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ Health check réussi');
            console.log(`📊 Status: ${response.status || 'ok'}`);
            console.log(`🌍 Environnement: ${response.environment || 'unknown'}`);
            console.log(`🔌 Port: ${response.port || PORT}`);
            console.log(`🗄️  Base de données: ${response.database || 'unknown'}`);
            resolve(true);
          } else {
            console.log('❌ Health check échoué');
            console.log(`📊 Status Code: ${res.statusCode}`);
            console.log(`📄 Response: ${data}`);
            reject(new Error(`Health check failed with status ${res.statusCode}`));
          }
        } catch (error) {
          console.log('❌ Erreur parsing response');
          console.log(`📄 Response: ${data}`);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Erreur de connexion');
      console.log(`🔍 Erreur: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      console.log('⏰ Timeout du health check');
      req.destroy();
      reject(new Error('Health check timeout'));
    });

    req.end();
  });
}

async function main() {
  console.log('🔍 Health check Railway en cours...');
  console.log(`🌐 URL: http://${HOST}:${PORT}${HEALTH_PATH}`);
  console.log(`⏰ Timeout: 10 secondes\n`);

  try {
    await checkHealth();
    process.exit(0);
  } catch (error) {
    console.log(`\n❌ Health check échoué: ${error.message}`);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { checkHealth }; 