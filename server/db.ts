import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon with WebSocket constructor and connection settings
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

// Check if we're in development mode and DATABASE_URL is not set
const isDevelopmentWithoutDB = process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL;

if (!process.env.DATABASE_URL && !isDevelopmentWithoutDB) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a mock pool for development without database
let pool: Pool | null = null;
let db: any = null;

if (isDevelopmentWithoutDB) {
  console.log('⚠️ Mode développement sans base de données - certaines fonctionnalités seront limitées');
  
  // Create a mock database object
  db = {
    select: () => ({ from: () => [] }),
    insert: () => ({ values: () => ({ returning: () => [{ id: 'mock-id' }] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => [{ id: 'mock-id' }] }) }) }),
    delete: () => ({ where: () => ({ returning: () => [] }) }),
  };
  
  // Create a mock pool
  pool = {
    query: async () => ({ rows: [{ test: 1 }] }),
    end: async () => {},
    on: () => {},
  } as any;
} else {
  // Configure pool with optimized connection settings for Railway
  pool = new Pool({ 
    connectionString: process.env.DATABASE_URL!,
    max: 10, // Reduced for Railway to avoid connection limits
    min: 1, // Keep minimum connections ready
    idleTimeoutMillis: 30000, // Reduced for Railway
    connectionTimeoutMillis: 10000, // Reduced timeout for acquiring connections
    // createRetryIntervalMillis: 100, // Retry connection creation quickly
    // Railway specific optimizations
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  db = drizzle({ client: pool, schema });

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
}

export { pool, db };

// Graceful shutdown for Railway
process.on('SIGINT', async () => {
  console.log('🔄 Fermeture gracieuse du pool de base de données...');
  try {
    if (pool && !isDevelopmentWithoutDB) {
      await pool.end();
    }
    console.log('✅ Pool de base de données fermé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture du pool:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Fermeture gracieuse du pool de base de données...');
  try {
    if (pool && !isDevelopmentWithoutDB) {
      await pool.end();
    }
    console.log('✅ Pool de base de données fermé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture du pool:', error);
  }
  process.exit(0);
});

// Health check function for Railway
export async function checkDatabaseConnection(): Promise<boolean> {
  if (isDevelopmentWithoutDB) {
    console.log('📊 Mode développement sans base de données - health check simulé');
    return true;
  }
  
  try {
    const result = await pool!.query('SELECT 1 as test');
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    return false;
  }
}