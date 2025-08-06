#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🧪 Test du build Railway...');

// Vérifier que package.json existe
if (!fs.existsSync('package.json')) {
    console.error('❌ package.json non trouvé');
    process.exit(1);
}

// Vérifier que railway-build.sh existe
if (!fs.existsSync('railway-build.sh')) {
    console.error('❌ railway-build.sh non trouvé');
    process.exit(1);
}

// Vérifier que railway.toml existe
if (!fs.existsSync('railway.toml')) {
    console.error('❌ railway.toml non trouvé');
    process.exit(1);
}

try {
    // Nettoyer les builds précédents
    console.log('🧹 Nettoyage des builds précédents...');
    if (fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true, force: true });
    }
    
    // Exécuter le script de build
    console.log('🔨 Exécution du script de build...');
    execSync('./railway-build.sh', { 
        stdio: 'inherit',
        cwd: process.cwd()
    });
    
    // Vérifier que les fichiers de build existent
    console.log('✅ Vérification des fichiers de build...');
    
    if (!fs.existsSync('dist/index.js')) {
        throw new Error('dist/index.js non trouvé');
    }
    
    if (!fs.existsSync('dist/public')) {
        throw new Error('dist/public non trouvé');
    }
    
    console.log('✅ Build test réussi !');
    console.log('📁 Fichiers générés:');
    console.log('   - dist/index.js');
    console.log('   - dist/public/');
    
} catch (error) {
    console.error('❌ Erreur lors du test de build:', error.message);
    process.exit(1);
} 