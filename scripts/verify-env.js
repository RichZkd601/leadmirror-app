#!/usr/bin/env node

/**
 * Script de vérification des variables d'environnement pour Railway
 * Usage: node scripts/verify-env.js
 */

const requiredVars = {
  'DATABASE_URL': 'URL de la base de données Neon',
  'NODE_ENV': 'Environnement (production/development)',
  'SESSION_SECRET': 'Clé secrète pour les sessions',
};

const optionalVars = {
  'OPENAI_API_KEY': 'Clé API OpenAI pour les analyses IA',
  'STRIPE_SECRET_KEY': 'Clé secrète Stripe pour les paiements',
  'STRIPE_WEBHOOK_SECRET': 'Secret webhook Stripe',
  'GOOGLE_CLIENT_ID': 'ID client Google OAuth',
  'GOOGLE_CLIENT_SECRET': 'Secret client Google OAuth',
  'PUBLIC_OBJECT_SEARCH_PATHS': 'Chemins de recherche d\'objets publics',
  'PRIVATE_OBJECT_DIR': 'Répertoire d\'objets privés',
};

console.log('🔍 Vérification des variables d\'environnement Railway...\n');

let hasErrors = false;
let hasWarnings = false;

// Vérifier les variables requises
console.log('📋 Variables Requises:');
for (const [varName, description] of Object.entries(requiredVars)) {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${description}`);
    if (varName === 'DATABASE_URL') {
      // Masquer partiellement l'URL de la base de données
      const masked = value.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
      console.log(`     Valeur: ${masked}`);
    }
  } else {
    console.log(`  ❌ ${varName}: ${description} - MANQUANTE`);
    hasErrors = true;
  }
}

console.log('\n📋 Variables Optionnelles:');
for (const [varName, description] of Object.entries(optionalVars)) {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${description}`);
  } else {
    console.log(`  ⚠️  ${varName}: ${description} - NON CONFIGURÉE`);
    hasWarnings = true;
  }
}

console.log('\n📊 Informations Système:');
console.log(`  🖥️  Node.js: ${process.version}`);
console.log(`  🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
console.log(`  🔌 Port: ${process.env.PORT || '5000'}`);
console.log(`  📁 Répertoire: ${process.cwd()}`);

// Vérifier la connectivité de la base de données si DATABASE_URL est présente
if (process.env.DATABASE_URL) {
  console.log('\n🔗 Test de connexion à la base de données...');
  try {
    const { Pool } = await import('@neondatabase/serverless');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT 1 as test');
    await pool.end();
    
    if (result.rows.length > 0) {
      console.log('  ✅ Connexion à la base de données réussie');
    } else {
      console.log('  ❌ Connexion à la base de données échouée');
      hasErrors = true;
    }
  } catch (error) {
    console.log(`  ❌ Erreur de connexion à la base de données: ${error.message}`);
    hasErrors = true;
  }
}

// Résumé
console.log('\n📋 Résumé:');
if (hasErrors) {
  console.log('  ❌ ERREURS: Variables requises manquantes');
  process.exit(1);
} else if (hasWarnings) {
  console.log('  ⚠️  AVERTISSEMENTS: Variables optionnelles non configurées');
  console.log('  ✅ Configuration minimale OK pour le déploiement');
} else {
  console.log('  ✅ Configuration complète OK');
}

console.log('\n🚀 Prêt pour le déploiement Railway!'); 