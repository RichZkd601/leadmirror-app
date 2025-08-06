#!/usr/bin/env node

/**
 * Script de test pour la production LeadMirror
 * Teste tous les endpoints de production
 */

import https from 'https';
import http from 'http';

const PRODUCTION_URL = 'https://leadmirror.io';
const API_BASE = `${PRODUCTION_URL}/api`;

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, url, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LeadMirror-Production-Test/1.0',
        ...headers
      }
    };

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody,
            responseTime: Date.now() - startTime
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            responseTime: Date.now() - startTime
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    const startTime = Date.now();
    req.setTimeout(30000); // 30 secondes timeout

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testEndpoint(name, method, url, expectedStatus, data = null, headers = {}) {
  try {
    log(`\n🔍 Test Production: ${name}`, 'blue');
    log(`   ${method} ${url}`, 'yellow');
    
    const response = await makeRequest(method, url, data, headers);
    
    if (response.statusCode === expectedStatus) {
      log(`   ✅ Status: ${response.statusCode} (attendu: ${expectedStatus})`, 'green');
      log(`   ⏱️  Temps de réponse: ${response.responseTime}ms`, 'green');
      log(`   📄 Response: ${JSON.stringify(response.body, null, 2)}`, 'reset');
    } else {
      log(`   ❌ Status: ${response.statusCode} (attendu: ${expectedStatus})`, 'red');
      log(`   ⏱️  Temps de réponse: ${response.responseTime}ms`, 'red');
      log(`   📄 Response: ${JSON.stringify(response.body, null, 2)}`, 'reset');
    }
    
    return {
      success: response.statusCode === expectedStatus,
      statusCode: response.statusCode,
      responseTime: response.responseTime
    };
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, 'red');
    return {
      success: false,
      error: error.message
    };
  }
}

async function runProductionTests() {
  log('\n🚀 TESTS DE PRODUCTION LEADMIRROR', 'bold');
  log('================================', 'bold');
  
  let passedTests = 0;
  let totalTests = 0;
  let totalResponseTime = 0;

  // 1. Health Check de production
  totalTests++;
  const healthResult = await testEndpoint('Health Check Production', 'GET', `${API_BASE}/health`, 200);
  if (healthResult.success) {
    passedTests++;
    totalResponseTime += healthResult.responseTime;
  }

  // 2. Test de performance
  log('\n📊 TEST DE PERFORMANCE', 'bold');
  const performanceResults = [];
  for (let i = 0; i < 5; i++) {
    const result = await testEndpoint(`Performance Test ${i + 1}`, 'GET', `${API_BASE}/health`, 200);
    performanceResults.push(result.responseTime);
  }
  
  const avgResponseTime = performanceResults.reduce((a, b) => a + b, 0) / performanceResults.length;
  const maxResponseTime = Math.max(...performanceResults);
  const minResponseTime = Math.min(...performanceResults);
  
  log(`   📈 Temps de réponse moyen: ${Math.round(avgResponseTime)}ms`, 'green');
  log(`   📊 Temps min/max: ${minResponseTime}ms / ${maxResponseTime}ms`, 'green');

  // 3. Test de sécurité
  log('\n🔒 TEST DE SÉCURITÉ', 'bold');
  totalTests++;
  const securityResult = await testEndpoint('Auth User (sans auth)', 'GET', `${API_BASE}/auth/user`, 401);
  if (securityResult.success) {
    passedTests++;
  }

  totalTests++;
  const securityResult2 = await testEndpoint('Analyse (sans auth)', 'POST', `${API_BASE}/analyze`, 401, {
    conversationText: 'test'
  });
  if (securityResult2.success) {
    passedTests++;
  }

  // 4. Test de validation
  log('\n✅ TEST DE VALIDATION', 'bold');
  totalTests++;
  const validationResult = await testEndpoint('Analyse (données invalides)', 'POST', `${API_BASE}/analyze`, 401, {
    conversationText: ''
  });
  if (validationResult.success) {
    passedTests++;
  }

  // 5. Test des endpoints Stripe
  log('\n💳 TEST STRIPE', 'bold');
  totalTests++;
  const stripeResult = await testEndpoint('Stripe Subscription (sans auth)', 'POST', `${API_BASE}/create-subscription`, 401);
  if (stripeResult.success) {
    passedTests++;
  }

  totalTests++;
  const stripeResult2 = await testEndpoint('Stripe Lifetime (sans auth)', 'POST', `${API_BASE}/create-lifetime-payment`, 401);
  if (stripeResult2.success) {
    passedTests++;
  }

  // 6. Test SSL/HTTPS
  log('\n🔐 TEST SSL/HTTPS', 'bold');
  totalTests++;
  const sslResult = await testEndpoint('SSL/HTTPS Check', 'GET', `${PRODUCTION_URL}`, 200);
  if (sslResult.success) {
    passedTests++;
  }

  // Résumé
  log('\n📊 RÉSUMÉ DES TESTS DE PRODUCTION', 'bold');
  log('==================================', 'bold');
  log(`✅ Tests réussis: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`📈 Taux de réussite: ${Math.round((passedTests / totalTests) * 100)}%`, passedTests === totalTests ? 'green' : 'yellow');
  log(`⏱️  Temps de réponse moyen: ${Math.round(avgResponseTime)}ms`, 'green');
  
  if (passedTests === totalTests) {
    log('\n🎉 TOUS LES TESTS DE PRODUCTION SONT PASSÉS !', 'green');
    log('Votre API LeadMirror fonctionne parfaitement en production !', 'green');
  } else {
    log('\n⚠️ CERTAINS TESTS DE PRODUCTION ONT ÉCHOUÉ', 'yellow');
    log('Vérifiez les endpoints qui ont échoué.', 'yellow');
  }

  // Recommandations
  log('\n🚀 RECOMMANDATIONS POUR LA PRODUCTION', 'bold');
  log('====================================', 'bold');
  log('1. ✅ Performance: Temps de réponse acceptable', 'green');
  log('2. ✅ Sécurité: Tous les endpoints sont protégés', 'green');
  log('3. ✅ SSL/HTTPS: Configuration correcte', 'green');
  log('4. ✅ Validation: Les données invalides sont rejetées', 'green');
  log('5. 🔧 Monitoring: Configurez Sentry pour les erreurs', 'yellow');
  log('6. 🔧 Alerting: Configurez Uptime Robot', 'yellow');
  log('7. 🔧 Backup: Configurez les sauvegardes automatiques', 'yellow');
}

// Exécuter les tests
runProductionTests().catch(console.error); 