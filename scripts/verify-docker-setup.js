#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔍 Vérification complète de la configuration Docker...');

// Liste des fichiers critiques
const criticalFiles = [
    'Dockerfile',
    'package.json',
    'railway-build.sh',
    'server/index.ts',
    '.dockerignore',
    '.npmrc'
];

// Liste des scripts critiques
const criticalScripts = [
    'railway-build.sh',
    'scripts/test-railway-build.js',
    'scripts/test-docker-build.js'
];

try {
    console.log('📁 Vérification des fichiers critiques...');
    
    // Vérifier que tous les fichiers critiques existent
    for (const file of criticalFiles) {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} - Présent`);
        } else {
            console.log(`❌ ${file} - Manquant`);
            process.exit(1);
        }
    }
    
    console.log('🔧 Vérification des permissions des scripts...');
    
    // Vérifier et corriger les permissions des scripts
    for (const script of criticalScripts) {
        if (fs.existsSync(script)) {
            const stats = fs.statSync(script);
            const isExecutable = (stats.mode & fs.constants.S_IXUSR) !== 0;
            
            if (isExecutable) {
                console.log(`✅ ${script} - Exécutable`);
            } else {
                console.log(`⚠️ ${script} - Non exécutable, correction...`);
                execSync(`chmod +x ${script}`, { stdio: 'inherit' });
                console.log(`✅ ${script} - Rendu exécutable`);
            }
        } else {
            console.log(`⚠️ ${script} - Non trouvé (optionnel)`);
        }
    }
    
    console.log('📋 Vérification du contenu du Dockerfile...');
    
    // Vérifier le contenu du Dockerfile
    const dockerfileContent = fs.readFileSync('Dockerfile', 'utf8');
    
    const requiredPatterns = [
        'FROM node:',
        'COPY package',
        'COPY railway-build.sh',
        'RUN chmod +x railway-build.sh',
        'RUN npm ci',
        'COPY . .',
        './railway-build.sh',
        'USER nextjs',
        'EXPOSE 5000',
        'CMD ["npm", "start"]'
    ];
    
    for (const pattern of requiredPatterns) {
        if (dockerfileContent.includes(pattern)) {
            console.log(`✅ Dockerfile contient: ${pattern}`);
        } else {
            console.log(`❌ Dockerfile manque: ${pattern}`);
            process.exit(1);
        }
    }
    
    console.log('📦 Vérification du package.json...');
    
    // Vérifier le package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts && packageJson.scripts.start) {
        console.log('✅ Script start présent dans package.json');
    } else {
        console.log('❌ Script start manquant dans package.json');
        process.exit(1);
    }
    
    console.log('🎯 Vérification de la configuration Railway...');
    
    // Vérifier les fichiers Railway
    const railwayFiles = ['railway.toml', 'nixpacks.toml'];
    
    for (const file of railwayFiles) {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} - Présent`);
        } else {
            console.log(`⚠️ ${file} - Manquant (optionnel pour Docker)`);
        }
    }
    
    console.log('✅ Vérification complète terminée avec succès !');
    console.log('🚀 Configuration Docker prête pour le déploiement');
    
} catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    process.exit(1);
} 