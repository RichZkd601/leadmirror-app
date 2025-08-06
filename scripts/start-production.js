#!/usr/bin/env node

/**
 * Script de démarrage pour la production LeadMirror
 * Build le frontend et démarre le serveur
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function startProduction() {
  log('\n🚀 DÉMARRAGE PRODUCTION LEADMIRROR', 'bold');
  log('==================================', 'bold');
  
  try {
    // 1. Vérifier l'environnement
    log('\n🔍 Vérification de l\'environnement...', 'blue');
    if (process.env.NODE_ENV !== 'production') {
      log('⚠️  NODE_ENV n\'est pas défini sur "production"', 'yellow');
      log('💡 Définition automatique de NODE_ENV=production', 'yellow');
      process.env.NODE_ENV = 'production';
    }
    log('✅ Environnement: production', 'green');
    
    // 2. Vérifier si le build existe
    log('\n📁 Vérification du build...', 'blue');
    const possiblePaths = [
      path.resolve(process.cwd(), 'dist', 'public'),
      path.resolve(process.cwd(), 'dist'),
      path.resolve(process.cwd(), 'client', 'dist'),
      path.resolve(process.cwd(), 'build'),
    ];
    
    let buildExists = false;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        log(`✅ Build trouvé: ${testPath}`, 'green');
        buildExists = true;
        break;
      }
    }
    
    // 3. Build si nécessaire
    if (!buildExists) {
      log('\n🔨 Build du frontend...', 'blue');
      log('⏳ Cela peut prendre quelques minutes...', 'yellow');
      
      try {
        execSync('npm run build', { 
          stdio: 'inherit',
          cwd: process.cwd(),
          env: { ...process.env, NODE_ENV: 'production' }
        });
        log('✅ Build terminé avec succès', 'green');
      } catch (error) {
        log('❌ Erreur lors du build', 'red');
        log('💡 Tentative de build manuel...', 'yellow');
        
        // Build manuel
        execSync('npx vite build', { 
          stdio: 'inherit',
          cwd: process.cwd(),
          env: { ...process.env, NODE_ENV: 'production' }
        });
        log('✅ Build manuel terminé', 'green');
      }
    }
    
    // 4. Vérifier les variables d'environnement
    log('\n🔧 Vérification des variables d\'environnement...', 'blue');
    const requiredVars = ['PORT', 'SESSION_SECRET'];
    const optionalVars = ['DATABASE_URL', 'OPENAI_API_KEY', 'STRIPE_SECRET_KEY'];
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        log(`⚠️  Variable requise manquante: ${varName}`, 'yellow');
      } else {
        log(`✅ ${varName}: configuré`, 'green');
      }
    }
    
    for (const varName of optionalVars) {
      if (!process.env[varName]) {
        log(`⚠️  Variable optionnelle manquante: ${varName}`, 'yellow');
      } else {
        log(`✅ ${varName}: configuré`, 'green');
      }
    }
    
    // 5. Démarrer le serveur
    log('\n🚀 Démarrage du serveur de production...', 'blue');
    log('⏳ Serveur en cours de démarrage...', 'yellow');
    
    // Démarrer le serveur avec tsx
    execSync('npx tsx server/index.ts', { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { 
        ...process.env, 
        NODE_ENV: 'production',
        PORT: process.env.PORT || '5000'
      }
    });
    
  } catch (error) {
    log(`\n❌ ERREUR LORS DU DÉMARRAGE: ${error.message}`, 'red');
    log('Vérifiez que toutes les dépendances sont installées', 'yellow');
    process.exit(1);
  }
}

// Exécuter le démarrage
startProduction(); 