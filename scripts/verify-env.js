#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Vérification des variables d\'environnement...');

const requiredVars = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'NODE_ENV'
];

const optionalVars = [
  'OPENAI_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
];

let hasErrors = false;

// Vérifier les variables obligatoires
console.log('\n📋 Variables obligatoires:');
for (const varName of requiredVars) {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NON DÉFINIE`);
    hasErrors = true;
  }
}

// Vérifier les variables optionnelles
console.log('\n📋 Variables optionnelles:');
for (const varName of optionalVars) {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`⚠️  ${varName}: NON DÉFINIE (optionnelle)`);
  }
}

// Vérifier le port
const port = process.env.PORT || 5000;
console.log(`\n🌐 Port: ${port}`);

if (hasErrors) {
  console.log('\n❌ ERREUR: Variables d\'environnement manquantes !');
  console.log('💡 Assurez-vous de configurer les variables obligatoires sur Railway.');
  process.exit(1);
} else {
  console.log('\n✅ Toutes les variables obligatoires sont définies !');
} 