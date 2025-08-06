#!/usr/bin/env node

/**
 * Script de déploiement frontend pour LeadMirror
 * Build et déploie le frontend en production
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

async function deployFrontend() {
  log('\n🚀 DÉPLOIEMENT FRONTEND LEADMIRROR', 'bold');
  log('==================================', 'bold');
  
  try {
    // 1. Vérifier Git
    log('\n🔍 Vérification Git...', 'blue');
    try {
      execSync('git status', { stdio: 'pipe' });
      log('✅ Git configuré', 'green');
    } catch (error) {
      log('❌ Git non configuré', 'red');
      log('💡 Initialisez Git avec: git init', 'yellow');
      return;
    }
    
    // 2. Build du frontend
    log('\n🔨 Build du frontend...', 'blue');
    try {
      execSync('npm run build-prod', { stdio: 'inherit' });
      log('✅ Frontend buildé', 'green');
    } catch (error) {
      log('❌ Erreur lors du build', 'red');
      return;
    }
    
    // 3. Vérifier le build
    log('\n🔍 Vérification du build...', 'blue');
    const buildPath = path.join(process.cwd(), 'dist', 'public');
    if (!fs.existsSync(buildPath)) {
      log('❌ Dossier de build non trouvé', 'red');
      return;
    }
    
    const files = fs.readdirSync(buildPath);
    log(`📄 Fichiers buildés: ${files.join(', ')}`, 'green');
    
    // 4. Vérifier index.html
    const indexPath = path.join(buildPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      log('❌ index.html non trouvé', 'red');
      return;
    }
    
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    if (!indexContent.includes('LeadMirror')) {
      log('⚠️  Attention: index.html ne contient pas "LeadMirror"', 'yellow');
    }
    log('✅ index.html vérifié', 'green');
    
    // 5. Commit et push
    log('\n📝 Commit et push...', 'blue');
    try {
      // Ajouter tous les fichiers
      execSync('git add .', { stdio: 'inherit' });
      log('✅ Fichiers ajoutés', 'green');
      
      // Commit
      const commitMessage = `Deploy frontend build - ${new Date().toISOString()}`;
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      log('✅ Commit créé', 'green');
      
      // Push
      execSync('git push', { stdio: 'inherit' });
      log('✅ Push effectué', 'green');
      
    } catch (error) {
      log('❌ Erreur lors du commit/push', 'red');
      log('💡 Vérifiez votre configuration Git', 'yellow');
      return;
    }
    
    // 6. Configuration Railway
    log('\n🔧 Configuration Railway...', 'blue');
    log('📋 Variables d\'environnement à configurer:', 'yellow');
    log('NODE_ENV=production', 'blue');
    log('PORT=5000', 'blue');
    log('SESSION_SECRET=votre-secret-très-sécurisé', 'blue');
    log('DATABASE_URL=postgresql://...', 'blue');
    log('OPENAI_API_KEY=sk-...', 'blue');
    log('STRIPE_SECRET_KEY=sk_live_...', 'blue');
    log('STRIPE_PUBLISHABLE_KEY=pk_live_51RrCDDF1s37tn7hIkrZF8MiKBNHWgoyR8mBa25TZevpJKnnUfHDQs411BpFuGZjc4hzLdgrPrzXmvCXsb6tvbceO00JF2AY2Iu', 'blue');
    log('VITE_STRIPE_PUBLIC_KEY=pk_live_51RrCDDF1s37tn7hIkrZF8MiKBNHWgoyR8mBa25TZevpJKnnUfHDQs411BpFuGZjc4hzLdgrPrzXmvCXsb6tvbceO00JF2AY2Iu', 'blue');
    
    // 7. Instructions de déploiement
    log('\n📋 INSTRUCTIONS DE DÉPLOIEMENT', 'bold');
    log('==============================', 'bold');
    log('1. Allez sur Railway Dashboard', 'blue');
    log('2. Sélectionnez votre projet LeadMirror', 'blue');
    log('3. Allez dans "Variables"', 'blue');
    log('4. Ajoutez toutes les variables ci-dessus', 'blue');
    log('5. Allez dans "Settings"', 'blue');
    log('6. Configurez:', 'blue');
    log('   - Build Command: npm run build-prod', 'blue');
    log('   - Start Command: npm run start-prod', 'blue');
    log('7. Déployez !', 'blue');
    
    // 8. Test après déploiement
    log('\n🧪 Test après déploiement:', 'blue');
    log('curl -s https://leadmirror.io/ | grep -i "leadmirror"', 'yellow');
    log('Devrait retourner du HTML avec "LeadMirror"', 'green');
    
    // 9. Résumé
    log('\n📊 RÉSUMÉ DU DÉPLOIEMENT', 'bold');
    log('=======================', 'bold');
    log('✅ Frontend buildé', 'green');
    log('✅ Build vérifié', 'green');
    log('✅ Commit et push effectués', 'green');
    log('🔧 Configuration Railway à faire', 'yellow');
    log('🧪 Test après déploiement à faire', 'yellow');
    
    log('\n🎉 DÉPLOIEMENT FRONTEND TERMINÉ !', 'green');
    log('Configurez Railway et testez https://leadmirror.io', 'green');
    
  } catch (error) {
    log(`\n❌ ERREUR LORS DU DÉPLOIEMENT: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Exécuter le déploiement
deployFrontend(); 