#!/usr/bin/env node

/**
 * Script de test de la base de données Neon
 */

import { Pool } from '@neondatabase/serverless';
import ws from "ws";
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Test de connexion à la base de données Neon...\n');

// Charger les variables d'environnement
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL non définie dans le fichier .env');
  process.exit(1);
}

console.log('📋 Configuration :');
console.log(`   DATABASE_URL: ${DATABASE_URL.substring(0, 50)}...`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`);

// Configurer Neon
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

async function testDatabaseConnection() {
  let pool;
  
  try {
    console.log('🔌 Tentative de connexion à la base de données...');
    
    pool = new Pool({ 
      connectionString: DATABASE_URL,
      max: 5,
      min: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    console.log('✅ Pool de connexion créé avec succès');

    // Test de connexion
    console.log('🔍 Test de requête simple...');
    const result = await pool.query('SELECT 1 as test, NOW() as timestamp');
    
    console.log('✅ Connexion réussie !');
    console.log(`📊 Résultat: ${JSON.stringify(result.rows[0])}`);

    // Test de création de table si nécessaire
    console.log('🔍 Test de création de table de test...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Table de test créée/vérifiée');

    // Test d'insertion
    console.log('🔍 Test d\'insertion...');
    const insertResult = await pool.query(
      'INSERT INTO test_connection (message) VALUES ($1) RETURNING *',
      ['Test de connexion LeadMirror']
    );
    console.log('✅ Insertion réussie');
    console.log(`📊 Données insérées: ${JSON.stringify(insertResult.rows[0])}`);

    // Test de lecture
    console.log('🔍 Test de lecture...');
    const selectResult = await pool.query('SELECT * FROM test_connection ORDER BY created_at DESC LIMIT 1');
    console.log('✅ Lecture réussie');
    console.log(`📊 Données lues: ${JSON.stringify(selectResult.rows[0])}`);

    console.log('\n🎉 Tous les tests de base de données sont réussis !');
    console.log('✅ La base de données est prête pour LeadMirror');

  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:');
    console.error(error.message);
    
    if (error.code) {
      console.error(`Code d'erreur: ${error.code}`);
    }
    
    if (error.detail) {
      console.error(`Détails: ${error.detail}`);
    }
    
    console.log('\n💡 Suggestions de dépannage :');
    console.log('   - Vérifiez que l\'URL de la base de données est correcte');
    console.log('   - Vérifiez que la base de données Neon est active');
    console.log('   - Vérifiez les paramètres SSL');
    console.log('   - Vérifiez les permissions de l\'utilisateur');
    
    process.exit(1);
  } finally {
    if (pool) {
      console.log('🔄 Fermeture de la connexion...');
      await pool.end();
      console.log('✅ Connexion fermée');
    }
  }
}

// Fonction principale
async function main() {
  try {
    await testDatabaseConnection();
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    process.exit(1);
  }
}

main(); 