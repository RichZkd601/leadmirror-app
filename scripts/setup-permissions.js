#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔧 Configuration des permissions...');

try {
    // Vérifier que railway-build.sh existe
    if (fs.existsSync('railway-build.sh')) {
        // Rendre le script exécutable
        execSync('chmod +x railway-build.sh', { stdio: 'inherit' });
        console.log('✅ railway-build.sh rendu exécutable');
    } else {
        console.log('⚠️ railway-build.sh non trouvé (normal en développement)');
    }
    
    // Vérifier que d'autres scripts existent et les rendre exécutables
    const scripts = [
        'railway-build.sh',
        'scripts/test-railway-build.js',
        'scripts/test-docker-build.js'
    ];
    
    scripts.forEach(script => {
        if (fs.existsSync(script)) {
            try {
                execSync(`chmod +x ${script}`, { stdio: 'ignore' });
                console.log(`✅ ${script} rendu exécutable`);
            } catch (error) {
                console.log(`⚠️ Impossible de rendre ${script} exécutable:`, error.message);
            }
        }
    });
    
} catch (error) {
    console.error('❌ Erreur lors de la configuration des permissions:', error.message);
    process.exit(1);
} 