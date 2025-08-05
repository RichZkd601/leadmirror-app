#!/usr/bin/env node

/**
 * Script de health check simple pour Railway
 * Teste directement l'endpoint /api/health
 */

import http from 'http';

const PORT = process.env.PORT || 5000;
const HOST = 'localhost';
const HEALTH_PATH = '/api/health';

function simpleHealthCheck() {
  return new Promise((resolve, reject) => {
    console.log(`🔍 Test de health check sur http://${HOST}:${PORT}${HEALTH_PATH}`);
    
    const options = {
      hostname: HOST,
      port: PORT,
      path: HEALTH_PATH,
      method: 'GET',
      timeout: 5000, // 5 secondes timeout
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Status Code: ${res.statusCode}`);
        console.log(`📄 Response: ${data}`);
        
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log('✅ Health check réussi !');
            console.log(`📊 Status: ${response.status || 'ok'}`);
            console.log(`🌍 Environnement: ${response.environment || 'unknown'}`);
            resolve(true);
          } catch (error) {
            console.log('❌ Erreur parsing JSON');
            reject(error);
          }
        } else {
          console.log(`❌ Health check échoué avec status ${res.statusCode}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Erreur de connexion: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      console.log('⏰ Timeout du health check');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

async function main() {
  try {
    await simpleHealthCheck();
    process.exit(0);
  } catch (error) {
    console.log(`\n❌ Health check échoué: ${error.message}`);
    process.exit(1);
  }
}

main(); 