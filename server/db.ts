import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon with WebSocket constructor and connection settings
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with optimized connection settings for Railway
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Reduced for Railway to avoid connection limits
  min: 1, // Keep minimum connections ready
  idleTimeoutMillis: 30000, // Reduced for Railway
  connectionTimeoutMillis: 10000, // Reduced timeout for acquiring connections
  // createRetryIntervalMillis: 100, // Retry connection creation quickly
  // Railway specific optimizations
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const db = drizzle({ client: pool, schema });

// Enhanced error handling for Railway
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

pool.on('connect', (client) => {
  console.log('New database connection established');
});

pool.on('remove', (client) => {
  console.log('Database connection removed from pool');
});

// Graceful shutdown for Railway
process.on('SIGINT', async () => {
  console.log('🔄 Fermeture gracieuse du pool de base de données...');
  try {
    await pool.end();
    console.log('✅ Pool de base de données fermé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture du pool:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Fermeture gracieuse du pool de base de données...');
  try {
    await pool.end();
    console.log('✅ Pool de base de données fermé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture du pool:', error);
  }
  process.exit(0);
});

// Health check function for Railway
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT 1 as test');
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    return false;
  }
}