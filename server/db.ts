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

// Configure pool with optimized connection settings for performance
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Increased for better concurrency
  min: 2, // Keep minimum connections ready
  idleTimeoutMillis: 60000, // Increased idle timeout
  connectionTimeoutMillis: 10000, // Increased connection timeout
  acquireTimeoutMillis: 30000, // Timeout for acquiring connections
  reapIntervalMillis: 1000, // Check for dead connections every second
  createRetryIntervalMillis: 200, // Retry connection creation quickly
});

export const db = drizzle({ client: pool, schema });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});