#!/usr/bin/env node

/**
 * Script de build pour la production LeadMirror
 * Build le frontend React et configure le serveur
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

async function buildProduction() {
  log('\n🚀 BUILD PRODUCTION LEADMIRROR', 'bold');
  log('==============================', 'bold');
  
  try {
    // 1. Vérifier que nous sommes dans le bon répertoire
    log('\n📁 Vérification du répertoire...', 'blue');
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json non trouvé. Assurez-vous d\'être dans le répertoire du projet.');
    }
    log('✅ Répertoire correct', 'green');
    
    // 2. Installer les dépendances si nécessaire
    log('\n📦 Vérification des dépendances...', 'blue');
    if (!fs.existsSync('node_modules')) {
      log('📦 Installation des dépendances...', 'yellow');
      execSync('npm install', { stdio: 'inherit' });
    }
    log('✅ Dépendances installées', 'green');
    
    // 3. Créer le dossier dist s'il n'existe pas
    log('\n📁 Création du dossier dist...', 'blue');
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath, { recursive: true });
    }
    log('✅ Dossier dist créé', 'green');
    
    // 4. Build du frontend React
    log('\n🔨 Build du frontend React...', 'blue');
    log('⏳ Cela peut prendre quelques minutes...', 'yellow');
    
    // Vérifier que le dossier client existe
    const clientPath = path.join(process.cwd(), 'client');
    if (!fs.existsSync(clientPath)) {
      throw new Error('Dossier client non trouvé');
    }
    
    // Build avec Vite
    execSync('npm run build', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    log('✅ Frontend buildé avec succès', 'green');
    
    // 5. Vérifier que le build a été créé
    log('\n🔍 Vérification du build...', 'blue');
    const buildPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(buildPath)) {
      throw new Error('Le dossier dist n\'a pas été créé');
    }
    
    const files = fs.readdirSync(buildPath);
    log(`📄 Fichiers créés: ${files.join(', ')}`, 'green');
    
    // 6. Copier les fichiers nécessaires pour le serveur
    log('\n📋 Configuration du serveur...', 'blue');
    
    // Créer le dossier public dans dist
    const publicPath = path.join(buildPath, 'public');
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
    }
    
    // Copier les fichiers buildés
    const buildFiles = fs.readdirSync(buildPath);
    for (const file of buildFiles) {
      if (file !== 'public') {
        const sourcePath = path.join(buildPath, file);
        const destPath = path.join(publicPath, file);
        
        if (fs.statSync(sourcePath).isDirectory()) {
          // Copier le dossier récursivement
          execSync(`cp -r "${sourcePath}" "${destPath}"`, { stdio: 'inherit' });
        } else {
          // Copier le fichier
          fs.copyFileSync(sourcePath, destPath);
        }
      }
    }
    
    log('✅ Serveur configuré', 'green');
    
    // 7. Test du build
    log('\n🧪 Test du build...', 'blue');
    const indexHtmlPath = path.join(publicPath, 'index.html');
    if (!fs.existsSync(indexHtmlPath)) {
      throw new Error('index.html non trouvé dans le build');
    }
    
    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
    if (!indexHtml.includes('LeadMirror')) {
      log('⚠️  Attention: index.html ne contient pas "LeadMirror"', 'yellow');
    }
    
    log('✅ Build testé avec succès', 'green');
    
    // 8. Résumé
    log('\n📊 RÉSUMÉ DU BUILD', 'bold');
    log('==================', 'bold');
    log('✅ Dépendances installées', 'green');
    log('✅ Frontend React buildé', 'green');
    log('✅ Serveur configuré', 'green');
    log('✅ Build testé', 'green');
    log(`📁 Dossier de build: ${publicPath}`, 'green');
    
    log('\n🎉 BUILD PRODUCTION TERMINÉ AVEC SUCCÈS !', 'green');
    log('Votre application est prête pour le déploiement !', 'green');
    
    log('\n📋 PROCHAINES ÉTAPES:', 'bold');
    log('1. Déployer sur Railway/Vercel', 'blue');
    log('2. Configurer les variables d\'environnement', 'blue');
    log('3. Tester en production', 'blue');
    
  } catch (error) {
    log(`\n❌ ERREUR LORS DU BUILD: ${error.message}`, 'red');
    log('Vérifiez que toutes les dépendances sont installées', 'yellow');
    process.exit(1);
  }
}

// Exécuter le build
buildProduction(); 