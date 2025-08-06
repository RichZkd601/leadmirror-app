#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🧪 Test du build Docker...');

try {
  // Vérifier que Docker est disponible
  console.log('🔍 Vérification de Docker...');
  execSync('docker --version', { stdio: 'inherit' });
  
  // Nettoyer les images précédentes
  console.log('🧹 Nettoyage des images précédentes...');
  try {
    execSync('docker rmi leadmirror-test:latest', { stdio: 'inherit' });
  } catch (e) {
    // Ignorer si l'image n'existe pas
  }
  
  // Build de l'image Docker
  console.log('🔨 Build de l\'image Docker...');
  execSync('docker build -t leadmirror-test:latest .', { stdio: 'inherit' });
  
  // Vérifier que l'image a été créée
  console.log('🔍 Vérification de l\'image...');
  execSync('docker images leadmirror-test:latest', { stdio: 'inherit' });
  
  console.log('✅ Test Docker réussi !');
  
} catch (error) {
  console.error('❌ Erreur lors du test Docker:', error.message);
  process.exit(1);
} 