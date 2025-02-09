import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { log } from './vite';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a connection pool with proper error handling and reconnection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  max: 20,
  idleTimeoutMillis: 30000,
});

// Add event handlers for the pool
pool.on('error', (err: Error) => {
  log(`Database pool error: ${err.message}`);
  // Don't exit on transient errors
  if (err.message.includes('Connection terminated') || 
      err.message.includes('Connection ended unexpectedly')) {
    log('Attempting to recover from connection error...');
    return;
  }
  log('Fatal database error, exiting...');
  process.exit(-1);
});

pool.on('connect', () => {
  log('New client connected to the pool');
});

// Test the connection
(async () => {
  try {
    const client = await pool.connect();
    log('Database connection test successful');
    client.release();
  } catch (err) {
    log(`Failed to connect to database: ${err}`);
    process.exit(-1);
  }
})();

export { pool };
export const db = drizzle(pool, { schema });